import type { CheckedState } from "@obzt/components";
import { createStore as create } from "@obzt/components";

export const topicPrefix = "#zt-topic/",
  toDisplayName = (topic: string) => topic.substring(topicPrefix.length);

export const selectDisabled = (v: IStore) => v.topics.length === 0;

export interface IStore {
  topics: string[];
  activeTopic: number;
  watching: boolean;
  setWatching(val: CheckedState): void;
  setActiveTopic(index: number): void;
  emptyTopics(): void;
  setTopics(topics: string[]): void;
}

export const createStore = () =>
  create<IStore>((set) => ({
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
