import { FileView } from "obsidian";

export declare class DerivedFileView extends FileView {
  abstract update(): void;
}
