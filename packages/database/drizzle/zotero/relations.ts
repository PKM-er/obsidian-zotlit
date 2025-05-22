import { relations } from "drizzle-orm/relations";
import {
  baseFieldMappings,
  charsets,
  collectionItems,
  collectionRelations,
  collections,
  creatorTypes,
  creators,
  customBaseFieldMappings,
  customFields,
  customItemTypeFields,
  customItemTypes,
  deletedCollections,
  deletedItems,
  deletedSearches,
  feedItems,
  feeds,
  fieldFormats,
  fields,
  fieldsCombined,
  fileTypeMimeTypes,
  fileTypes,
  fulltextItemWords,
  fulltextItems,
  fulltextWords,
  groupItems,
  groups,
  itemAnnotations,
  itemAttachments,
  itemCreators,
  itemData,
  itemDataValues,
  itemNotes,
  itemRelations,
  itemTags,
  itemTypeCreatorTypes,
  itemTypeFields,
  itemTypes,
  items,
  libraries,
  proxies,
  proxyHosts,
  relationPredicates,
  retractedItems,
  savedSearchConditions,
  savedSearches,
  storageDeleteLog,
  syncCache,
  syncDeleteLog,
  syncObjectTypes,
  syncQueue,
  syncedSettings,
  tags,
  users,
} from "./schema";

export const fileTypeMimeTypesRelations = relations(
  fileTypeMimeTypes,
  ({ one }) => ({
    fileType: one(fileTypes, {
      fields: [fileTypeMimeTypes.fileTypeId],
      references: [fileTypes.fileTypeId],
    }),
  }),
);

export const fileTypesRelations = relations(fileTypes, ({ many }) => ({
  fileTypeMimeTypes: many(fileTypeMimeTypes),
}));

export const fieldsRelations = relations(fields, ({ one, many }) => ({
  fieldFormat: one(fieldFormats, {
    fields: [fields.fieldFormatId],
    references: [fieldFormats.fieldFormatId],
  }),
  itemTypeFields: many(itemTypeFields),
  baseFieldMappings_fieldId: many(baseFieldMappings, {
    relationName: "baseFieldMappings_fieldId_fields_fieldId",
  }),
  baseFieldMappings_baseFieldId: many(baseFieldMappings, {
    relationName: "baseFieldMappings_baseFieldId_fields_fieldId",
  }),
  customItemTypeFields: many(customItemTypeFields),
  customBaseFieldMappings: many(customBaseFieldMappings),
}));

export const fieldFormatsRelations = relations(fieldFormats, ({ many }) => ({
  fields: many(fields),
}));

export const itemTypeFieldsRelations = relations(itemTypeFields, ({ one }) => ({
  field: one(fields, {
    fields: [itemTypeFields.fieldId],
    references: [fields.fieldId],
  }),
  itemType: one(itemTypes, {
    fields: [itemTypeFields.itemTypeId],
    references: [itemTypes.itemTypeId],
  }),
}));

export const itemTypesRelations = relations(itemTypes, ({ many }) => ({
  itemTypeFields: many(itemTypeFields),
  baseFieldMappings: many(baseFieldMappings),
  itemTypeCreatorTypes: many(itemTypeCreatorTypes),
}));

export const baseFieldMappingsRelations = relations(
  baseFieldMappings,
  ({ one }) => ({
    field_fieldId: one(fields, {
      fields: [baseFieldMappings.fieldId],
      references: [fields.fieldId],
      relationName: "baseFieldMappings_fieldId_fields_fieldId",
    }),
    field_baseFieldId: one(fields, {
      fields: [baseFieldMappings.baseFieldId],
      references: [fields.fieldId],
      relationName: "baseFieldMappings_baseFieldId_fields_fieldId",
    }),
    itemType: one(itemTypes, {
      fields: [baseFieldMappings.itemTypeId],
      references: [itemTypes.itemTypeId],
    }),
  }),
);

export const itemTypeCreatorTypesRelations = relations(
  itemTypeCreatorTypes,
  ({ one }) => ({
    creatorType: one(creatorTypes, {
      fields: [itemTypeCreatorTypes.creatorTypeId],
      references: [creatorTypes.creatorTypeId],
    }),
    itemType: one(itemTypes, {
      fields: [itemTypeCreatorTypes.itemTypeId],
      references: [itemTypes.itemTypeId],
    }),
  }),
);

export const creatorTypesRelations = relations(creatorTypes, ({ many }) => ({
  itemTypeCreatorTypes: many(itemTypeCreatorTypes),
  itemCreators: many(itemCreators),
}));

export const syncedSettingsRelations = relations(syncedSettings, ({ one }) => ({
  library: one(libraries, {
    fields: [syncedSettings.libraryId],
    references: [libraries.libraryId],
  }),
}));

export const librariesRelations = relations(libraries, ({ many }) => ({
  syncedSettings: many(syncedSettings),
  items: many(items),
  collections: many(collections),
  feeds: many(feeds),
  savedSearches: many(savedSearches),
  groups: many(groups),
  syncCaches: many(syncCache),
  syncDeleteLogs: many(syncDeleteLog),
  syncQueues: many(syncQueue),
  storageDeleteLogs: many(storageDeleteLog),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  library: one(libraries, {
    fields: [items.libraryId],
    references: [libraries.libraryId],
  }),
  itemData: many(itemData),
  itemNotes_parentItemId: many(itemNotes, {
    relationName: "itemNotes_parentItemId_items_itemId",
  }),
  itemNotes_itemId: many(itemNotes, {
    relationName: "itemNotes_itemId_items_itemId",
  }),
  itemAttachments_parentItemId: many(itemAttachments, {
    relationName: "itemAttachments_parentItemId_items_itemId",
  }),
  itemAttachments_itemId: many(itemAttachments, {
    relationName: "itemAttachments_itemId_items_itemId",
  }),
  itemAnnotations: many(itemAnnotations),
  itemRelations: many(itemRelations),
  itemTags: many(itemTags),
  itemCreators: many(itemCreators),
  collectionItems: many(collectionItems),
  feedItems: many(feedItems),
  deletedItems: many(deletedItems),
  groupItems: many(groupItems),
  retractedItems: many(retractedItems),
  fulltextItems: many(fulltextItems),
  fulltextItemWords: many(fulltextItemWords),
}));

export const itemDataRelations = relations(itemData, ({ one }) => ({
  itemDataValue: one(itemDataValues, {
    fields: [itemData.valueId],
    references: [itemDataValues.valueId],
  }),
  fieldsCombined: one(fieldsCombined, {
    fields: [itemData.fieldId],
    references: [fieldsCombined.fieldId],
  }),
  item: one(items, {
    fields: [itemData.itemId],
    references: [items.itemId],
  }),
}));

export const itemDataValuesRelations = relations(
  itemDataValues,
  ({ many }) => ({
    itemData: many(itemData),
  }),
);

export const fieldsCombinedRelations = relations(
  fieldsCombined,
  ({ many }) => ({
    itemData: many(itemData),
  }),
);

export const itemNotesRelations = relations(itemNotes, ({ one }) => ({
  item_parentItemId: one(items, {
    fields: [itemNotes.parentItemId],
    references: [items.itemId],
    relationName: "itemNotes_parentItemId_items_itemId",
  }),
  item_itemId: one(items, {
    fields: [itemNotes.itemId],
    references: [items.itemId],
    relationName: "itemNotes_itemId_items_itemId",
  }),
}));

export const itemAttachmentsRelations = relations(
  itemAttachments,
  ({ one, many }) => ({
    charset: one(charsets, {
      fields: [itemAttachments.charsetId],
      references: [charsets.charsetId],
    }),
    item_parentItemId: one(items, {
      fields: [itemAttachments.parentItemId],
      references: [items.itemId],
      relationName: "itemAttachments_parentItemId_items_itemId",
    }),
    item_itemId: one(items, {
      fields: [itemAttachments.itemId],
      references: [items.itemId],
      relationName: "itemAttachments_itemId_items_itemId",
    }),
    itemAnnotations: many(itemAnnotations),
  }),
);

export const charsetsRelations = relations(charsets, ({ many }) => ({
  itemAttachments: many(itemAttachments),
}));

export const itemAnnotationsRelations = relations(
  itemAnnotations,
  ({ one }) => ({
    itemAttachment: one(itemAttachments, {
      fields: [itemAnnotations.parentItemId],
      references: [itemAttachments.itemId],
    }),
    item: one(items, {
      fields: [itemAnnotations.itemId],
      references: [items.itemId],
    }),
  }),
);

export const itemRelationsRelations = relations(itemRelations, ({ one }) => ({
  relationPredicate: one(relationPredicates, {
    fields: [itemRelations.predicateId],
    references: [relationPredicates.predicateId],
  }),
  item: one(items, {
    fields: [itemRelations.itemId],
    references: [items.itemId],
  }),
}));

export const relationPredicatesRelations = relations(
  relationPredicates,
  ({ many }) => ({
    itemRelations: many(itemRelations),
    collectionRelations: many(collectionRelations),
  }),
);

export const itemTagsRelations = relations(itemTags, ({ one }) => ({
  tag: one(tags, {
    fields: [itemTags.tagId],
    references: [tags.tagId],
  }),
  item: one(items, {
    fields: [itemTags.itemId],
    references: [items.itemId],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  itemTags: many(itemTags),
}));

export const itemCreatorsRelations = relations(itemCreators, ({ one }) => ({
  creatorType: one(creatorTypes, {
    fields: [itemCreators.creatorTypeId],
    references: [creatorTypes.creatorTypeId],
  }),
  creator: one(creators, {
    fields: [itemCreators.creatorId],
    references: [creators.creatorId],
  }),
  item: one(items, {
    fields: [itemCreators.itemId],
    references: [items.itemId],
  }),
}));

export const creatorsRelations = relations(creators, ({ many }) => ({
  itemCreators: many(itemCreators),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  collection: one(collections, {
    fields: [collections.parentCollectionId],
    references: [collections.collectionId],
    relationName: "collections_parentCollectionId_collections_collectionId",
  }),
  collections: many(collections, {
    relationName: "collections_parentCollectionId_collections_collectionId",
  }),
  library: one(libraries, {
    fields: [collections.libraryId],
    references: [libraries.libraryId],
  }),
  collectionItems: many(collectionItems),
  collectionRelations: many(collectionRelations),
  deletedCollections: many(deletedCollections),
}));

export const collectionItemsRelations = relations(
  collectionItems,
  ({ one }) => ({
    item: one(items, {
      fields: [collectionItems.itemId],
      references: [items.itemId],
    }),
    collection: one(collections, {
      fields: [collectionItems.collectionId],
      references: [collections.collectionId],
    }),
  }),
);

export const collectionRelationsRelations = relations(
  collectionRelations,
  ({ one }) => ({
    relationPredicate: one(relationPredicates, {
      fields: [collectionRelations.predicateId],
      references: [relationPredicates.predicateId],
    }),
    collection: one(collections, {
      fields: [collectionRelations.collectionId],
      references: [collections.collectionId],
    }),
  }),
);

export const feedsRelations = relations(feeds, ({ one }) => ({
  library: one(libraries, {
    fields: [feeds.libraryId],
    references: [libraries.libraryId],
  }),
}));

export const feedItemsRelations = relations(feedItems, ({ one }) => ({
  item: one(items, {
    fields: [feedItems.itemId],
    references: [items.itemId],
  }),
}));

export const savedSearchesRelations = relations(
  savedSearches,
  ({ one, many }) => ({
    library: one(libraries, {
      fields: [savedSearches.libraryId],
      references: [libraries.libraryId],
    }),
    savedSearchConditions: many(savedSearchConditions),
    deletedSearches: many(deletedSearches),
  }),
);

export const savedSearchConditionsRelations = relations(
  savedSearchConditions,
  ({ one }) => ({
    savedSearch: one(savedSearches, {
      fields: [savedSearchConditions.savedSearchId],
      references: [savedSearches.savedSearchId],
    }),
  }),
);

export const deletedCollectionsRelations = relations(
  deletedCollections,
  ({ one }) => ({
    collection: one(collections, {
      fields: [deletedCollections.collectionId],
      references: [collections.collectionId],
    }),
  }),
);

export const deletedItemsRelations = relations(deletedItems, ({ one }) => ({
  item: one(items, {
    fields: [deletedItems.itemId],
    references: [items.itemId],
  }),
}));

export const deletedSearchesRelations = relations(
  deletedSearches,
  ({ one }) => ({
    savedSearch: one(savedSearches, {
      fields: [deletedSearches.savedSearchId],
      references: [savedSearches.savedSearchId],
    }),
  }),
);

export const groupsRelations = relations(groups, ({ one }) => ({
  library: one(libraries, {
    fields: [groups.libraryId],
    references: [libraries.libraryId],
  }),
}));

export const groupItemsRelations = relations(groupItems, ({ one }) => ({
  user_lastModifiedByUserId: one(users, {
    fields: [groupItems.lastModifiedByUserId],
    references: [users.userId],
    relationName: "groupItems_lastModifiedByUserId_users_userId",
  }),
  user_createdByUserId: one(users, {
    fields: [groupItems.createdByUserId],
    references: [users.userId],
    relationName: "groupItems_createdByUserId_users_userId",
  }),
  item: one(items, {
    fields: [groupItems.itemId],
    references: [items.itemId],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  groupItems_lastModifiedByUserId: many(groupItems, {
    relationName: "groupItems_lastModifiedByUserId_users_userId",
  }),
  groupItems_createdByUserId: many(groupItems, {
    relationName: "groupItems_createdByUserId_users_userId",
  }),
}));

export const retractedItemsRelations = relations(retractedItems, ({ one }) => ({
  item: one(items, {
    fields: [retractedItems.itemId],
    references: [items.itemId],
  }),
}));

export const fulltextItemsRelations = relations(fulltextItems, ({ one }) => ({
  item: one(items, {
    fields: [fulltextItems.itemId],
    references: [items.itemId],
  }),
}));

export const fulltextItemWordsRelations = relations(
  fulltextItemWords,
  ({ one }) => ({
    item: one(items, {
      fields: [fulltextItemWords.itemId],
      references: [items.itemId],
    }),
    fulltextWord: one(fulltextWords, {
      fields: [fulltextItemWords.wordId],
      references: [fulltextWords.wordId],
    }),
  }),
);

export const fulltextWordsRelations = relations(fulltextWords, ({ many }) => ({
  fulltextItemWords: many(fulltextItemWords),
}));

export const syncCacheRelations = relations(syncCache, ({ one }) => ({
  syncObjectType: one(syncObjectTypes, {
    fields: [syncCache.syncObjectTypeId],
    references: [syncObjectTypes.syncObjectTypeId],
  }),
  library: one(libraries, {
    fields: [syncCache.libraryId],
    references: [libraries.libraryId],
  }),
}));

export const syncObjectTypesRelations = relations(
  syncObjectTypes,
  ({ many }) => ({
    syncCaches: many(syncCache),
    syncDeleteLogs: many(syncDeleteLog),
    syncQueues: many(syncQueue),
  }),
);

export const syncDeleteLogRelations = relations(syncDeleteLog, ({ one }) => ({
  library: one(libraries, {
    fields: [syncDeleteLog.libraryId],
    references: [libraries.libraryId],
  }),
  syncObjectType: one(syncObjectTypes, {
    fields: [syncDeleteLog.syncObjectTypeId],
    references: [syncObjectTypes.syncObjectTypeId],
  }),
}));

export const syncQueueRelations = relations(syncQueue, ({ one }) => ({
  syncObjectType: one(syncObjectTypes, {
    fields: [syncQueue.syncObjectTypeId],
    references: [syncObjectTypes.syncObjectTypeId],
  }),
  library: one(libraries, {
    fields: [syncQueue.libraryId],
    references: [libraries.libraryId],
  }),
}));

export const storageDeleteLogRelations = relations(
  storageDeleteLog,
  ({ one }) => ({
    library: one(libraries, {
      fields: [storageDeleteLog.libraryId],
      references: [libraries.libraryId],
    }),
  }),
);

export const proxyHostsRelations = relations(proxyHosts, ({ one }) => ({
  proxy: one(proxies, {
    fields: [proxyHosts.proxyId],
    references: [proxies.proxyId],
  }),
}));

export const proxiesRelations = relations(proxies, ({ many }) => ({
  proxyHosts: many(proxyHosts),
}));

export const customItemTypeFieldsRelations = relations(
  customItemTypeFields,
  ({ one }) => ({
    customField: one(customFields, {
      fields: [customItemTypeFields.customFieldId],
      references: [customFields.customFieldId],
    }),
    field: one(fields, {
      fields: [customItemTypeFields.fieldId],
      references: [fields.fieldId],
    }),
    customItemType: one(customItemTypes, {
      fields: [customItemTypeFields.customItemTypeId],
      references: [customItemTypes.customItemTypeId],
    }),
  }),
);

export const customFieldsRelations = relations(customFields, ({ many }) => ({
  customItemTypeFields: many(customItemTypeFields),
  customBaseFieldMappings: many(customBaseFieldMappings),
}));

export const customItemTypesRelations = relations(
  customItemTypes,
  ({ many }) => ({
    customItemTypeFields: many(customItemTypeFields),
    customBaseFieldMappings: many(customBaseFieldMappings),
  }),
);

export const customBaseFieldMappingsRelations = relations(
  customBaseFieldMappings,
  ({ one }) => ({
    customField: one(customFields, {
      fields: [customBaseFieldMappings.customFieldId],
      references: [customFields.customFieldId],
    }),
    field: one(fields, {
      fields: [customBaseFieldMappings.baseFieldId],
      references: [fields.fieldId],
    }),
    customItemType: one(customItemTypes, {
      fields: [customBaseFieldMappings.customItemTypeId],
      references: [customItemTypes.customItemTypeId],
    }),
  }),
);
