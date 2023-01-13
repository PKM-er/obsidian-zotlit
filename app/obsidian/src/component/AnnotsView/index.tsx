import { useBoolean } from "ahooks";
import clsx from "clsx";
import { useCallback, useContext } from "react";
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
import { useDocHelperArgs } from "./hooks/useDocHelperArgs";

import RefreshButton from "./RefreshButton";

// export interface AnnotsViewProps {
//   sourcePath: string;
//   docItem: RegularItemInfo;
// }

export default function AnnotsView() {
  const { plugin } = useContext(Obsidian);

  const refresh = useCallback(
    () => plugin.dbWorker.refresh({ task: "dbConn" }),
    [plugin],
  );

  const [showDetails, { toggle: toggleDetails }] = useBoolean(false);
  const [isCollapsed, { toggle: toggleCollapsed }] = useBoolean(false);
  const renderArgs = useDocHelperArgs();

  const annotListProps = useAnnotList();

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
            <RefreshButton onRefresh={refresh} />
          </>
        }
      >
        <AttachmentSelector />
      </Header>
      <DocDetailsView showDetails={showDetails} renderArgs={renderArgs.args} />
      {annotListProps ? <AnnotList {...annotListProps} /> : <>Loading</>}
    </div>
  );
}

const useAnnotList = () =>
  useStore(
    useContext(Obsidian).view.store,
    (s): Omit<AnnotListProps, "selectable"> | null => {
      if (!s.doc || !s.annotations || !s.attachment) return null;
      return {
        annotations: s.annotations,
        getTags: (itemId: number) => s.tags[itemId] ?? [],
        attachment: s.attachment,
        sourcePath: s.doc.sourcePath,
      };
    },
    shallow,
  );
