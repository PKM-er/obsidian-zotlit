import { D } from "@mobily/ts-belt";
import type { AnnotationInfo, TagInfo } from "@obzt/database";
import { getBacklink } from "@obzt/database";
import { useMemoizedFn } from "ahooks";
import type { ReactNode } from "react";
import { useContext, useRef } from "react";
import type { Attributes } from "@c/utils";
import { cn as clsx } from "@c/utils";
import { Context } from "../context";
import DetailsButton from "../DetailsButton";

import Comment from "./Comment";
import Content from "./Content";
import Excerpt from "./Excerpt";
import Header from "./Header";
import HeaderIcon from "./HeaderIcon";
import { useAnnotIcon } from "./hooks/useAnnotIcon";
import { useAnnotRenderer } from "./hooks/useAnnotRender";
import { useImgSrc } from "./hooks/useImgSrc";
import MoreOptionsButton from "./MoreOptionsButton";
import PageLabel from "./PageLabel";
import Tags from "./Tags";

export interface AnnotPreviewProps extends Attributes {
  collapsed?: boolean;
  checkbox: ReactNode;
  annotation: AnnotationInfo;
  tags: TagInfo[] | undefined;
}

export default function Annotation({
  collapsed = false,
  annotation,
  checkbox,
  tags,
  className,
  ...props
}: AnnotPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    onMoreOptions,
    onDragStart: handleDragStart,
    onShowDetails,
  } = useContext(Context);

  const excerptProps = D.selectKeys(annotation, ["type", "text", "pageLabel"]);
  const renderer = useAnnotRenderer(annotation);
  const handleMoreOptions = useMemoizedFn((evt) =>
      onMoreOptions(evt, annotation),
    ),
    handleShowDetails = useMemoizedFn(() =>
      onShowDetails("annot", annotation.itemID),
    );

  return (
    <div
      className={clsx(
        "annot-preview",
        "bg-primary shadow-border col-span-1 flex flex-col divide-y overflow-auto rounded-sm transition-colors",
        className,
      )}
      data-id={annotation.itemID}
      {...props}
    >
      <Header
        className="bg-primary-alt py-1 pl-2 pr-1"
        checkbox={checkbox}
        drag={
          <HeaderIcon
            type={annotation.type}
            color={annotation.color}
            icon={useAnnotIcon(annotation.type)}
            draggable={renderer !== null}
            onDragStart={useMemoizedFn(
              (evt) =>
                renderer &&
                handleDragStart(evt, renderer, containerRef.current),
            )}
            size={16}
          />
        }
        buttons={
          <>
            <DetailsButton
              className="p-0.5"
              size={14}
              onClick={handleShowDetails}
            />
            <MoreOptionsButton className="p-0" onClick={handleMoreOptions} />
          </>
        }
        onMoreOptions={handleMoreOptions}
      >
        <PageLabel
          pageLabel={annotation.pageLabel}
          backlink={getBacklink(annotation)}
        />
      </Header>
      <Content ref={containerRef} className="px-2 py-1">
        <blockquote
          className={clsx("border-l-blockquote pl-2 leading-tight", {
            "line-clamp-3": collapsed,
          })}
          style={{
            borderColor: annotation.color ?? "var(--interactive-accent)",
          }}
        >
          <Excerpt
            {...excerptProps}
            collapsed={collapsed}
            imgSrc={useImgSrc(annotation)}
          />
        </blockquote>
      </Content>
      {annotation.comment && <Comment content={annotation.comment} />}
      {tags && <Tags tags={tags} />}
    </div>
  );
}
