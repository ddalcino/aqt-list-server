import React from "react";
import { render } from "@testing-library/react";
import CheckBox from "./CheckBox";

test("renders a checkbox", () => {
  const [id, name, isChecked] = ["myId", "This_is_ok", true];
  let hasFiredCallback = false;
  const { getByText } = render(
    <CheckBox
      id={id}
      name={name}
      isChecked={isChecked}
      onChange={() => {
        hasFiredCallback = true;
      }}
    />
  );
  const linkElement = getByText(/something/i);
  expect(linkElement).toBeInTheDocument();
});
