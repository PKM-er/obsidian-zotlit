import { useBoolean } from "ahooks";
import clsx from "clsx";
import { useContext, useEffect } from "react";
import { useStore } from "zustand";
import { shallow } from "zustand/shallow";
import type { AnnotListProps } from "../AnnotList";
import AnnotList from "../AnnotList";
import { Obsidian } from "../context";
import AttachmentSelector from "./AttachmentSelector";
import CollapseButton from "./CollapseButton";
import DocItemDetailsToggle from "./DocDetailsToggle";
import DocDetailsView from "./DocDetailsView";
import Header from "./Header";
import { useDocHelper } from "./hooks/useDocHelper";

import RefreshButton from "./RefreshButton";

// export interface AnnotsViewProps {
//   sourcePath: string;
//   docItem: RegularItemInfo;
// }

const useOnDbRefresh = () => {
  const { registerDbUpdate, store } = useContext(Obsidian);
  const refresh = useStore(store, (s) => s.refresh);
  useEffect(() => registerDbUpdate(refresh), [registerDbUpdate, refresh]);
};

export default function AnnotsView() {
  const { store } = useContext(Obsidian);

  useOnDbRefresh();
  const empty = useStore(store, (s) => !s.doc);

  if (empty) {
    return (
      <div className="annot-view">
        <div className="pane-empty">Active file not literature note</div>
      </div>
    );
  }
  return <AnnotsViewMain />;
}

function AnnotsViewMain() {
  const { refreshConn } = useContext(Obsidian);

  const [showDetails, { toggle: toggleDetails }] = useBoolean(false);
  const [isCollapsed, { toggle: toggleCollapsed }] = useBoolean(false);

  const annotListProps = useAnnotList();

  const helper = useDocHelper();
  return (
    <div className={clsx("annot-view", { "is-collapsed": isCollapsed })}>
      <Header
        action={
          <>
            <DocItemDetailsToggle
              onClick={toggleDetails}
              active={showDetails}
            />
            <CollapseButton
              isCollapsed={isCollapsed}
              onCollapsedToggled={toggleCollapsed}
            />
            <RefreshButton onRefresh={refreshConn} />
          </>
        }
      >
        <AttachmentSelector />
      </Header>
      {helper && <DocDetailsView {...{ showDetails, helper }} />}
      {annotListProps ? <AnnotList {...annotListProps} /> : <>Loading</>}
    </div>
  );
}

const useAnnotList = () =>
  useStore(
    useContext(Obsidian).store,
    (s): Omit<AnnotListProps, "selectable"> | null => {
      if (!s.doc || !s.annotations || !s.attachment) return null;
      return {
        annotations: s.annotations,
        getTags: (itemId: number) => s.tags[itemId] ?? [],
      };
    },
    shallow,
  );
