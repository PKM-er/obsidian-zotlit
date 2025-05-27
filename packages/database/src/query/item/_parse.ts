import type { ItemQueryRawResult, ItemQueryRawField } from "./_sql";
import { ZoteroEnumSchema } from "@/lib/zt-enum";
import * as v from "valibot";

export interface ItemQueryCollection {
  key: string;
  collectionId: number;
  collectionName: string;
  orderIndex: number;
}

export interface ItemQueryCreator {
  creatorId: number;
  firstName: string | null;
  lastName: string | null;
  fieldMode: CreatorFieldModeValue;
  type: string | null;
}

export interface ItemQueryTag {
  tagId: number;
  name: string;
  type: TagTypeValue;
}

type CreatorFieldModeValue = v.InferOutput<typeof ZoteroEnumSchema>;
type AttachmentLinkModeValue = v.InferOutput<typeof ZoteroEnumSchema>;
type TagTypeValue = v.InferOutput<typeof ZoteroEnumSchema>;

export interface ItemQueryAttachment {
  itemId: number;
  key: string;
  contentType: string | null;
  linkMode: AttachmentLinkModeValue;
  path: string | null;
  charset: string | null;
}

export interface ItemQueryResult {
  tags: ItemQueryTag[];
  collections: ItemQueryCollection[];
  creators: ItemQueryCreator[];
  fields: ItemQueryField[];
  itemTypeId: number;
  key: string;
  libraryId: number;
  itemId: number;
  clientDateModified: Date | null;
  dateAdded: Date | null;
  dateModified: Date | null;
  dateAccessed: Date | null;
  attachments: ItemQueryAttachment[];
}

type ItemQueryField = {
  uid: string;
  fieldId: number;
  name: string;
  label: string | null;
  fieldFormatId: number | null;
  value: string;
  isCustom: boolean;
};

export function parseItem(
  input: ItemQueryRawResult | null | undefined,
): ItemQueryResult | null;
export function parseItem(input: ItemQueryRawResult): ItemQueryResult;
export function parseItem(
  input: ItemQueryRawResult | null | undefined,
): ItemQueryResult | null {
  if (!input) return null;
  const {
    collectionItems,
    itemAttachments_parentItemId: attachments,
    itemTags,
    itemCreators,
    clientDateModified,
    dateAdded,
    dateModified,
    itemData,
    ...item
  } = input;

  const fields = parseItemFields(itemData);

  return {
    ...item,
    tags: itemTags.map((f) => ({
      tagId: f.tag.tagId,
      name: f.tag.name,
      type: v.parse(ZoteroEnumSchema, f.type),
    })),
    attachments: attachments.map((f) => ({
      charset: f.charset?.charset ?? null,
      contentType: f.contentType,
      key: f.item_itemId.key,
      linkMode: v.parse(ZoteroEnumSchema, f.linkMode),
      path: f.path,
      itemId: f.itemId,
    })),
    collections: collectionItems.map(({ orderIndex, collection }) => ({
      orderIndex,
      ...collection,
    })),
    creators: itemCreators
      .map(
        ({
          orderIndex,
          creatorId,
          creator: { fieldMode, ...creator },
          creatorType,
        }) => ({
          ...creator,
          fieldMode: v.parse(ZoteroEnumSchema, fieldMode),
          orderIndex,
          creatorId,
          type: creatorType.creatorType,
        }),
      )
      .sort((a, b) => a.orderIndex - b.orderIndex),
    fields,
    clientDateModified: parseDateString(clientDateModified),
    dateAdded: parseDateString(dateAdded),
    dateModified: parseDateString(dateModified),
    dateAccessed: parseItemAccessDate(fields),
  };
}

function parseDateString(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function parseItemFields(data: ItemQueryRawField[]): ItemQueryField[] {
  const rows = data
    .map((v): ItemQueryField | null => {
      if (!v.fieldsCombined || !v.itemId || !v.itemDataValue?.value)
        return null;
      const uid = [
        v.itemId,
        v.fieldsCombined.fieldId,
        v.itemDataValue.valueId,
      ].join("_");
      return {
        uid,
        fieldId: v.fieldsCombined.fieldId,
        name: v.fieldsCombined.fieldName,
        label: v.fieldsCombined.label,
        fieldFormatId: v.fieldsCombined.fieldFormatId,
        value: v.itemDataValue.value,
        // https://github.com/zotero/zotero/blob/3ff13bc08ddfc01b29e6a30136a06f5a1259abd5/chrome/content/zotero/xpcom/schema.js#L901C1-L905C5
        isCustom: v.fieldsCombined.custom !== 0,
      };
    })
    .filter((v) => !!v);

  return rows;
}

function parseItemAccessDate(fields: ItemQueryField[]): Date | null {
  const accessDateField = fields.find(
    (v) => v.name === "accessDate" && !v.isCustom,
  );
  if (!accessDateField) return null;
  const accessDate = accessDateField.value;
  if (!accessDate) return null;
  return parseDateString(accessDate);
}
