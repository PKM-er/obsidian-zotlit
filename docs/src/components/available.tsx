export const enum Availablity {
  checking,
  unknown,
  yes,
  no,
}

import Admonition from "@theme/Admonition";
import React from "react";

export interface AvailablityTagProps<I> {
  available: Availablity;
  info?: I | null;
  infoComponent: React.FC<{ info: I | null; beta?: boolean }>;
  beta?: boolean;
}

export const AvailablityTag = <I,>({
  available,
  infoComponent,
  beta,
  info,
}: AvailablityTagProps<I>) => {
  switch (available) {
    case Availablity.checking:
      return null;
    case Availablity.yes:
    case Availablity.unknown: {
      return infoComponent({ info, beta });
    }
    case Availablity.no:
      return (
        <Admonition type="caution">This method is not yet available</Admonition>
      );
    default:
      break;
  }
};
