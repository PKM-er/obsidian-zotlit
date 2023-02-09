import { useStore, ImportingStatus } from "@obzt/components";
import type { StoreApi } from "@obzt/components";
import { Menu } from "obsidian";
import { useRef } from "react";
import type { IStore } from "./utils";
import { selectDisabled, toDisplayName } from "./utils";

export function TopicImportStatus(props: { store: StoreApi<IStore> }) {
  const watching = useStore(props.store, (v) => v.watching);
  const setWatching = useStore(props.store, (v) => v.setWatching);
  const setActiveTopic = useStore(props.store, (v) => v.setActiveTopic);
  const disabled = useStore(props.store, selectDisabled);
  const mainTopic = useStore(props.store, (v) => {
    const mainTopic = v.topics[v.activeTopic] ?? v.topics[0],
      suffix = v.topics.length > 1 && !v.watching ? "..." : "";
    if (mainTopic) {
      return `#${toDisplayName(mainTopic)}${suffix}`;
    } else {
      return "no topic";
    }
  });
  const allTopics = useStore(props.store, (v) => v.topics);

  const ref = useRef<HTMLDivElement>(null);

  return (
    <ImportingStatus
      ref={ref}
      aria-label="Topic importing status"
      aria-label-position="top"
      checked={watching}
      onCheckChange={(val) => {
        if (!watching && allTopics.length > 1) {
          const menu = new Menu();
          allTopics.forEach((topic, i) =>
            menu.addItem((item) =>
              item.setTitle(toDisplayName(topic)).onClick(() => {
                setActiveTopic(i);
                setWatching(true);
              }),
            ),
          );
          const bound = ref.current?.getBoundingClientRect();
          if (!bound) return;
          menu.showAtPosition({ x: bound.x, y: bound.y });
        } else {
          setActiveTopic(val === true ? 0 : -1);
          setWatching(val);
        }
      }}
      disabled={disabled}
      id="zt-topic-import-status"
      title={mainTopic}
    />
  );
}
