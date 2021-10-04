import React from 'react';
import ComboBox from './Components/ComboBox';
import { SelectState, SelectValue } from './State';

const App = () => {
  return (
    <div>
      <h1>Typescript</h1>
      <ComboBox
        selectState={SelectValue.Loaded}
        values={["windows", "mac", "linux"]}
        selected="linux"
        id="host"
        label="Choose an OS:"
        isAutofocus={true} />
    </div>
  )
}
export default App;
