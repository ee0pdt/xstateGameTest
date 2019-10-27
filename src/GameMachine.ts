import { Machine, spawn, send, assign } from "xstate";
import playerMachine, { PlayerContext, PlayerEvent } from "./PlayerMachine";
import { Actor } from "xstate/lib/Actor";
import boxMachine, { BoxContext, BoxEvent } from "./BoxMachine";
import { log } from "xstate/lib/actions";

const WIN_POINTS = 10000;

export interface GameStateSchema {
  states: {
    playing: {};
    win: {};
    lose: {};
  };
}

export type EVENT_AWARD_POINTS = { type: "AWARD_POINTS"; total: number };
export type EVENT_NOTIFY_BOX_CONTENTS = {
  type: "NOTIFY_BOX_CONTENTS";
  data: BoxContext;
};

export type GameEvent =
  | EVENT_AWARD_POINTS
  | EVENT_NOTIFY_BOX_CONTENTS
  | { type: "SHOOT_PLAYER" }
  | { type: "RESPAWN_PLAYER" }
  | { type: "PLAYER_DIED" }
  | { type: "NOTIFY_BOX_WIN" }
  | { type: "NOTIFY_BOX_EXPLODE" }
  | { type: "ACCEPT_BOX" }
  | { type: "REJECT_BOX" }
  | { type: "NEW_BOX" }
  | { type: "RESTART" };

export type GameContext = {
  points: number;
  playerRef?: Actor<PlayerContext, PlayerEvent>;
  boxRef?: Actor<BoxContext, BoxEvent>;
  currentBox?: BoxContext;
  winPoints: number;
};

const INITIAL_STATE = {
  points: 0,
  playerRef: undefined,
  boxRef: undefined,
  currentBox: undefined,
  winPoints: WIN_POINTS
};

export const gameMachine = Machine<GameContext, GameStateSchema, GameEvent>(
  {
    id: "game",
    initial: "playing",
    context: INITIAL_STATE,
    on: {
      RESTART: {
        target: "playing"
        // actions: [
        //   () => spawn(boxMachine),
        //   () => spawn(playerMachine, { sync: true })
        // ]
      }
    },
    states: {
      win: {},
      lose: {},
      playing: {
        entry: assign<GameContext>({
          ...INITIAL_STATE,
          playerRef: context =>
            context.playerRef === undefined &&
            spawn(playerMachine, { sync: true }),
          boxRef: context => context.boxRef === undefined && spawn(boxMachine)
        }),
        on: {
          "": [{ target: "win", cond: "didPlayerWin" }],
          AWARD_POINTS: {
            actions: assign<GameContext>({
              points: (context: GameContext, event: EVENT_AWARD_POINTS) =>
                context.points + event.total
            })
          },
          SHOOT_PLAYER: {
            actions: send("LOSE_LIFE", {
              to: context => context.playerRef
            })
          },
          RESPAWN_PLAYER: {
            actions: ["newBox", "respawn"]
          },
          PLAYER_DIED: {
            target: "lose",
            actions: log(
              (context: GameContext, event: GameEvent) =>
                `count: ${context.points}, event: ${event.type}`,
              "Finish label"
            )
          },
          ACCEPT_BOX: {
            actions: send("ACCEPT", {
              to: context => context.boxRef
            })
          },
          REJECT_BOX: {
            actions: ["newBox"]
          },
          NOTIFY_BOX_CONTENTS: {
            actions: [
              assign(
                (context: GameContext, event: EVENT_NOTIFY_BOX_CONTENTS) => ({
                  currentBox: event.data
                })
              )
            ]
          },
          NOTIFY_BOX_WIN: {
            actions: ["awardBoxWinnings", "newBox"]
          },
          NOTIFY_BOX_EXPLODE: {
            actions: ["handleExplosion", "newBox"]
          },
          NEW_BOX: {
            actions: ["newBox"]
          }
        }
      }
    }
  },
  {
    actions: {
      awardBoxWinnings: assign(
        (context: GameContext, event: EVENT_NOTIFY_BOX_CONTENTS) => ({
          points: context.points + Math.round(Math.random() * event.data.gems)
        })
      ),
      resetGame: assign(
        (context: GameContext, event: GameEvent) => INITIAL_STATE
      ),
      newBox: send("RESET", {
        to: context => context.boxRef
      }),
      handleExplosion: send("SHOOT_PLAYER"),
      respawn: send("RESPAWN", {
        to: context => context.playerRef
      })
    },
    guards: {
      didPlayerWin: (context: GameContext, event: GameEvent) => {
        // check if player won
        return context.points > WIN_POINTS;
      }
    }
  }
);

export default gameMachine;
