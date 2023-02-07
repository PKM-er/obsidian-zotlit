import type { PropsWithChildren, ReactNode } from "react";

type HeaderProps = PropsWithChildren<{ buttons: ReactNode }>;

export default function Header({ children, buttons }: HeaderProps) {
  return (
    <div className="nav-header">
      <div className="nav-buttons-container">{buttons}</div>
      {children}
    </div>
  );
}
