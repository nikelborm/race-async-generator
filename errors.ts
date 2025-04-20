export class ErrorInRacingPromise<
  Index extends number = number,
  Error extends unknown = unknown,
> extends Error {
  promiseIndex: Index;
  override cause?: Error;

  constructor({ index, error }: { index: Index; error: Error }) {
    super('One of the racing promises failed');
    this.promiseIndex = index;
    this.cause = error;
  }
}

export class RacingPromisePostponedErrorsAggregatedIntoOne extends AggregateError {
  override errors: ErrorInRacingPromise[];

  constructor(errors: ErrorInRacingPromise[]) {
    super(errors, 'Few of the racing promises failed');
    this.errors = errors;
  }
}

export const isErrorInRacingPromise = (e: unknown): e is ErrorInRacingPromise =>
  e instanceof ErrorInRacingPromise;

export const isManyPostponedErrorsInRacingPromises = (
  e: unknown,
): e is RacingPromisePostponedErrorsAggregatedIntoOne =>
  e instanceof RacingPromisePostponedErrorsAggregatedIntoOne;
