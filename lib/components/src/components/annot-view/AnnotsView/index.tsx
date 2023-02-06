import type { RegularItemInfoBase } from "@obzt/database";
import { useBoolean, useMemoizedFn } from "ahooks";
import clsx from "clsx";
import { useContext, useEffect } from "react";
import { useStore } from "zustand";
import { shallow } from "zustand/shallow";
import { Context } from "../context";
import DetailsButton from "../DetailsButton";
import type { AnnotListProps } from "./AnnotList";
import AnnotList from "./AnnotList";
import AttachmentSelector from "./AttachmentSelector";
import CollapseButton from "./CollapseButton";
import Header from "./Header";

import RefreshButton from "./RefreshButton";

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
      <>
        <div className="pane-empty p-2">Active file not literature note</div>
      </>
    );
  }
  return <AnnotsViewMain docItem={doc.docItem} />;
}

function AnnotsViewMain({ docItem }: { docItem: RegularItemInfoBase }) {
  const { refreshConn, onShowDetails } = useContext(Context);

  const [isCollapsed, { toggle: toggleCollapsed }] = useBoolean(false);

  const annotListProps = useAnnotList();

  return (
    <>
      <Header
        buttons={
          <>
            <DetailsButton
              className="nav-action-button"
              onClick={useMemoizedFn(() => onShowDetails(docItem.itemID))}
            />
            <CollapseButton
              className="nav-action-button"
              isCollapsed={isCollapsed}
              onClick={toggleCollapsed}
            />
            <RefreshButton
              className="nav-action-button"
              onClick={refreshConn}
            />
          </>
        }
      >
        <AttachmentSelector />
      </Header>
      <div
        className={clsx(
          "annots-container @container",
          "overflow-auto px-3 pt-1 pb-8 text-sm",
        )}
      >
        {annotListProps ? (
          <AnnotList collapsed={isCollapsed} {...annotListProps} />
        ) : (
          <>Loading</>
        )}
      </div>
    </>
  );
}

const useAnnotList = (): Pick<
  AnnotListProps,
  "annotations" | "getTags"
> | null =>
  useStore(
    useContext(Context).store,
    (s) => {
      if (!s.doc || !s.annotations || !s.attachment) return null;
      return {
        annotations: s.annotations,
        getTags: (itemId: number) => s.tags[itemId] ?? [],
      };
    },
    shallow,
  );
