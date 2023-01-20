import type { DetailsToggleProps } from "../DetailsToggle";
import DetailsToggle from "../DetailsToggle";

export type DocItemDetailsToggleProps = DetailsToggleProps;

export default function DocItemDetailsToggle(props: DocItemDetailsToggleProps) {
  return <DetailsToggle {...props} />;
}
