/**
 ** @see https://github.com/zotero/zotero/blob/85e13dc3eea8a1e6854cc762880654af59173216/chrome/content/zotero/xpcom/preferencePanes.js#L83-L104
 */

export interface IPreferencePaneDescriptor {
  /** ID of the plugin registering the pane */
  pluginID: string;
  /** URI of an XHTML fragment */
  src: string;
  /** Represents the pane and must be unique. Automatically generated if not provided */
  id?: string;
  /** ID of parent pane (if provided, pane is hidden from the sidebar) */
  parent?: string;
  /** Displayed as the pane's label in the sidebar. If not provided, the plugin's name is used */
  label?: string;
  /** URI of an icon to be displayed in the navigation sidebar. If not provided, the plugin's icon (from manifest.json) is used */
  image?: string;
  /** Array of URIs of DTD files to use for parsing the XHTML fragment */
  extraDTD?: string[];
  /** Array of URIs of scripts to load along with the pane */
  scripts?: string[];
  /** Array of URIs of stylesheets to load along with the pane */
  styles?: string[];
}

export interface PreferencePanes {
  /**
   * Register a pane to be displayed in the preferences. The pane XHTML (`src`)
   * is loaded as a fragment, not a full document, with XUL as the default
   * namespace and (X)HTML tags available under `html:`.
   *
   * The pane will be unregistered automatically when the registering plugin
   * shuts down.
   *
   * @returns The ID of the pane
   */
  register(options: IPreferencePaneDescriptor): Promise<string>;

  /**
   * Called automatically on plugin shutdown.
   */
  unregister(id: string): void;
}

export interface Zotero7 extends _ZoteroTypes.Zotero {
  PreferencePanes: PreferencePanes;
}
