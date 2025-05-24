import type { TextComponent } from "obsidian";

export function setLimit(min: number, max: number, step: number) {
  return (input: TextComponent) => {
    input.inputEl.type = "number";
    input.inputEl.style.textAlign = "center";
    input.inputEl.min = min.toString();
    input.inputEl.max = max.toString();
    input.inputEl.step = step.toString();
  };
}
