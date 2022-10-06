import { useState } from "react";
import { renderHTMLReact } from "../../utils";
import type { AnnotProps } from "../atoms/annotation.js";
import { useSelector } from "../atoms/derived.js";
import { AnnotDetailsView } from "./annot-details";
import Content from "./content";
import Header from "./header.jsx";

export const AnnotationPreview = ({ annotAtom: atom }: AnnotProps) => {
  return (
    <div className="annot-preview">
      <Header annotAtom={atom} />
      <Content annotAtom={atom} />
      <Comment annotAtom={atom} />
      <AnnotDetailsView annotAtom={atom} />
    </div>
  );
};

const Comment = ({ annotAtom }: AnnotProps) => {
  const comment = useSelector(annotAtom, ({ comment }) => comment);
  return comment ? (
    <div className="annot-comment">
      <p {...renderHTMLReact(comment)} />
    </div>
  ) : null;
};
