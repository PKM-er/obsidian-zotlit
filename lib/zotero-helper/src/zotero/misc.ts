/* eslint-disable @typescript-eslint/no-non-null-assertion */
export abstract class Component {
  private _loaded = false;
  private _events: (() => void)[] = [];
  private _children: Component[] = [];

  /**
   * Load this component and its children
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public load(...args: any[]): void {
    if (!this._loaded) {
      (this._loaded = true), this.onload();
      for (let e = 0, t = this._children.slice(); e < t.length; e++) {
        t[e].load();
      }
    }
  }
  /**
   * Override this to load your component
   */
  public abstract onload(...args: any[]): void;

  /**
   * Unload this component and its children
   */
  public unload(): void {
    if (this._loaded) {
      this._loaded = !1;
      while (this._events.length > 0) {
        this._events.pop()!();
      }
      while (this._children.length > 0) {
        this._children.pop()!.unload();
      }
      this.onunload();
    }
  }

  /**
   * Override this to unload your component
   */
  public abstract onunload(): void;
  /**
   * Adds a child component, loading it if this component is loaded
   * @public
   */
  addChild<T extends Component>(component: T): T {
    return (
      this._children.push(component),
      this._loaded && component.load(),
      component
    );
  }

  /**
   * Removes a child component, unloading it
   * @public
   */
  removeChild<T extends Component>(component: T): T {
    const t = this._children,
      n = t.indexOf(component);
    return -1 !== n && (t.splice(n, 1), component.unload()), component;
  }

  /**
   * Registers a callback to be called when unloading
   * @public
   */
  register(cb: () => any): void {
    this._events.push(cb);
  }

  /**
   * Registers an DOM event to be detached when unloading
   * @public
   */
  registerDomEvent<K extends keyof WindowEventMap>(
    el: Window,
    type: K,
    callback: (this: HTMLElement, ev: WindowEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  /**
   * Registers an DOM event to be detached when unloading
   * @public
   */
  registerDomEvent<K extends keyof DocumentEventMap>(
    el: Document,
    type: K,
    callback: (this: HTMLElement, ev: DocumentEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  /**
   * Registers an DOM event to be detached when unloading
   * @public
   */
  registerDomEvent<K extends keyof HTMLElementEventMap>(
    el: HTMLElement,
    type: K,
    callback: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  registerDomEvent(
    el: HTMLElement | Window | Document,
    type: string,
    callback: (this: HTMLElement | Window | Document, ev: Event) => any,
    options?: boolean | AddEventListenerOptions,
  ): void {
    el.addEventListener(type, callback, options);
    this.register(() => el.removeEventListener(type, callback, options));
  }
  /**
   * Registers an interval (from setInterval) to be cancelled when unloading
   * Use {@link window.setInterval} instead of {@link setInterval} to avoid TypeScript confusing between NodeJS vs Browser API
   * @public
   */
  registerInterval(id: number): number {
    return this.register(() => clearInterval(id)), id;
  }
}
