import { Machine, sendParent, assign } from "xstate";

export interface BoxStateSchema {
  states: {
    countdown: {
      states: {
        idle: {};
        dropGems: {};
      };
    };
    rejected: {};
    accepted: {};
  };
}

export type BoxEvent =
  | { type: "ACCEPT" }
  | { type: "REJECT" }
  | { type: "RESET" };

export type BoxContext = {
  gems: number;
  risk: number;
  boxNumber: number;
};

const countdownStates = {
  states: {
    idle: {
      after: {
        100: "dropGems"
      }
    },
    dropGems: {
      exit: ["notifyParentOfRiskReward"],
      after: {
        100: "idle"
      },
      entry: [
        assign((context: BoxContext, event: BoxEvent) => ({
          gems: context.gems - 2
        }))
      ]
    }
  }
};

export const boxMachine = Machine<BoxContext, BoxStateSchema, BoxEvent>(
  {
    id: "box",
    initial: "countdown",
    context: {
      gems: Math.round(Math.random() * 200),
      risk: Math.round(Math.random() * 50),
      boxNumber: 1
    },
    on: {
      RESET: {
        actions: [
          assign((context: BoxContext, event: BoxEvent) => ({
            gems: Math.round(Math.random() * 100),
            risk: Math.round(Math.random() * 100),
            boxNumber: context.boxNumber + 1
          }))
        ],
        target: "countdown"
      }
    },
    states: {
      countdown: {
        // entry: ["notifyParentOfRiskReward"],
        on: {
          ACCEPT: {
            target: "accepted"
          }
        },
        initial: "idle",
        ...countdownStates
      },
      accepted: {
        entry: ["spinWheelOfDeath"]
      },
      rejected: {}
    }
  },
  {
    actions: {
      notifyParentOfRiskReward: sendParent<BoxContext, null>(
        (context: BoxContext) => ({
          type: "NOTIFY_BOX_CONTENTS",
          data: context
        })
      ),
      spinWheelOfDeath: sendParent<BoxContext, null>((context: BoxContext) => ({
        type:
          Math.random() * 100 > context.risk
            ? "NOTIFY_BOX_WIN"
            : "NOTIFY_BOX_EXPLODE",
        data: context
      })),
      notifyParentOfRejection: sendParent<BoxContext, null>(
        (context: BoxContext) => ({ type: "REJECT_BOX", data: context })
      )
    }
  }
);

export default boxMachine;
