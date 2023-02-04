import type { ToWorkpoolType } from "../utils";
import type { NoteParserWorkerAPI as API } from "./api";

export type NoteParserWorkerAPI = ToWorkpoolType<API>;
