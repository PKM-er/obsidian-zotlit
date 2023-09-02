type ObjectGroupByFunction = {
  <T>(
    obj: T,
    predicate: (value: T, index: number, array: T[]) => string,
  ): Record<string, T[]>;
};
type MapGroupByFunction = {
  <T>(obj: T, predicate: (value: T, index: number, array: T[]) => string): Map<
    string,
    T[]
  >;
};
declare module "core-js-pure/full/object/group-by" {
  const shim: ObjectGroupByFunction;
  export default shim;
}

declare module "core-js-pure/full/map/group-by" {
  const shim: MapGroupByFunction;
  export default shim;
}
