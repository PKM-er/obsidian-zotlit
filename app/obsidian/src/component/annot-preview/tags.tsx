import clsx from "clsx";
import { useAtomValue } from "jotai";
import { ANNOT_PREVIEW_SCOPE, tagsAtom } from "./atom";

export const Tags = () => {
  const tags = useAtomValue(tagsAtom, ANNOT_PREVIEW_SCOPE);
  return tags.length >= 1 ? (
    <div className="annot-tags-container">
      {tags.map(({ tagID, name }) => (
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <a
          key={tagID}
          className={clsx("tag", "annot-tag")}
          // href={`#${name}`}
        >
          {name}
        </a>
      ))}
    </div>
  ) : null;
};
