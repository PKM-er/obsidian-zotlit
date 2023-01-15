import type { PropsWithChildren, ReactNode } from "react";

type HeaderProps = PropsWithChildren<{ action: ReactNode }>;

export default function Header({ children, action }: HeaderProps) {
  return (
    <div className="annot-view-header">
      <div className="annot-view-button-container">{action}</div>
      {children}
    </div>
  );
}
