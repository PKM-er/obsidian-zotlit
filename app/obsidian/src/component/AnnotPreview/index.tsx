import { D } from "@mobily/ts-belt";
import type { AnnotationInfo, TagInfo, AttachmentInfo } from "@obzt/database";
import { getBacklink } from "@obzt/database";
import { useBoolean } from "ahooks";
import { useRef } from "react";
import AnnotDetailsView from "./AnnotDetailsView";
import Comment from "./Comment";
import Content from "./Content";
import Excerpt from "./Excerpt";
import Header from "./Header";
import { useAnnotHelperArgs } from "./hooks/useAnnotHelperArgs";
import { useAnnotIcon } from "./hooks/useAnnotIcon";
import { useDragToInsert } from "./hooks/useDragToInsert";
import { useImgSrc } from "./hooks/useImgSrc";
import { useMoreOptionMenu } from "./hooks/useMoreOptionMenu";
import PageLabel from "./PageLabel";
import Tags from "./Tags";

export interface AnnotPreviewProps {
  annotation: AnnotationInfo;
  tags: TagInfo[] | undefined;
  attachment: AttachmentInfo;
  sourcePath: string;
}

export default function AnnotPreview(props: AnnotPreviewProps) {
  const { annotation, tags } = props;
  const containerRef = useRef<HTMLDivElement>(null);

  const renderArgs = useAnnotHelperArgs(props);

  const [showDetails, { toggle: toggleDetails }] = useBoolean(false);

  const excerptProps = D.selectKeys(annotation, ["type", "text", "pageLabel"]);

  return (
    <div className="annot-preview">
      <Header
        type={annotation.type}
        color={annotation.color}
        icon={useAnnotIcon(annotation.type)}
        onMoreOptions={useMoreOptionMenu(annotation)}
        {...useDragToInsert(
          containerRef,
          renderArgs.status === 2 ? renderArgs.args : null,
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
      {renderArgs.status && (
        <AnnotDetailsView {...{ showDetails, renderArgs: renderArgs.args }} />
      )}
    </div>
  );
}
