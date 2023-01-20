import type { AttachmentInfo } from "@obzt/database";
import { useContext } from "react";
import { useStore } from "zustand";
import { shallow } from "zustand/shallow";
import { Context } from "../context";

export interface AttachmentSelectorProps {
  attachments: AttachmentInfo[] | null;
  value: number | null;
  onChange: (value: number) => void;
}

const useAttachmentSelect = () =>
  useStore(
    useContext(Context).store,
    (s): AttachmentSelectorProps => ({
      attachments: s.allAttachments,
      onChange: s.setActiveAtch,
      value: s.attachmentID,
    }),
    shallow,
  );

export default function AttachmentSelector() {
  const { attachments, onChange, value } = useAttachmentSelect();
  if (!attachments) {
    return <>Loading</>;
  }
  if (attachments.length === 1) {
    return null;
  }
  if (attachments.length <= 0) {
    return <span className="atch-select-empty">No attachments available</span>;
  }
  return (
    <select
      className="atch-select"
      onChange={(evt) => onChange(parseInt(evt.target.value, 10))}
      value={value ?? undefined}
    >
      {attachments.map(({ itemID, path, annotCount }) => {
        return (
          <option key={itemID} value={itemID}>
            ({annotCount}) {path?.replace(/^storage:/, "")}
          </option>
        );
      })}
    </select>
  );
}
