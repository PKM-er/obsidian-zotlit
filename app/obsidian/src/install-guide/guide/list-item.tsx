import cls from "classnames";
import React from "react";

export const ListItem = ({
  name,
  desc,
  button,
  onClick,
  icon,
  className,
  ...rest
}: {
  onClick?: () => void;
  button?: string;
  name?: string | null;
  desc?: string;
  icon?: JSX.Element;
} & React.HtmlHTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cls("setting-item", className)} {...rest}>
      {icon && <div className="setting-icon">{icon}</div>}
      <div className="setting-item-info">
        <div className="setting-item-name">{name}</div>
        <div className="setting-item-description">{desc}</div>
      </div>
      <div className="setting-item-control">
        {button && (
          <button className="mod-cta" onClick={onClick}>
            {button}
          </button>
        )}
      </div>
    </div>
  );
};
