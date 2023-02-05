import { append, removeAt, updateAt } from "@mobily/ts-belt/Array";
import { update } from "@mobily/ts-belt/Dict";
import { NoteFields } from "@obzt/components";
import { useDebounceFn } from "ahooks";
import { debounce } from "obsidian";
import { useEffect, useState } from "react";
import { useErrorHandler } from "react-error-boundary";
import { nanoid } from "./uuid";
import type { NoteFieldsView } from "./view";

export function NoteFieldsMain({ view }: { view: NoteFieldsView }) {
  const [fields, setFields] = useState(() => view.getFields());

  // const [saving, { setTrue: setSaving, setFalse: setSaved }] =
  //   useBoolean(false);
  const handleError = useErrorHandler();
  useEffect(() => {
    const updateFields = debounce(
      () => {
        try {
          setFields(view.getFields());
        } catch (error) {
          handleError(error);
        }
        // setSaved();
      },
      500,
      true,
    );

    const ref = view.app.metadataCache.on("changed", (file) => {
      if (file.path !== view.file.path) return;
      updateFields();
    });
    return () => view.app.metadataCache.offref(ref);
  }, [view, handleError]);

  useEffect(
    () =>
      view.registerUpdateHanlder(() => {
        try {
          setFields(view.getFields());
        } catch (error) {
          handleError(error);
        }
      }),
    [view, handleError],
  );
  const { run: saveField } = useDebounceFn(
    (...args: Parameters<NoteFieldsView["setField"]>) => {
      try {
        view.setField(...args);
      } catch (error) {
        handleError(error);
      }
    },
    {
      wait: 200,
    },
  );
  if (!fields) return null;
  return (
    <NoteFields
      data={fields}
      // saving={saving}
      onSave={(field, index, id) => {
        if (!fields?.[field]) return;
        // setSaving();
        saveField(fields[field][index]?.content ?? null, field, index, id);
      }}
      onAdd={(field) =>
        setFields(
          update(fields, field, (prev) =>
            append(prev ?? [], { content: "", id: nanoid() }),
          ),
        )
      }
      onChange={(content, field, index, id) => {
        setFields(
          update(fields, field, (prev) =>
            prev
              ? updateAt(prev, index, () => ({ content, id }))
              : [{ content, id }],
          ),
        );
      }}
      onDelete={(field, index, id) => {
        setFields(
          update(fields, field, (prev) => prev && removeAt(prev, index)),
        );
        // setSaving();
        saveField(null, field, index, id);
      }}
    />
  );
}
