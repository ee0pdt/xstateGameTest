import * as React from "react";
import { useMachine } from "@xstate/react";
import { Machine, spawn, send, sendParent } from "xstate";
import { assign } from "xstate";

const playerMachine = Machine(
  {
    id: "player",
    initial: "alive",
    context: {
      lives: 3
    },
    states: {
      alive: {
        on: {
          "": [{ target: "dead", cond: "noLivesLeft" }],
          LOSE_LIFE: {
            actions: assign({
              lives: context => context.lives - 1
            })
          }
        }
      },
      dead: {
        on: {
          entry: {
            actions: sendParent(context => ({
              type: "PLAYER_DIED",
              data: context
            }))
          }
        }
      }
    }
  },
  {
    guards: {
      noLivesLeft: (context, event) => {
        // check if player won
        return context.lives < 1;
      }
    }
  }
);

const gameMachine = Machine(
  {
    id: "game",
    initial: "playing",
    context: {
      points: 0,
      playerRef: null
    },
    states: {
      playing: {
        entry: assign({
          playerRef: () => spawn(playerMachine, { sync: true })
        }),
        on: {
          // Transient transition
          // Will transition to either 'win' or 'lose' immediately upon
          // (re)entering 'playing' state if the condition is met.
          "": [{ target: "win", cond: "didPlayerWin" }],
          // Self-transition
          AWARD_POINTS: {
            actions: assign({
              points: context => context.points + 50
            })
          },
          SHOOT_PLAYER: {
            actions: send("LOSE_LIFE", {
              to: context => context.playerRef
            })
          },
          PLAYER_DIED: {
            target: "lose"
          }
        }
      },
      win: {
        on: {
          RESTART: {
            target: "playing",
            actions: assign({ points: 0 })
          }
        }
      },
      lose: {
        on: {
          RESTART: {
            target: "playing",
            actions: assign({ points: 0 })
          }
        }
      }
    }
  },
  {
    guards: {
      didPlayerWin: (context, event) => {
        // check if player won
        return context.points > 99;
      }
    }
  }
);

export const Game = () => {
  const [current, send] = useMachine(gameMachine);

  if (current.value !== "playing") {
    return (
      <>
        <p>Gameover, you {current.value === "win" ? "won" : "lost"}</p>
        <button onClick={() => send("RESTART")}>Restart</button>
      </>
    );
  }

  return (
    <>
      <p>You have {current.context.points} XP</p>
      <p>You have {current.context.playerRef.state.context.lives} lives</p>
      <button onClick={() => send("AWARD_POINTS")}>Give me points</button>
      <button onClick={() => send("SHOOT_PLAYER")}>Shoot Player</button>
    </>
  );
};

export default Game;
