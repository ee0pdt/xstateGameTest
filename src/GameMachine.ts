import { Machine, spawn, send, assign } from "xstate";
import playerMachine, { PlayerContext, PlayerEvent } from "./PlayerMachine";
import { Actor } from "xstate/lib/Actor";
import boxMachine, { BoxContext, BoxEvent } from "./BoxMachine";
import { log } from "xstate/lib/actions";

export interface GameStateSchema {
  states: {
    playing: {};
    win: {};
    lose: {};
  };
}

interface IBox {
  gems: number;
  risk: number;
}

export type EVENT_AWARD_POINTS = { type: "AWARD_POINTS"; total: number };
export type EVENT_NOTIFY_BOX_CONTENTS = {
  type: "NOTIFY_BOX_CONTENTS";
  data: IBox;
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
  currentBox?: IBox;
  boxNumber: number;
};

export const gameMachine = Machine<GameContext, GameStateSchema, GameEvent>(
  {
    id: "game",
    initial: "playing",
    context: {
      points: 0,
      playerRef: undefined,
      boxRef: undefined,
      currentBox: undefined,
      boxNumber: 0
    },
    on: {
      RESTART: {
        target: "playing",
        actions: ["resetGame"]
      }
    },
    states: {
      win: {},
      lose: {},
      playing: {
        entry: assign<GameContext>({
          playerRef: () => spawn(playerMachine, { sync: true }),
          boxRef: () => spawn(boxMachine)
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
            actions: send("RESPAWN", {
              to: context => context.playerRef
            })
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
              ),
              assign(
                (context: GameContext, event: EVENT_NOTIFY_BOX_CONTENTS) => ({
                  boxNumber: context.boxNumber + 1
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
      resetGame: assign((context: GameContext, event: GameEvent) => ({
        points: 0
      })),
      newBox: send("RESET", {
        to: context => context.boxRef
      }),
      handleExplosion: send("SHOOT_PLAYER")
    },
    guards: {
      didPlayerWin: (context: GameContext, event: GameEvent) => {
        // check if player won
        return context.points > 99;
      }
    }
  }
);

export default gameMachine;
