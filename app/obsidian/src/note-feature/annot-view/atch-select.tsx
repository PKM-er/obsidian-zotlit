import type { AttachmentInfo } from "@obzt/database";
import { useAtomValue, useSetAtom } from "jotai";
import { activeAtchIdAtom, attachmentsAtom } from "@component/atoms/attachment";

type Attachment = Omit<AttachmentInfo, "itemID"> & { itemID: number };
export const AttachmentSelect = () => {
  const attachments = useAtomValue(attachmentsAtom);
  const setAtchId = useSetAtom(activeAtchIdAtom);
  const atchId = useAtomValue(activeAtchIdAtom);

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
