import type { ToWorkpoolType } from "../utils";
import type { AnnotBlockWorkerAPI as API } from "./api";

export type AnnotBlockWorkerAPI = ToWorkpoolType<API>;

export type { AnnotDetails, AnnotInfo, BlockInfo } from "./api";
