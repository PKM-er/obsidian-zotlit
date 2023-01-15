import type { TagInfo } from "@obzt/database";
import clsx from "clsx";
import { memo } from "react";

interface TagsProps {
  tags: TagInfo[];
}

export default function Tags({ tags }: TagsProps) {
  if (tags.length === 0) return null;
  return (
    <div className="annot-tags-container">
      {tags.map((tag) => (
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <Tag key={tag.tagID} {...tag} />
      ))}
    </div>
  );
}

const Tag = memo(function Tag({ name }: TagInfo) {
  return (
    // eslint-disable-next-line jsx-a11y/anchor-is-valid
    <a
      className={clsx("tag", "annot-tag")}
      // href={`#${name}`}
    >
      {name}
    </a>
  );
});
