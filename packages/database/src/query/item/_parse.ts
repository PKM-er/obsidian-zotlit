import type { ItemQueryRawResult, ItemQueryRawField } from "./_sql";

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
  fieldMode: number | null;
  type: string | null;
}

export interface ItemQueryResult {
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
    collections: collectionItems.map(({ orderIndex, collection }) => ({
      orderIndex,
      ...collection,
    })),
    creators: itemCreators
      .map(({ orderIndex, creatorId, creator, creatorType }) => ({
        ...creator,
        orderIndex,
        creatorId,
        type: creatorType.creatorType,
      }))
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
