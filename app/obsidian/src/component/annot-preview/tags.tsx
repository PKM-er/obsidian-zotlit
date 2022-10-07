import cls from "classnames";
import { useAtomValue } from "jotai";
import { tagsAtom } from "./atom";

export const Tags = () => {
  const tags = useAtomValue(tagsAtom);
  return (
    <div className="annot-tags-container">
      {tags.map(({ tagID, name }) => (
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <a
          key={tagID}
          className={cls("tag", "annot-tag")}
          // href={`#${name}`}
        >
          {name}
        </a>
      ))}
    </div>
  );
};
