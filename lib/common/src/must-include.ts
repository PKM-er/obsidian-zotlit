type ValueOf<T> = T[keyof T];

type NonEmptyArray<T> = [T, ...T[]];

type MustInclude<T, U extends T[]> = [T] extends [ValueOf<U>] ? U : never;

export const enumerate =
  <T>() =>
  <U extends NonEmptyArray<T>>(...elements: MustInclude<T, U>) =>
    elements;

// Alternative:
// type Invalid<T> = ["Needs to be all of", T];
// const arrayOfAll =
//   <T>() =>
//   <U extends T[]>(
//     ...array: U & ([T] extends [U[number]] ? unknown : Invalid<T>[])
//   ) =>
//     array;
