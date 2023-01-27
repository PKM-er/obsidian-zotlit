declare global {
  interface Document {
    createXULElement?: (type: string) => XUL.Element;
  }
}

const xulNS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

export function createXULElement(doc: Document, type: string): XUL.Element {
  if (doc.createXULElement) {
    return doc.createXULElement(type);
  } else {
    return doc.createElementNS(xulNS, type) as XUL.Element;
  }
}

/**
 * If it's an XUL element
 * @param el
 */
export function isXULElement(el: Element): boolean {
  return el.namespaceURI === xulNS;
}
