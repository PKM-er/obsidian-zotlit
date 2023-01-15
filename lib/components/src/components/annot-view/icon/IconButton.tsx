import { forwardRef } from "react";
import type { IconProps } from "./Icon";
import Icon from "./Icon";

export type IconButtonProps = IconProps &
  Required<Pick<IconProps, "onClick" | "onKeyDown">>;

export default forwardRef(function IconButton(
  props: IconProps,
  ref: React.Ref<HTMLDivElement>,
) {
  return <Icon {...props} ref={ref} role="button" tabIndex={0} />;
});
