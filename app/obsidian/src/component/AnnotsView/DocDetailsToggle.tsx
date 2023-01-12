import type { DetailsToggleProps } from "../ItemView";
import { DetailsToggle } from "../ItemView";

export type DocItemDetailsToggleProps = DetailsToggleProps;

export default function DocItemDetailsToggle(props: DocItemDetailsToggleProps) {
  return <DetailsToggle {...props} />;
}
