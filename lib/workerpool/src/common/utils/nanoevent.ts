import type { DefaultEvents, Emitter, EventsMap } from "nanoevents";
import { createNanoEvents as _createNanoEvents } from "nanoevents";

export function createNanoEvents<Events extends EventsMap = DefaultEvents>() {
  const emitter = _createNanoEvents<Events>() as Emitter<Events> & {
    once: Emitter<Events>["on"];
  };

  emitter.once = (evt, cb) => {
    const onceCallback = (...args: any[]) => {
      unbind();
      cb(...args);
    };
    const unbind = emitter.on(evt, onceCallback as any);
    return unbind;
  };
  return emitter;
}
