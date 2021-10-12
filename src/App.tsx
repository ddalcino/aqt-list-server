import React from "react";
import ComboBox from "./Components/ComboBox";
import CheckBox from "./Components/CheckBox";
import CommandPanel from "./Components/CommandPanel";
import { State, SelectValue } from "./State";

const App = (state: State): React.ReactNode => {
  return (
    <div>
      <h1>aqt list-qt server</h1>
      <ComboBox
        selectState={SelectValue.Loaded}
        values={["windows", "mac", "linux"]}
        selected="linux"
        id="host"
        children="Choose an OS:"
        isAutofocus={true}
      />
      <ComboBox
        selectState={SelectValue.NotLoaded}
        values={[]}
        selected=""
        id="arch"
        children="Choose an arch:"
        isAutofocus={false}
      />
      <ComboBox
        selectState={SelectValue.Loading}
        values={[]}
        selected=""
        id="ext"
        children="Choose an ext:"
        isAutofocus={false}
      />
    </div>
  );
};
export default App;
