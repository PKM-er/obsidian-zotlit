import type { DragEndEvent } from "@dnd-kit/core";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDebounceFn } from "ahooks";
import { useContext, useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useIconRef } from "@/utils/icon";
import { SettingTabCtx } from "../common";
import Setting from "../components/Setting";
import useExtraButton from "../components/useExtraButton";
import { SortableItem } from "./SortableItem";

export default function Fields() {
  const { settings } = useContext(SettingTabCtx).plugin;
  const { noteFields } = settings;
  const { run: save } = useDebounceFn(
    async () => {
      if (!noteFields.setOption("noteFields", items).apply()) return;
      await settings.save();
    },
    { wait: 200 },
  );

  const [items, setItems] = useState(noteFields.noteFields);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );

  const [isOpen, setIsOpen] = useState(true);
  const [newField, setNewField] = useState("");
  const addFieldRef = useExtraButton(
    () => {
      if (!newField) return;
      setItems((items) => [...items, [newField, noteFields.getDefaultField()]]);
      save();
      setNewField("");
    },
    { icon: "plus", desc: "Add" },
  );
  const [collapsibleRef] = useIconRef<HTMLButtonElement>(
    isOpen ? "chevrons-down-up" : "chevrons-up-down",
  );

  return (
    <>
      <Setting
        name="Metadata Fields"
        description={<>Specify the metadata fields shown in Note Fields View</>}
        ref={addFieldRef}
      >
        <input
          type="text"
          value={newField}
          onChange={(evt) => setNewField(evt.target.value)}
          placeholder="Name of new field"
        />
      </Setting>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="flex flex-col items-end"
      >
        <CollapsibleTrigger asChild>
          <button
            ref={collapsibleRef}
            aria-label={isOpen ? "Hide Fields" : "Show All Fields"}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="p-3 divide-y">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map(([name]) => name)}
              strategy={verticalListSortingStrategy}
            >
              {items.map(([id]) => (
                <SortableItem key={id} id={id}>
                  <Field
                    name={id}
                    onDelete={() => {
                      setItems((items) => {
                        const index = items.findIndex(([name]) => name === id);
                        return [
                          ...items.slice(0, index),
                          ...items.slice(index + 1),
                        ];
                      });
                      save();
                    }}
                  />
                </SortableItem>
              ))}
            </SortableContext>
          </DndContext>
        </CollapsibleContent>
      </Collapsible>
    </>
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(([id]) => active.id === id);
        const newIndex = items.findIndex(([id]) => over.id === id);

        save();
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }
}

function Field({ name, onDelete }: { name: string; onDelete: () => void }) {
  const [delIconRef] = useIconRef<HTMLButtonElement>("trash");
  return (
    <Setting name={<code>{name}</code>}>
      <button ref={delIconRef} onClick={onDelete} />
    </Setting>
  );
}
