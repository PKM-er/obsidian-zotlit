import "./style.less";

import { useMemoizedFn } from "ahooks";
import cls from "classnames";
import { useAtom, atom, useAtomValue, useSetAtom } from "jotai";
import type { DragHandler } from "./annot-preview";
import { AnnotListItem } from "./annot-preview";
import {
  stateAtomFamily,
  annotsAtom,
  isCollapsedAtom,
} from "./atoms/annotation";
import { activeAtchAtom } from "./atoms/attachment";
import { pluginAtom } from "./atoms/obsidian";
import { manualRefreshAtom } from "./atoms/refresh";
import { useIconRef } from "./icon";

const filterAtom = atom("all");

const filteredAtom = atom((get) => {
  const annots = get(annotsAtom);
  if (!annots) return null;
  const filter = get(filterAtom);
  if (filter === "all") return annots;
  else if (filter === "selected") {
    return annots.filter((annot) =>
      get(stateAtomFamily.isSelected(annot.itemID)),
    );
  } else {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return annots.filter(
      (annot) => !get(stateAtomFamily.isSelected(annot.itemID)),
    );
  }
});

const useDragHandler = (): DragHandler => {
  const activeAtch = useAtomValue(activeAtchAtom);
  const {
    settings: { literatureNoteTemplate },
    imgCacheImporter,
  } = useAtomValue(pluginAtom);
  return useMemoizedFn((evt, annot) => {
    if (!activeAtch) return;
    const data = literatureNoteTemplate.render("annotation", {
      ...annot,
      attachment: activeAtch,
    });
    evt.dataTransfer.setData("text/plain", data);
    const evtRef = app.workspace.on("editor-drop", (evt) => {
      if (evt.dataTransfer?.getData("text/plain") === data) {
        imgCacheImporter.flush();
      }
      app.workspace.offref(evtRef);
    });
    window.addEventListener(
      "dragend",
      () => {
        imgCacheImporter.cancel();
      },
      { once: true },
    );
  });
};

const AnnotationList = ({ selectable = false }: { selectable?: boolean }) => {
  const annots = useAtomValue(filteredAtom);
  const isCollapsed = useAtomValue(isCollapsedAtom);

  const onDrag = useDragHandler();
  return (
    <div className={cls("annot-list", { "is-collapsed": isCollapsed })}>
      {annots?.map((annot) => (
        <AnnotListItem
          selectable={selectable}
          data={annot}
          key={annot.itemID}
          onDrag={onDrag}
        />
      ))}
    </div>
  );
};
export default AnnotationList;

export const CollapseButton = () => {
  const [isCollapsed, setCollapsed] = useAtom(isCollapsedAtom);
  const [ref] = useIconRef<HTMLButtonElement>(
    isCollapsed ? "chevrons-up-down" : "chevrons-down-up",
  );
  return (
    <button
      ref={ref}
      className="clickable-icon"
      onClick={() => setCollapsed((v) => !v)}
      aria-label={isCollapsed ? "Expand" : "Collapse"}
    />
  );
};

export const RefreshButton = () => {
  const refresh = useSetAtom(manualRefreshAtom);
  const [ref] = useIconRef<HTMLButtonElement>("refresh-ccw");
  return (
    <button
      ref={ref}
      className="clickable-icon"
      onClick={refresh}
      aria-label="Refresh Annotation List"
      aria-label-delay="50"
    />
  );
};
