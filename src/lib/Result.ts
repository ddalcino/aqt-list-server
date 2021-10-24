/**
 * oops I got some Rust patterns in my Typescript!
 * https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html
 */

const enum Status {
  Ok,
  Err,
}
class Result<Ok, Err> {
  private constructor(private status: Status, private content: Ok | Err) {}

  public match<OkOut, ErrOut>(
    ok: (content: Ok) => OkOut,
    err: (content: Err) => ErrOut
  ): OkOut | ErrOut {
    switch (this.status) {
      case Status.Ok:
        return ok(this.content as Ok);
      case Status.Err:
        return err(this.content as Err);
    }
  }
  public unwrap(): Ok {
    return this.match<Ok, Ok>(
      (res) => res,
      (err) => {
        throw err;
      }
    );
  }
  public static Ok<Ok, Err>(content: Ok): Result<Ok, Err> {
    return new Result<Ok, Err>(Status.Ok, content);
  }
  public static Err<Ok, Err>(content: Err): Result<Ok, Err> {
    return new Result<Ok, Err>(Status.Err, content);
  }
}

export default Result;
