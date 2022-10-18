import type { Atom } from "jotai";

export const GLOBAL_SCOPE = Symbol("jotai-scope-global");

export const weakAtomFamily = <
  Param extends object,
  AtomType extends Atom<unknown>,
>(
  initializeAtom: (param: Param) => AtomType,
) => {
  const atoms = new WeakMap<Param, AtomType>();
  return (obj: Param) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (atoms.has(obj)) return atoms.get(obj)!;
    const newAtom = initializeAtom(obj);
    atoms.set(obj, newAtom);
    return newAtom;
  };
};
