import type { Creator } from "@obzt/zotero-type";
import { isCreatorNameOnly, isCreatorFullName } from "@obzt/zotero-type";
import assertNever from "assert-never";
import cls from "classnames";
import { atom, useAtom, useAtomValue } from "jotai";
import { loadable } from "jotai/utils";
import { useEffect } from "react";
import { JSONTree } from "react-json-tree";
import { activeDocItemAtom } from "./atoms/obsidian";
import { useIconRef } from "./icon";

const docItemAtom = loadable(activeDocItemAtom);

const queryDarkMode = () => document.body.hasClass("theme-dark");

const darkModeAtom = atom(queryDarkMode());

const themeLight = {
  scheme: "Solarized Light",
  author: "Ethan Schoonover (modified by aramisgithub)",
  base00: "#fdf6e3",
  base01: "#eee8d5",
  base02: "#93a1a1",
  base03: "#839496",
  base04: "#657b83",
  base05: "#586e75",
  base06: "#073642",
  base07: "#002b36",
  base08: "#dc322f",
  base09: "#cb4b16",
  base0A: "#b58900",
  base0B: "#859900",
  base0C: "#2aa198",
  base0D: "#268bd2",
  base0E: "#6c71c4",
  base0F: "#d33682",
};

const themeDark = {
  scheme: "Solarized Dark",
  author: "Ethan Schoonover (modified by aramisgithub)",
  base00: "#002b36",
  base01: "#073642",
  base02: "#586e75",
  base03: "#657b83",
  base04: "#839496",
  base05: "#93a1a1",
  base06: "#eee8d5",
  base07: "#fdf6e3",
  base08: "#dc322f",
  base09: "#cb4b16",
  base0A: "#b58900",
  base0B: "#859900",
  base0C: "#2aa198",
  base0D: "#268bd2",
  base0E: "#6c71c4",
  base0F: "#d33682",
};

export const DocDetailsView = () => {
  const activeDocItem = useAtomValue(docItemAtom);
  const showingDetails = useAtomValue(showDocItemDetails);
  return (
    <div
      className={cls("annot-doc-details", {
        loading: activeDocItem.state === "loading",
        showing: showingDetails,
      })}
    >
      <DocItemDetails />
    </div>
  );
};

const DocItemDetails = () => {
  const activeDocItem = useAtomValue(docItemAtom);
  const [isDarkMode, setDarkMode] = useAtom(darkModeAtom);
  useEffect(() => {
    const listener = () => setDarkMode(queryDarkMode());
    app.workspace.on("css-change", listener);
    return () => app.workspace.off("css-change", listener);
  }, [setDarkMode]);
  if (activeDocItem.state === "hasData") {
    if (activeDocItem.data) {
      return (
        <JSONTree
          data={activeDocItem.data}
          theme={isDarkMode ? themeDark : themeLight}
          invertTheme={false}
          keyPath={["Zotero Item Data"]}
          shouldExpandNode={shouldExpandNode}
          getItemString={getItemString}
        />
      );
    } else {
      return <div>No Details Available</div>;
    }
  } else if (activeDocItem.state === "loading") {
    return null;
  } else if (activeDocItem.state === "hasError") {
    return <div>An Error Occurred: {activeDocItem.error}</div>;
  } else assertNever(activeDocItem);
};

const showDocItemDetails = atom(false);

const shouldExpandNode = (
  keyPath: (string | number)[],
  data: unknown,
  level: number,
) => {
  if (
    level < 1 ||
    (keyPath[1] === "creators" && level < 2) ||
    (level < 2 && Array.isArray(data) && data.length > 1)
  )
    return true;
  return false;
};

const getItemString = (
  _nodeType: string,
  data: unknown,
  itemType: React.ReactNode,
  itemString: string,
  keyPath: (string | number)[],
): React.ReactNode => {
  if (keyPath[1] === "creators" && keyPath.length === 3) {
    const creator = data as Creator;
    if (isCreatorFullName(creator)) {
      return (
        <span>
          {creator.firstName} {creator.lastName}
        </span>
      );
    } else if (isCreatorNameOnly(creator)) {
      return <span>{creator.lastName}</span>;
    }
  }
  if (keyPath.length === 2 && Array.isArray(data) && data.length === 1) {
    return (
      <span>
        {itemType} {JSON.stringify(data[0])}
      </span>
    );
  }
  return (
    <span>
      {itemType} {itemString}
    </span>
  );
};

export const DocItemDetailsButton = () => {
  const [showingDetails, setShowDetails] = useAtom(showDocItemDetails);
  const [ref] = useIconRef<HTMLButtonElement>("info");
  return (
    <button
      ref={ref}
      className={cls("clickable-icon", { "is-active": showingDetails })}
      onClick={() => setShowDetails((v) => !v)}
      aria-label={`${showingDetails ? "Hide" : "Show"} details`}
    />
  );
};
