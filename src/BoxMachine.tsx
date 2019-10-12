import { Machine, sendParent, assign, send } from "xstate";
import { GameEvent } from "./GameMachine";

export interface BoxStateSchema {
  states: {
    presented: {};
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
  cost: number;
};

export const boxMachine = Machine<BoxContext, BoxStateSchema, BoxEvent>(
  {
    id: "box",
    initial: "presented",
    context: {
      gems: Math.round(Math.random() * 100),
      cost: Math.round(Math.random() * 20),
      risk: Math.round(Math.random() * 100)
    },
    on: {
      RESET: {
        actions: [
          assign((context: BoxContext, event: BoxEvent) => ({
            gems: Math.round(Math.random() * 100)
          })),
          assign((context: BoxContext, event: BoxEvent) => ({
            risk: Math.round(Math.random() * 100)
          })),
          assign((context: BoxContext, event: BoxEvent) => ({
            cost: Math.round(Math.random() * 20)
          }))
        ],
        target: "presented"
      }
    },
    states: {
      presented: {
        entry: ["notifyParentOfRiskReward"],
        on: {
          ACCEPT: {
            target: "accepted"
          }
        }
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
