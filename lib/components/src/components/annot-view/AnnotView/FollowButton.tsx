import { useContext } from "react";
import { useStore } from "zustand";
import type { IconToggleProps } from "../../icon";
import { IconToggle } from "../../icon";
import { Context } from "../context";

export type FollowButtonProps = Omit<IconToggleProps, "icon">;

export default function FollowButton(props: FollowButtonProps) {
  const { store, onSetFollow } = useContext(Context);
  const mode = useStore(store, (s) => s.follow);
  const description =
    mode === null
      ? "not following"
      : mode === "ob-note"
      ? "active literature note"
      : "active literature in Zotero reader";

  const icon = mode === null ? "unlink" : "link";
  return (
    <>
      <IconToggle
        {...props}
        onClick={onSetFollow}
        icon={icon}
        aria-label={
          "Choose follow mode" +
          (mode === null ? ` (Currently linked with literature)` : "")
        }
        aria-label-delay="50"
      />
      {mode !== null && (
        <span className="ml-1" aria-label={`Following ${description}`}>
          {mode === "ob-note" ? "ob" : "zt"}
        </span>
      )}
    </>
  );
}
