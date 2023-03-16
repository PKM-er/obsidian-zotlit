import { useMemoizedFn } from "ahooks";
import { ExtraButtonComponent } from "obsidian";
import type { RefCallback } from "react";
import { useCallback, useEffect, useRef } from "react";

export default function useExtraButton(
  onClick: () => void,
  {
    icon,
    desc,
    disable,
  }: Partial<{ icon: string; desc: string; disable: boolean }>,
) {
  const onClickImmu = useMemoizedFn(onClick);
  const compRef = useRef<ExtraButtonComponent | null>(null);
  useEffect(() => {
    compRef.current?.setIcon(icon ?? "");
  }, [icon]);
  useEffect(() => {
    compRef.current?.setTooltip(desc ?? "");
  }, [desc]);
  useEffect(() => {
    compRef.current?.setDisabled(disable ?? false);
  }, [disable]);
  return useCallback<RefCallback<HTMLDivElement>>(
    (node) => {
      if (!node) {
        compRef.current?.extraSettingsEl.remove();
        compRef.current = null;
      } else {
        const comp = new ExtraButtonComponent(node);
        comp.onClick(onClickImmu);
        compRef.current = comp;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
}
