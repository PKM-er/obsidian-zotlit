import { D } from "@mobily/ts-belt";
import type { AnnotationInfo, TagInfo } from "@obzt/database";
import { getBacklink } from "@obzt/database";
import { useMemoizedFn } from "ahooks";
import { useContext, useRef } from "react";
import { Context } from "../context";

import Comment from "./Comment";
import Content from "./Content";
import Excerpt from "./Excerpt";
import Header from "./Header";
import { useAnnotIcon } from "./hooks/useAnnotIcon";
import { useAnnotRenderer } from "./hooks/useAnnotRender";
import { useImgSrc } from "./hooks/useImgSrc";
import PageLabel from "./PageLabel";
import Tags from "./Tags";

export interface AnnotPreviewProps {
  annotation: AnnotationInfo;
  tags: TagInfo[] | undefined;
}

export default function AnnotPreview({ annotation, tags }: AnnotPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    onMoreOptions: handleMoreOptions,
    onDragStart: handleDragStart,
    onShowDetails,
  } = useContext(Context);

  const excerptProps = D.selectKeys(annotation, ["type", "text", "pageLabel"]);
  const renderer = useAnnotRenderer(annotation);

  return (
    <div className="annot-preview">
      <Header
        type={annotation.type}
        color={annotation.color}
        icon={useAnnotIcon(annotation.type)}
        onMoreOptions={useMemoizedFn((evt) =>
          handleMoreOptions(evt, annotation),
        )}
        draggable={renderer !== null}
        onDragStart={useMemoizedFn(
          (evt) =>
            renderer && handleDragStart(evt, renderer, containerRef.current),
        )}
        onDetailsToggled={useMemoizedFn(() => onShowDetails(annotation.itemID))}
      >
        <PageLabel
          pageLabel={annotation.pageLabel}
          backlink={getBacklink(annotation)}
        />
      </Header>
      <Content ref={containerRef}>
        <blockquote
          style={{ borderColor: annotation.color ?? undefined ?? undefined }}
        >
          <Excerpt {...excerptProps} imgSrc={useImgSrc(annotation)} />
        </blockquote>
      </Content>
      {annotation.comment && <Comment content={annotation.comment} />}
      {tags && <Tags tags={tags} />}
    </div>
  );
}
