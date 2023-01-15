import { D } from "@mobily/ts-belt";
import type { AnnotationInfo, TagInfo } from "@obzt/database";
import { getBacklink } from "@obzt/database";
import { useBoolean, useMemoizedFn } from "ahooks";
import { useContext, useRef } from "react";
import { Obsidian } from "../context";
import AnnotDetailsView from "./AnnotDetailsView";
import Comment from "./Comment";
import Content from "./Content";
import Excerpt from "./Excerpt";
import Header from "./Header";
import { useAnnotHelper, useAnnotRenderer } from "./hooks/useAnnotHelper";
import { useAnnotIcon } from "./hooks/useAnnotIcon";
import { useImgSrc } from "./hooks/useImgSrc";
import PageLabel from "./PageLabel";
import Tags from "./Tags";

export interface AnnotPreviewProps {
  annotation: AnnotationInfo;
  tags: TagInfo[] | undefined;
}

export default function AnnotPreview({ annotation, tags }: AnnotPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const helper = useAnnotHelper(annotation);
  const renderText = useAnnotRenderer(annotation);

  const { onMoreOptions: handleMoreOptions, onDragStart: handleDragStart } =
    useContext(Obsidian);

  const [showDetails, { toggle: toggleDetails }] = useBoolean(false);

  const excerptProps = D.selectKeys(annotation, ["type", "text", "pageLabel"]);

  return (
    <div className="annot-preview">
      <Header
        type={annotation.type}
        color={annotation.color}
        icon={useAnnotIcon(annotation.type)}
        onMoreOptions={useMemoizedFn((evt) =>
          handleMoreOptions(evt, annotation),
        )}
        draggable={Boolean(renderText)}
        onDragStart={useMemoizedFn((evt) =>
          handleDragStart(evt, renderText, containerRef.current),
        )}
        showDetails={showDetails}
        onDetailsToggled={toggleDetails}
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
      {helper && <AnnotDetailsView {...{ showDetails, helper }} />}
    </div>
  );
}
