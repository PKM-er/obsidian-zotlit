export interface AnnotBlockWorkerAPI {
  parse(markdown: string): BlockInfo;
  stringify(spec: AnnotDetails[]): string;
}

export interface AnnotDetails extends AnnotInfo {
  text: string;
}

export interface BlockInfo {
  annots: AnnotInfo[];
  withoutLinks: string;
}
export interface AnnotInfo {
  annotKey: string;
  fallback: string;
  url: string;
  /** if type = none, alt = raw linktext */
  alt: string;
  altType: "text" | "code" | "none";
}
