import Result from "./Result";

test("Result matches on ok or error", () => {
  type OkType = { textContent: string };
  type ErrType = { errMsg: string };
  const ok: OkType = { textContent: "I am ok" };
  const err: ErrType = { errMsg: "I am not ok" };
  const matcher = (result: Result<OkType, ErrType>): string =>
    result.match(
      (ok_res) => ok_res.textContent,
      (err_res) => err_res.errMsg
    );

  const err_content = matcher(Result.Err<OkType, ErrType>(err));
  expect(err_content).toEqual(err.errMsg);
  const ok_content = matcher(Result.Ok<OkType, ErrType>(ok));
  expect(ok_content).toEqual(ok.textContent);
});

test("Result unwraps ok", () => {
  type OkType = { textContent: string };
  type ErrType = { errMsg: string };
  const ok: OkType = { textContent: "I am ok" };

  expect(Result.Ok<OkType, ErrType>(ok).unwrap().textContent).toEqual(
    ok.textContent
  );
});
test("Error throws on unwrap", () => {
  type OkType = { textContent: string };
  type ErrType = { name: string; message: string };
  const err: ErrType = { name: "ErrType", message: "I am not ok" };

  expect(
    () => Result.Err<OkType, ErrType>(err).unwrap().textContent
  ).toThrowError(err);
});
