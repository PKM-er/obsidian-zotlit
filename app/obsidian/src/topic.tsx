import type { CheckedState, StoreApi } from "@obzt/components";
import {
  useStore,
  ObsidianContext,
  ImportingStatus,
  createStore,
} from "@obzt/components";
import { Service } from "@ophidian/core";
import type { CachedMetadata, TAbstractFile } from "obsidian";
import { getAllTags, TFile, Menu } from "obsidian";
import { useRef } from "react";
import ReactDOM from "react-dom";
import { context } from "./components/context";
import ZoteroPlugin from "./zt-main";

interface IStore {
  topics: string[];
  activeTopic: number;
  watching: boolean;
  setWatching(val: CheckedState): void;
  setActiveTopic(index: number): void;
  emptyTopics(): void;
  setTopics(topics: string[]): void;
}

export class TopicImport extends Service {
  plugin = this.use(ZoteroPlugin);

  store = createStore<IStore>((set) => ({
    topics: [],
    activeTopic: -1,
    watching: false,
    setWatching: (val: CheckedState) => {
      set((state) =>
        state.topics
          ? {
              ...state,
              watching: val === true ? val : false,
            }
          : state,
      );
    },
    setActiveTopic: (index: number) => {
      set((state) => ({ ...state, activeTopic: index }));
    },
    setTopics: (topics) => {
      set((state) => ({
        ...state,
        topics,
        activeTopic: topics.indexOf(state.topics[state.activeTopic]),
      }));
    },
    emptyTopics: () =>
      set((state) => ({ ...state, topics: [], activeTopic: -1 })),
  }));

  file: TFile | null = null;
  get watching() {
    return this.store.getState().watching;
  }
  onFileOpen(file: TAbstractFile | null, force = false) {
    if (this.watching) return;
    if (!(file instanceof TFile)) {
      this.file = null;
      this.store.getState().emptyTopics();
      return;
    }
    this.file = file;
    const meta = this.plugin.app.metadataCache.getFileCache(file);
    if (!meta) {
      this.store.getState().emptyTopics();
      return;
    }
    this.onMetaUpdate(file, meta, force);
  }
  onMetaUpdate(file: TFile, cache: CachedMetadata, force: boolean) {
    // skip if not active file
    if (
      !force &&
      ((this.file && file.path !== this.file.path) || this.watching)
    ) {
      return;
    }
    const tags =
      getAllTags(cache)
        ?.filter((t) => t.startsWith("#zt-topic/"))
        .map((t) => `#${t.substring(10)}`) ?? [];
    this.store.getState().setTopics(tags);
  }

  registerTopic(callback: (topic: string | null) => void) {
    return this.store.subscribe((state, prev) => {
      if (state.watching === prev.watching) return;
      if (state.watching) {
        callback(state.topics[state.activeTopic]);
      } else {
        callback(null);
      }
    });
  }

  onload(): void {
    this.registerEvent(
      this.plugin.app.workspace.on("file-open", (file) =>
        this.onFileOpen(file),
      ),
    );
    this.registerEvent(
      this.plugin.app.metadataCache.on("changed", (file, _d, cache) =>
        this.onMetaUpdate(file, cache, false),
      ),
    );
    this.onFileOpen(this.plugin.app.workspace.getActiveFile(), true);
    this.register(
      this.store.subscribe((state, prev) => {
        if (state.watching === prev.watching) return;
        this.onFileOpen(this.plugin.app.workspace.getActiveFile(), true);
      }),
    );
    const statusBarItem = this.plugin.addStatusBarItem();
    statusBarItem.addClass("obzt");
    ReactDOM.render(
      <ObsidianContext.Provider value={context}>
        <TopicImportStatus store={this.store} />
      </ObsidianContext.Provider>,
      statusBarItem,
    );
    statusBarItem.toggleClass(
      "mod-clickable",
      !selectDisabled(this.store.getState()),
    );
    this.register(
      this.store.subscribe((state, prev) => {
        if (!state.topics === !prev.topics) return;
        statusBarItem.toggleClass("mod-clickable", !selectDisabled(state));
      }),
    );
    this.register(() => ReactDOM.unmountComponentAtNode(statusBarItem));
  }
}

function TopicImportStatus(props: { store: StoreApi<IStore> }) {
  const watching = useStore(props.store, (v) => v.watching);
  const setWatching = useStore(props.store, (v) => v.setWatching);
  const setActiveTopic = useStore(props.store, (v) => v.setActiveTopic);
  const disabled = useStore(props.store, selectDisabled);
  const mainTopic = useStore(props.store, (v) => {
    const mainTopic = v.topics[v.activeTopic] ?? v.topics[0],
      suffix = v.topics.length > 1 && !v.watching ? "..." : "";
    if (mainTopic) {
      return `${mainTopic}${suffix}`;
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
              item.setTitle(topic).onClick(() => {
                setActiveTopic(i);
                setWatching(true);
              }),
            ),
          );
          const bound = ref.current?.getBoundingClientRect();
          if (!bound) return;
          menu.showAtPosition({ x: bound.x, y: bound.y });
        } else {
          setWatching(val);
        }
      }}
      disabled={disabled}
      id="zt-topic-import-status"
      title={mainTopic}
    />
  );
}

const selectDisabled = (v: IStore) => v.topics.length === 0;
