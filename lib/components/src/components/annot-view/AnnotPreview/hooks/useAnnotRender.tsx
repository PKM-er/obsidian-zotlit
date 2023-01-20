import type { AnnotationInfo } from "@obzt/database";
import { useContext } from "react";
import { useStore } from "zustand";
import { shallow } from "zustand/shallow";
import { Context } from "../../context";

export const useAnnotRenderer = (annotation: AnnotationInfo) => {
  const { annotRenderer, store } = useContext(Context);
  const props = useStore(store, annotRenderer.storeSelector, shallow);
  return annotRenderer.get(annotation, props);
};
