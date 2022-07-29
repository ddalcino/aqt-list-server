import React from "react";
import { render } from "@testing-library/react";
import CheckBox from "./CheckBox";

test.skip("renders a checkbox", () => {
  const [id, name, isChecked] = ["myId", "This_is_ok", true];
  let hasFiredCallback = false;
  const { getByText } = render(
    <CheckBox
      id={id}
      name={name}
      pkg={null}
      isChecked={isChecked}
      onChange={() => {
        hasFiredCallback = true;
      }}
    />
  );
  const linkElement = getByText(/something/i);
  expect(linkElement).toBeInTheDocument();
});
