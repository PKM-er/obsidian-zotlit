// derived from https://github.com/fakiolinho/react-loading

import { useEffect, useState } from "react";

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: string;
  delay?: number;
  height?: number | string;
  width?: number | string;
}

const Blank = () => (
  <svg
    className="icon-blank svg-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    height="32"
    width="32"
  />
);

const Spin = () => (
  <svg
    className="icon-spin svg-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    height="32"
    width="32"
  >
    <path
      opacity=".25"
      d="M16 0 A16 16 0 0 0 16 32 A16 16 0 0 0 16 0 M16 4 A12 12 0 0 1 16 28 A12 12 0 0 1 16 4"
    />
    <path d="M16 0 A16 16 0 0 1 32 16 L28 16 A12 12 0 0 0 16 4z">
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 16 16"
        to="360 16 16"
        dur="0.8s"
        repeatCount="indefinite"
      />
    </path>
  </svg>
);

export const Loading = ({
  color = "var(--icon-color, black)",
  delay = 0,
  height = 16,
  width = 16,
  style,
  ...restProps
}: LoadingProps) => {
  const [delayed, setDelayed] = useState(delay > 0);
  useEffect(() => {
    let timeout = -1;
    if (delayed) {
      timeout = window.setTimeout(() => {
        setDelayed(false);
      }, delay);
    }
    return () => {
      window.clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div
      style={{
        ...style,
        fill: color,
        height: Number(height) || height,
        width: Number(width) || width,
      }}
      {...restProps}
    >
      {delayed ? <Blank /> : <Spin />}
    </div>
  );
};
