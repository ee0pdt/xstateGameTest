import { Machine, sendParent, assign } from "xstate";
import { MAX_GEMS_PER_BOX, MAX_RISK_PER_BOX } from "./Game";

const INITIAL_GEM_VALUE = 1;
const INITIAL_RISK_VALUE = 1;

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
          gems:
            context.gems < MAX_GEMS_PER_BOX
              ? Math.ceil(context.gems * 1.3)
              : MAX_GEMS_PER_BOX,
          risk:
            context.risk < MAX_RISK_PER_BOX
              ? context.gems < 50
                ? 0
                : context.risk + context.gems
              : MAX_RISK_PER_BOX
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
      gems: INITIAL_GEM_VALUE,
      risk: INITIAL_RISK_VALUE,
      boxNumber: 1
    },
    on: {
      RESET: {
        actions: [
          assign((context: BoxContext, event: BoxEvent) => ({
            gems: INITIAL_GEM_VALUE,
            risk: INITIAL_RISK_VALUE,
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
