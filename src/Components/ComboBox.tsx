import React from 'react';
import { SelectValue, NO_SELECTION } from '../State';

interface Props {
  selectState: SelectValue,
  values: string[],
  selected: string,
  id: string,
  isAutofocus: boolean,
  label: string,
}

const options = (props: Props): JSX.Element[] => {
  const { values, selectState, selected } = props;
  if (selectState === SelectValue.NotLoaded) return [<span>{NO_SELECTION}</span>];
  if (selectState === SelectValue.Loading) return [<span>"Loading..."</span>];
  return values.map(
    (value) => <option value={value} selected={value === selected}>{value}</option>
  )
}

const ComboBox = (props: Props): React.ReactElement => {
  const { selectState, id, label } = props;
  const className = selectState === SelectValue.Loading ? "loading" : "";
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <select name={id} id={id} className={className} autoFocus={props.isAutofocus}>
        {options(props)}
      </select>
    </div>

  );
}
export default ComboBox;
