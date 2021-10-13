import React from "react";
import ComboBox from "./Components/ComboBox";
import CheckBox from "./Components/CheckBox";
import CommandPanel from "./Components/CommandPanel";
import { State, SelectValue } from "./State";

type Props = { state: State };

const App = (props: Props): JSX.Element => {
  const { state } = props;
  return (
    <div>
      <h1>aqt list-qt server</h1>
      <ComboBox
        content={state.host}
        id="host"
        children="Choose an OS:"
        isAutofocus={true}
      />
      <ComboBox
        content={state.target}
        id="target"
        children="Choose a target:"
        isAutofocus={false}
      />
      <ComboBox
        content={state.version}
        id="version"
        children="Choose a version:"
        isAutofocus={false}
      />
      <ComboBox
        content={state.arch}
        id="arch"
        children="Choose an arch:"
        isAutofocus={false}
      />
    </div>
  );
};
export default App;
