import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { makeState } from "./State";

const defaultState = makeState();

ReactDOM.render(
  <React.StrictMode>
    <App state={defaultState} />
  </React.StrictMode>,
  document.getElementById("root")
);
