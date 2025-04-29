type PromiseBuilder<T = unknown> = (signal: AbortSignal) => Promise<T>;

export type PromiseOrPromiseBuilder<T = unknown> =
  | Promise<T>
  | PromiseBuilder<T>;

export type GetAUnionOfResolvedResults<
  PromiseOrBuilderArray extends PromiseOrPromiseBuilder[],
  // handling case where PromiseOrBuilderArray is not an ideal tuple with known length
> = [number] extends [PromiseOrBuilderArray['length']]
  ? {
      index: number;
      result: PromiseOrBuilderArray extends PromiseOrPromiseBuilder<infer U>[]
        ? U
        : 'never';
    }
  : {
      [ArrayKey in keyof PromiseOrBuilderArray]: [
        ArrayKey,
        PromiseOrBuilderArray[ArrayKey],
      ] extends [
        `${infer ArrayIndex extends number}`,
        PromiseOrPromiseBuilder<infer Returned>,
      ]
        ? {
            index: ArrayIndex;
            result: Returned;
          }
        : never;
    }[number];

export type RacingAsyncGenerator<
  PromiseOrBuilderArray extends PromiseOrPromiseBuilder[],
> = AsyncGenerator<
  GetAUnionOfResolvedResults<PromiseOrBuilderArray>,
  void,
  void
>;

// TODO: type tests for mixed, non-mixed, empty tuples and the same for arrays

// type Indexes<T extends unknown[]> = Exclude<
//   Partial<T>["length"],
//   Required<T>["length"]
// >;
