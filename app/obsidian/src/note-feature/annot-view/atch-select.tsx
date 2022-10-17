import type { AttachmentInfo } from "@obzt/database";
import { useAtomValue, useSetAtom } from "jotai";
import {
  activeAtchAtom,
  activeAtchIdAtom,
  attachmentsAtom,
} from "@component/atoms/attachment";
import { GLOBAL_SCOPE } from "../../component/atoms/utils";

type Attachment = Omit<AttachmentInfo, "itemID"> & { itemID: number };
export const AttachmentSelect = () => {
  const attachments = useAtomValue(attachmentsAtom, GLOBAL_SCOPE);
  const setAtchId = useSetAtom(activeAtchAtom, GLOBAL_SCOPE);
  const atchId = useAtomValue(activeAtchIdAtom, GLOBAL_SCOPE);

  if (!attachments || (attachments && attachments.length === 1)) {
    return null;
  }
  if (attachments.length <= 0) {
    return <span className="atch-select-empty">No attachments available</span>;
  }
  return (
    <select
      className="atch-select"
      onChange={setAtchId}
      value={atchId ?? undefined}
    >
      {attachments
        .filter((item): item is Attachment => item.itemID !== null)
        .map(({ itemID, path, count }) => {
          return (
            <option key={itemID} value={itemID}>
              ({count}) {path?.replace(/^storage:/, "")}
            </option>
          );
        })}
    </select>
  );
};
