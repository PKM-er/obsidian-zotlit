import type { RegularItemInfoBase } from "@obzt/database";
import { useBoolean, useMemoizedFn } from "ahooks";
import clsx from "clsx";
import { useContext, useEffect } from "react";
import { useStore } from "zustand";
import { shallow } from "zustand/shallow";
import type { AnnotListProps } from "../AnnotList";
import AnnotList from "../AnnotList";
import { Context } from "../context";
import AttachmentSelector from "./AttachmentSelector";
import CollapseButton from "./CollapseButton";
import DocItemDetailsToggle from "./DocDetailsToggle";
import Header from "./Header";

import RefreshButton from "./RefreshButton";

// export interface AnnotsViewProps {
//   sourcePath: string;
//   docItem: RegularItemInfo;
// }

const useOnDbRefresh = () => {
  const { registerDbUpdate, store } = useContext(Context);
  const refresh = useStore(store, (s) => s.refresh);
  useEffect(() => registerDbUpdate(refresh), [registerDbUpdate, refresh]);
};

export default function AnnotsView() {
  const { store } = useContext(Context);

  useOnDbRefresh();
  const doc = useStore(store, (s) => s.doc);

  if (!doc) {
    return (
      <div className="annot-view">
        <div className="pane-empty">Active file not literature note</div>
      </div>
    );
  }
  return <AnnotsViewMain docItem={doc.docItem} />;
}

function AnnotsViewMain({ docItem }: { docItem: RegularItemInfoBase }) {
  const { refreshConn, onShowDetails } = useContext(Context);

  const [isCollapsed, { toggle: toggleCollapsed }] = useBoolean(false);

  const annotListProps = useAnnotList();

  return (
    <div className={clsx("annot-view", { "is-collapsed": isCollapsed })}>
      <Header
        action={
          <>
            <DocItemDetailsToggle
              onClick={useMemoizedFn(() => onShowDetails(docItem.itemID))}
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
      {annotListProps ? <AnnotList {...annotListProps} /> : <>Loading</>}
    </div>
  );
}

const useAnnotList = () =>
  useStore(
    useContext(Context).store,
    (s): Omit<AnnotListProps, "selectable"> | null => {
      if (!s.doc || !s.annotations || !s.attachment) return null;
      return {
        annotations: s.annotations,
        getTags: (itemId: number) => s.tags[itemId] ?? [],
      };
    },
    shallow,
  );
