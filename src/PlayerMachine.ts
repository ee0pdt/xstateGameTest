import { Machine, assign, sendParent } from "xstate";

export interface PlayerStateSchema {
  states: {
    alive: {};
    dying: {};
    dead: {};
    respawning: {};
  };
}

export type PlayerEvent = { type: "LOSE_LIFE" } | { type: "RESPAWN" };

export type PlayerContext = {
  lives: number;
};

export const playerMachine = Machine<
  PlayerContext,
  PlayerStateSchema,
  PlayerEvent
>(
  {
    id: "player",
    initial: "alive",
    context: {
      lives: 3
    },
    states: {
      alive: {
        on: {
          "": [{ target: "dying", cond: "noLivesLeft" }],
          LOSE_LIFE: {
            actions: assign<PlayerContext>({
              lives: (context: PlayerContext) => context.lives - 1
            }),
            target: "respawning"
          }
        }
      },
      respawning: {
        on: {
          "": [{ target: "dying", cond: "noLivesLeft" }],
          RESPAWN: {
            target: "alive"
          }
        }
      },
      dying: {
        after: {
          1000: [{ target: "dead" }]
        }
      },
      dead: {
        entry: ["notifyParentOfDeath"]
      }
    }
  },
  {
    actions: {
      notifyParentOfDeath: sendParent("PLAYER_DIED")
    },
    guards: {
      noLivesLeft: (context: PlayerContext, event: PlayerEvent) => {
        // check if player won
        return context.lives < 1;
      }
    }
  }
);

export default playerMachine;
