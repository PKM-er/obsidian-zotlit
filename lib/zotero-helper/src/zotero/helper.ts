import { NS } from "../const.js";

declare global {
  interface Document {
    createXULElement?: (type: string) => XUL.Element;
  }
}

export function createXULElement(doc: Document, type: string): XUL.Element {
  if (doc.createXULElement) {
    return doc.createXULElement(type);
  } else {
    return doc.createElementNS(NS.XUL, type) as XUL.Element;
  }
}

/**
 * If it's an XUL element
 * @param el
 */
export function isXULElement(el: Element | XUL.Element): boolean {
  return el.namespaceURI === NS.XUL;
}

export function isZotero7(Zotero: any) {
  return Zotero.platformMajorVersion >= 102;
}

/**
 * Parse XHTML to XUL fragment. For Zotero 6.
 *
 * @param entities Array of URIs of DTD files to use for parsing the XHTML fragment ("chrome://xxx.dtd")
 * @param defaultNS the default namespace to use for elements without a namespace, XUL by default
 */
export function parseXHTML(
  xhtml: string,
  extraDTD: string[] = [],
  defaultNS: "HTML" | "XUL" = "XUL",
): DocumentFragment {
  const parser = new mainWindow.DOMParser();

  const entities = extraDTD.map(
    (url, index) =>
      `<!ENTITY % _dtd-${index} SYSTEM "${url}"> %_dtd-${index}; `,
  );
  const entitiesDef =
    entities.length === 0 ? "" : `<!DOCTYPE bindings [ ${entities.join("")}] >`;

  const doc = parser.parseFromString(
    `${entitiesDef}
<html:div xmlns="${NS[defaultNS]}" xmlns:xul="${NS.XUL}" xmlns:html="${NS.HTML}">
${xhtml}
</html:div>`,
    "text/xml",
  );

  if (doc.documentElement.localName === "parsererror") {
    throw new Error("not well-formed XHTML");
  }

  // We use a range here so that we don't access the inner DOM elements from
  // JavaScript before they are imported and inserted into a document.
  const range = doc.createRange();
  range.selectNodeContents(doc.querySelector("div")!);
  return range.extractContents();
}
