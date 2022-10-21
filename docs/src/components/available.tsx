export const enum Availablity {
  checking,
  unknown,
  yes,
  no,
}

import Admonition from "@theme/Admonition";
import React from "react";

export const AvailablityTag = (props: { available: Availablity }) => {
  switch (props.available) {
    case Availablity.checking:
    case Availablity.yes:
      return null;
    case Availablity.unknown:
      return (
        <Admonition type="info">
          Cannot check if this method is available
        </Admonition>
      );
    case Availablity.no:
      return (
        <Admonition type="caution">This method is not yet available</Admonition>
      );
    default:
      break;
  }
};
