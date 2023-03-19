import type { ObsidianContextType } from "@obzt/components";
import { Component, MarkdownRenderer, setIcon } from "obsidian";
import type { RefCallback } from "react";
import { useRef } from "react";

export const context: ObsidianContextType = {
  sanitize: DOMPurify.sanitize.bind(DOMPurify),
  setIcon,
  renderMarkdown(content) {
    return <Markdown content={content} />;
  },
};

function Markdown({ content }: { content: string }) {
  const componentRef = useRef<Component | null>(null);
  const ref: RefCallback<HTMLDivElement> = (node) => {
    if (node) {
      node.empty();
      if (componentRef.current) {
        componentRef.current.unload();
      }
      componentRef.current = new Component();
      MarkdownRenderer.renderMarkdown(content, node, "", componentRef.current);
    } else {
      if (componentRef.current) {
        componentRef.current.unload();
        componentRef.current = null;
      }
    }
  };
  return <div className="contents" ref={ref} />;
}
