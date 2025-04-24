import {
  ErrorInRacingPromise,
  RacingPromisePostponedErrorsAggregatedIntoOne,
} from './errors.ts';
import type {
  GetAUnionOfResolvedResults,
  PromiseOrPromiseBuilder,
  RacingAsyncGenerator,
} from './types.ts';

export function racinglyIterateAll<
  // this union is a hint to register this parameter as a fixed length tuple
  // when possible
  U extends PromiseOrPromiseBuilder[] | [],
>(
  promises: U,
  {
    ifOneOfThePromisesRejectsFailWhen,
    signal: externalSignal,
    timeoutMs,
  }: {
    ifOneOfThePromisesRejectsFailWhen?: 'firstReject' | 'allSettled';
    signal?: AbortSignal;
    timeoutMs?: number;
  } = {},
): RacingAsyncGenerator<U> {
  ifOneOfThePromisesRejectsFailWhen ??= 'firstReject';
  const controller = new AbortController();

  const abort = () => controller.abort();

  if (timeoutMs) var timeoutHandle = setTimeout(abort, timeoutMs);

  externalSignal?.addEventListener('abort', abort);

  const notYieldedRacerToItsIndexMap = new Map(
    promises.map((promiseOrPromiseBuilder, index) => [
      index,
      (typeof promiseOrPromiseBuilder === 'function'
        ? promiseOrPromiseBuilder(controller.signal)
        : promiseOrPromiseBuilder
      ).then(
        result => ({ index, result }),
        error => ({ index, error }),
      ) as Promise<GetAUnionOfResolvedResults<U>>,
    ]),
  );

  const cleanup = () => {
    if (timeoutMs) clearTimeout(timeoutHandle);

    console.log('racinglyIterateAll cleanup');
    externalSignal?.removeEventListener('abort', abort);
    notYieldedRacerToItsIndexMap.clear();
    controller.abort();
  };

  const errors: ErrorInRacingPromise[] = [];

  const done = { value: undefined, done: true } as const;

  type This = RacingAsyncGenerator<U>;

  return {
    [Symbol.asyncIterator](this: This) {
      return this;
    },

    async [Symbol.asyncDispose]() {
      cleanup();
    },

    async next(
      // This throw method signature override is here and not where
      // RacingGenerator type is declared because typescript is stupid
      this: Omit<This, 'throw'> & {
        throw(e: unknown): never;
      },
    ) {
      if (notYieldedRacerToItsIndexMap.size === 0) return this.return();

      controller.signal.throwIfAborted();

      // remember that Promise.race may hang if given empty iterator. In current
      // condition we already checking for that with in the beginning of the
      // `next` method. Also, this race never throws, because I remap all
      // promise failures to simple wrapper objects
      const racer = await Promise.race(notYieldedRacerToItsIndexMap.values());

      notYieldedRacerToItsIndexMap.delete(racer.index);

      if ('result' in racer) return { value: racer, done: false };

      const racingIterationError = new ErrorInRacingPromise(racer);

      if (ifOneOfThePromisesRejectsFailWhen === 'firstReject')
        this.throw(racingIterationError);

      errors.push(racingIterationError);

      return await this.next();
    },

    async return(this: This) {
      cleanup();

      if (errors.length)
        throw new RacingPromisePostponedErrorsAggregatedIntoOne(errors);

      return done;
    },

    throw(this: This, error: unknown): never {
      cleanup();
      throw error;
    },
  };
}
