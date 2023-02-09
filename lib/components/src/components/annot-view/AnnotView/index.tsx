import type { RegularItemInfoBase } from "@obzt/database";
import { useBoolean, useMemoizedFn } from "ahooks";
import { useContext, useEffect } from "react";
import { useStore } from "zustand";
import { shallow } from "zustand/shallow";
import { cn as clsx } from "@c/utils";
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

export default function AnnotView() {
  const { store, onSetFollow } = useContext(Context);

  useOnDbRefresh();

  const follow = useStore(store, (s) => s.follow);

  const doc = useStore(store, (s) => s.doc);

  if (!doc) {
    return (
      <>
        <Header
          buttons={
            <>
              <div
                role="button"
                tabIndex={0}
                onClick={onSetFollow}
                onKeyUp={(evt) => evt.key === "Enter" && onSetFollow(evt)}
              >
                {follow === null ? "detached" : follow}
              </div>
            </>
          }
        ></Header>
        <div className="pane-empty p-2">Active file not literature note</div>
      </>
    );
  }
  return <AnnotsViewMain docItem={doc.docItem} />;
}

function AnnotsViewMain({ docItem }: { docItem: RegularItemInfoBase }) {
  const { refreshConn, onShowDetails, onSetFollow, store } =
    useContext(Context);

  const [isCollapsed, { toggle: toggleCollapsed }] = useBoolean(false);

  const annotListProps = useAnnotList();

  const follow = useStore(store, (s) => s.follow);

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
            <div
              role="button"
              tabIndex={0}
              onClick={onSetFollow}
              onKeyUp={onSetFollow}
            >
              {follow === null ? "detached" : follow}
            </div>
          </>
        }
      >
        <AttachmentSelector />
      </Header>
      <div
        className={clsx(
          "annots-container @container",
          "overflow-auto px-3 pt-1 pb-8 text-xs",
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
