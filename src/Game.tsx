import * as React from "react";
import { useMachine } from "@xstate/react";
import gameMachine, { GameContext } from "./GameMachine";
import PlayerIcon from "./Components/PlayerIcon";
import ErrorBoundary from "./Components/ErrorBoundary";
import { Button, LinearProgress } from "@material-ui/core";

export const MAX_GEMS_PER_BOX = 100;
export const MAX_RISK_PER_BOX = 100;

export const Game = () => {
  const [current, send] = useMachine(gameMachine);

  const context = current.context as GameContext;

  const playerRef = context.playerRef;
  const playerState = playerRef.state;

  const riskPercent = context.currentBox
    ? (context.currentBox.risk / MAX_RISK_PER_BOX) * 100
    : 0;

  const gemPercent = context.currentBox
    ? (context.currentBox.gems / MAX_GEMS_PER_BOX) * 100
    : 0;

  return (
    <ErrorBoundary>
      <p>
        Gems:{" "}
        {Array(Math.floor(context.points / 10))
          .fill("💎")
          .map((item, index) => (
            <span role="img" aria-label="gem" key={index}>
              {item}
            </span>
          ))}
        {context.points}
      </p>
      {playerState.context.lives > 0 && (
        <div>
          Lives:{" "}
          {Array(playerState.context.lives)
            .fill("❤️")
            .map((item, index) => (
              <span role="img" aria-label="heart" key={index}>
                {item}
              </span>
            ))}{" "}
        </div>
      )}
      <p>Player is {playerState.value}</p>

      <PlayerIcon state={playerState.value as string} />

      {current.value === "playing" && playerState.value === "alive" && (
        <>
          <p>
            Box number {context.currentBox && context.currentBox.boxNumber}{" "}
            contains up to {context.currentBox && context.currentBox.gems} gems
          </p>
          <LinearProgress
            variant="determinate"
            color="primary"
            value={gemPercent}
          />
          {riskPercent > 0 && (
            <LinearProgress
              variant="determinate"
              color="secondary"
              value={riskPercent}
            />
          )}
          <Button onClick={() => send("ACCEPT_BOX")}>
            I'll take that risk
          </Button>
          {/* <button onClick={() => send("REJECT_BOX")}>Pass</button> */}
        </>
      )}

      {current.value !== "playing" && (
        <>
          <p>Gameover, you {current.value === "win" ? "won" : "lost"}</p>
          <button onClick={() => send("RESTART")}>Restart</button>
        </>
      )}

      {playerState.value === "respawning" && (
        <>
          <button onClick={() => send("RESPAWN_PLAYER")}>Respawn</button>
        </>
      )}
    </ErrorBoundary>
  );
};

export default Game;
