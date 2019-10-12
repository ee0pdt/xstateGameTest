import * as React from "react";

export const PlayerIcon = (props: { state: string }) => {
  switch (props.state) {
    case "alive": {
      return (
        <span role="img" aria-label="alive">
          🙂
        </span>
      );
    }
    case "dying": {
      return (
        <span role="img" aria-label="dying">
          🤢
        </span>
      );
    }
    case "dead":
    case "respawning": {
      return (
        <span role="img" aria-label="dead">
          😵
        </span>
      );
    }
    default: {
      return <span />;
    }
  }
};

export default PlayerIcon;
