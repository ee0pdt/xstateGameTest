import * as React from "react";
import { render } from "react-dom";
import Game from "./Game";

import "./styles.css";

function App() {
  return <Game />;
}

const rootElement = document.getElementById("root");
render(<App />, rootElement);
