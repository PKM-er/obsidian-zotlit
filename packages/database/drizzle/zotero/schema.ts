import { sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  integer,
  numeric,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const fieldFormats = sqliteTable("fieldFormats", {
  fieldFormatId: integer().primaryKey(),
  regex: text(),
  isInteger: integer(),
});

export const charsets = sqliteTable(
  "charsets",
  {
    charsetId: integer().primaryKey(),
    charset: text(),
  },
  (table) => [index("charsets_charset").on(table.charset)],
);

export const fileTypes = sqliteTable(
  "fileTypes",
  {
    fileTypeId: integer().primaryKey(),
    fileType: text(),
  },
  (table) => [index("fileTypes_fileType").on(table.fileType)],
);

export const fileTypeMimeTypes = sqliteTable(
  "fileTypeMimeTypes",
  {
    fileTypeId: integer().references(() => fileTypes.fileTypeId),
    mimeType: text(),
  },
  (table) => [
    index("fileTypeMimeTypes_mimeType").on(table.mimeType),
    primaryKey({
      columns: [table.fileTypeId, table.mimeType],
      name: "fileTypeMimeTypes_fileTypeID_mimeType_pk",
    }),
  ],
);

export const syncObjectTypes = sqliteTable(
  "syncObjectTypes",
  {
    syncObjectTypeId: integer().primaryKey(),
    name: text(),
  },
  (table) => [index("syncObjectTypes_name").on(table.name)],
);

export const itemTypes = sqliteTable("itemTypes", {
  itemTypeId: integer().primaryKey(),
  typeName: text(),
  templateItemTypeId: integer(),
  display: integer().default(1),
});

export const itemTypesCombined = sqliteTable("itemTypesCombined", {
  itemTypeId: integer().primaryKey().notNull(),
  typeName: text().notNull(),
  display: integer().default(1).notNull(),
  custom: integer().notNull(),
});

export const fields = sqliteTable("fields", {
  fieldId: integer().primaryKey(),
  fieldName: text(),
  fieldFormatId: integer().references(() => fieldFormats.fieldFormatId),
});

export const fieldsCombined = sqliteTable("fieldsCombined", {
  fieldId: integer().primaryKey().notNull(),
  fieldName: text().notNull(),
  label: text(),
  fieldFormatId: integer(),
  custom: integer().notNull(),
});

export const itemTypeFields = sqliteTable(
  "itemTypeFields",
  {
    itemTypeId: integer().references(() => itemTypes.itemTypeId),
    fieldId: integer().references(() => fields.fieldId),
    hide: integer(),
    orderIndex: integer(),
  },
  (table) => [
    index("itemTypeFields_fieldID").on(table.fieldId),
    primaryKey({
      columns: [table.itemTypeId, table.orderIndex],
      name: "itemTypeFields_itemTypeID_orderIndex_pk",
    }),
  ],
);

export const itemTypeFieldsCombined = sqliteTable(
  "itemTypeFieldsCombined",
  {
    itemTypeId: integer().notNull(),
    fieldId: integer().notNull(),
    hide: integer(),
    orderIndex: integer().notNull(),
  },
  (table) => [
    index("itemTypeFieldsCombined_fieldID").on(table.fieldId),
    primaryKey({
      columns: [table.itemTypeId, table.orderIndex],
      name: "itemTypeFieldsCombined_itemTypeID_orderIndex_pk",
    }),
  ],
);

export const baseFieldMappings = sqliteTable(
  "baseFieldMappings",
  {
    itemTypeId: integer().references(() => itemTypes.itemTypeId),
    baseFieldId: integer().references(() => fields.fieldId),
    fieldId: integer().references(() => fields.fieldId),
  },
  (table) => [
    index("baseFieldMappings_fieldID").on(table.fieldId),
    index("baseFieldMappings_baseFieldID").on(table.baseFieldId),
    primaryKey({
      columns: [table.itemTypeId, table.baseFieldId, table.fieldId],
      name: "baseFieldMappings_itemTypeID_baseFieldID_fieldID_pk",
    }),
  ],
);

export const baseFieldMappingsCombined = sqliteTable(
  "baseFieldMappingsCombined",
  {
    itemTypeId: integer(),
    baseFieldId: integer(),
    fieldId: integer(),
  },
  (table) => [
    index("baseFieldMappingsCombined_fieldID").on(table.fieldId),
    index("baseFieldMappingsCombined_baseFieldID").on(table.baseFieldId),
    primaryKey({
      columns: [table.itemTypeId, table.baseFieldId, table.fieldId],
      name: "baseFieldMappingsCombined_itemTypeID_baseFieldID_fieldID_pk",
    }),
  ],
);

export const creatorTypes = sqliteTable("creatorTypes", {
  creatorTypeId: integer().primaryKey(),
  creatorType: text(),
});

export const itemTypeCreatorTypes = sqliteTable(
  "itemTypeCreatorTypes",
  {
    itemTypeId: integer().references(() => itemTypes.itemTypeId),
    creatorTypeId: integer().references(() => creatorTypes.creatorTypeId),
    primaryField: integer(),
  },
  (table) => [
    index("itemTypeCreatorTypes_creatorTypeID").on(table.creatorTypeId),
    primaryKey({
      columns: [table.itemTypeId, table.creatorTypeId],
      name: "itemTypeCreatorTypes_itemTypeID_creatorTypeID_pk",
    }),
  ],
);

export const version = sqliteTable(
  "version",
  {
    schema: text().primaryKey(),
    version: integer().notNull(),
  },
  (table) => [index("schema").on(table.schema)],
);

export const settings = sqliteTable(
  "settings",
  {
    setting: text(),
    key: text(),
    value: numeric(),
  },
  (table) => [
    primaryKey({
      columns: [table.setting, table.key],
      name: "settings_setting_key_pk",
    }),
  ],
);

export const syncedSettings = sqliteTable(
  "syncedSettings",
  {
    setting: text().notNull(),
    libraryId: integer()
      .notNull()
      .references(() => libraries.libraryId, { onDelete: "cascade" }),
    value: numeric().notNull(),
    version: integer().default(0).notNull(),
    synced: integer().default(0).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.setting, table.libraryId],
      name: "syncedSettings_setting_libraryID_pk",
    }),
  ],
);

export const items = sqliteTable(
  "items",
  {
    itemId: integer().primaryKey(),
    itemTypeId: integer().notNull(),
    dateAdded: text().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    dateModified: text().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    clientDateModified: text().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    libraryId: integer()
      .notNull()
      .references(() => libraries.libraryId, { onDelete: "cascade" }),
    key: text().notNull(),
    version: integer().default(0).notNull(),
    synced: integer().default(0).notNull(),
  },
  (table) => [index("items_synced").on(table.synced)],
);

export const itemDataValues = sqliteTable("itemDataValues", {
  valueId: integer().primaryKey(),
  value: numeric(),
});

export const itemData = sqliteTable(
  "itemData",
  {
    itemId: integer().references(() => items.itemId, { onDelete: "cascade" }),
    fieldId: integer().references(() => fieldsCombined.fieldId),
    valueId: numeric().references(() => itemDataValues.valueId),
  },
  (table) => [
    index("itemData_valueID").on(table.valueId),
    index("itemData_fieldID").on(table.fieldId),
    primaryKey({
      columns: [table.itemId, table.fieldId],
      name: "itemData_itemID_fieldID_pk",
    }),
  ],
);

export const itemNotes = sqliteTable(
  "itemNotes",
  {
    itemId: integer()
      .primaryKey()
      .references(() => items.itemId, { onDelete: "cascade" }),
    parentItemId: integer().references(() => items.itemId, {
      onDelete: "cascade",
    }),
    note: text(),
    title: text(),
  },
  (table) => [index("itemNotes_parentItemID").on(table.parentItemId)],
);

export const itemAttachments = sqliteTable(
  "itemAttachments",
  {
    itemId: integer()
      .primaryKey()
      .references(() => items.itemId, { onDelete: "cascade" }),
    parentItemId: integer().references(() => items.itemId, {
      onDelete: "cascade",
    }),
    linkMode: integer(),
    contentType: text(),
    charsetId: integer().references(() => charsets.charsetId, {
      onDelete: "set null",
    }),
    path: text(),
    syncState: integer().default(0),
    storageModTime: integer(),
    storageHash: text(),
    lastProcessedModificationTime: integer(),
  },
  (table) => [
    index("itemAttachments_lastProcessedModificationTime").on(
      table.lastProcessedModificationTime,
    ),
    index("itemAttachments_syncState").on(table.syncState),
    index("itemAttachments_contentType").on(table.contentType),
    index("itemAttachments_charsetID").on(table.charsetId),
    index("itemAttachments_parentItemID").on(table.parentItemId),
  ],
);

export const itemAnnotations = sqliteTable(
  "itemAnnotations",
  {
    itemId: integer()
      .primaryKey()
      .references(() => items.itemId, { onDelete: "cascade" }),
    parentItemId: integer()
      .notNull()
      .references(() => itemAttachments.itemId),
    type: integer().notNull(),
    authorName: text(),
    text: text(),
    comment: text(),
    color: text(),
    pageLabel: text(),
    sortIndex: text().notNull(),
    position: text().notNull(),
    isExternal: integer().notNull(),
  },
  (table) => [index("itemAnnotations_parentItemID").on(table.parentItemId)],
);

export const tags = sqliteTable("tags", {
  tagId: integer().primaryKey(),
  name: text().notNull(),
});

export const itemRelations = sqliteTable(
  "itemRelations",
  {
    itemId: integer()
      .notNull()
      .references(() => items.itemId, { onDelete: "cascade" }),
    predicateId: integer()
      .notNull()
      .references(() => relationPredicates.predicateId, {
        onDelete: "cascade",
      }),
    object: text().notNull(),
  },
  (table) => [
    index("itemRelations_object").on(table.object),
    index("itemRelations_predicateID").on(table.predicateId),
    primaryKey({
      columns: [table.itemId, table.predicateId, table.object],
      name: "itemRelations_itemID_predicateID_object_pk",
    }),
  ],
);

export const itemTags = sqliteTable(
  "itemTags",
  {
    itemId: integer()
      .notNull()
      .references(() => items.itemId, { onDelete: "cascade" }),
    tagId: integer()
      .notNull()
      .references(() => tags.tagId, { onDelete: "cascade" }),
    type: integer().notNull(),
  },
  (table) => [
    index("itemTags_tagID").on(table.tagId),
    primaryKey({
      columns: [table.itemId, table.tagId],
      name: "itemTags_itemID_tagID_pk",
    }),
  ],
);

export const creators = sqliteTable("creators", {
  creatorId: integer().primaryKey(),
  firstName: text(),
  lastName: text(),
  fieldMode: integer(),
});

export const itemCreators = sqliteTable(
  "itemCreators",
  {
    itemId: integer()
      .notNull()
      .references(() => items.itemId, { onDelete: "cascade" }),
    creatorId: integer()
      .notNull()
      .references(() => creators.creatorId, { onDelete: "cascade" }),
    creatorTypeId: integer()
      .default(1)
      .notNull()
      .references(() => creatorTypes.creatorTypeId),
    orderIndex: integer().default(0).notNull(),
  },
  (table) => [
    index("itemCreators_creatorTypeID").on(table.creatorTypeId),
    primaryKey({
      columns: [
        table.itemId,
        table.creatorId,
        table.creatorTypeId,
        table.orderIndex,
      ],
      name: "itemCreators_itemID_creatorID_creatorTypeID_orderIndex_pk",
    }),
  ],
);

export const collections = sqliteTable(
  "collections",
  {
    collectionId: integer().primaryKey(),
    collectionName: text().notNull(),
    parentCollectionId: integer().default(sql`(NULL)`),
    clientDateModified: text().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    libraryId: integer()
      .notNull()
      .references(() => libraries.libraryId, { onDelete: "cascade" }),
    key: text().notNull(),
    version: integer().default(0).notNull(),
    synced: integer().default(0).notNull(),
  },
  (table) => [
    index("collections_synced").on(table.synced),
    foreignKey(() => ({
      columns: [table.parentCollectionId],
      foreignColumns: [table.collectionId],
      name: "collections_parentCollectionID_collections_collectionID_fk",
    })).onDelete("cascade"),
  ],
);

export const collectionItems = sqliteTable(
  "collectionItems",
  {
    collectionId: integer()
      .notNull()
      .references(() => collections.collectionId, { onDelete: "cascade" }),
    itemId: integer()
      .notNull()
      .references(() => items.itemId, { onDelete: "cascade" }),
    orderIndex: integer().default(0).notNull(),
  },
  (table) => [
    index("collectionItems_itemID").on(table.itemId),
    primaryKey({
      columns: [table.collectionId, table.itemId],
      name: "collectionItems_collectionID_itemID_pk",
    }),
  ],
);

export const collectionRelations = sqliteTable(
  "collectionRelations",
  {
    collectionId: integer()
      .notNull()
      .references(() => collections.collectionId, { onDelete: "cascade" }),
    predicateId: integer()
      .notNull()
      .references(() => relationPredicates.predicateId, {
        onDelete: "cascade",
      }),
    object: text().notNull(),
  },
  (table) => [
    index("collectionRelations_object").on(table.object),
    index("collectionRelations_predicateID").on(table.predicateId),
    primaryKey({
      columns: [table.collectionId, table.predicateId, table.object],
      name: "collectionRelations_collectionID_predicateID_object_pk",
    }),
  ],
);

export const feeds = sqliteTable("feeds", {
  libraryId: integer()
    .primaryKey()
    .references(() => libraries.libraryId, { onDelete: "cascade" }),
  name: text().notNull(),
  url: text().notNull(),
  lastUpdate: numeric(),
  lastCheck: numeric(),
  lastCheckError: text(),
  cleanupReadAfter: integer(),
  cleanupUnreadAfter: integer(),
  refreshInterval: integer(),
});

export const feedItems = sqliteTable("feedItems", {
  itemId: integer()
    .primaryKey()
    .references(() => items.itemId, { onDelete: "cascade" }),
  guid: text().notNull(),
  readTime: numeric(),
  translatedTime: numeric(),
});

export const savedSearches = sqliteTable(
  "savedSearches",
  {
    savedSearchId: integer().primaryKey(),
    savedSearchName: text().notNull(),
    clientDateModified: text().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    libraryId: integer()
      .notNull()
      .references(() => libraries.libraryId, { onDelete: "cascade" }),
    key: text().notNull(),
    version: integer().default(0).notNull(),
    synced: integer().default(0).notNull(),
  },
  (table) => [index("savedSearches_synced").on(table.synced)],
);

export const savedSearchConditions = sqliteTable(
  "savedSearchConditions",
  {
    savedSearchId: integer()
      .notNull()
      .references(() => savedSearches.savedSearchId, { onDelete: "cascade" }),
    searchConditionId: integer().notNull(),
    condition: text().notNull(),
    operator: text(),
    value: text(),
    required: numeric(),
  },
  (table) => [
    primaryKey({
      columns: [table.savedSearchId, table.searchConditionId],
      name: "savedSearchConditions_savedSearchID_searchConditionID_pk",
    }),
  ],
);

export const deletedCollections = sqliteTable(
  "deletedCollections",
  {
    collectionId: integer()
      .primaryKey()
      .references(() => collections.collectionId, { onDelete: "cascade" }),
    dateDeleted: text().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  },
  (table) => [index("deletedCollections_dateDeleted").on(table.dateDeleted)],
);

export const deletedItems = sqliteTable(
  "deletedItems",
  {
    itemId: integer()
      .primaryKey()
      .references(() => items.itemId, { onDelete: "cascade" }),
    dateDeleted: text().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  },
  (table) => [
    index("deletedSearches_dateDeleted").on(table.dateDeleted),
    index("deletedItems_dateDeleted").on(table.dateDeleted),
  ],
);

export const deletedSearches = sqliteTable("deletedSearches", {
  savedSearchId: integer()
    .primaryKey()
    .references(() => savedSearches.savedSearchId, { onDelete: "cascade" }),
  dateDeleted: text().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const libraries = sqliteTable("libraries", {
  libraryId: integer().primaryKey(),
  type: text().notNull(),
  editable: integer().notNull(),
  filesEditable: integer().notNull(),
  version: integer().default(0).notNull(),
  storageVersion: integer().default(0).notNull(),
  lastSync: integer().default(0).notNull(),
  archived: integer().default(0).notNull(),
});

export const users = sqliteTable("users", {
  userId: integer().primaryKey(),
  name: text().notNull(),
});

export const groups = sqliteTable("groups", {
  groupId: integer().primaryKey(),
  libraryId: integer()
    .notNull()
    .references(() => libraries.libraryId, { onDelete: "cascade" }),
  name: text().notNull(),
  description: text().notNull(),
  version: integer().notNull(),
});

export const groupItems = sqliteTable("groupItems", {
  itemId: integer()
    .primaryKey()
    .references(() => items.itemId, { onDelete: "cascade" }),
  createdByUserId: integer().references(() => users.userId, {
    onDelete: "set null",
  }),
  lastModifiedByUserId: integer().references(() => users.userId, {
    onDelete: "set null",
  }),
});

export const publicationsItems = sqliteTable("publicationsItems", {
  itemId: integer().primaryKey(),
});

export const retractedItems = sqliteTable("retractedItems", {
  itemId: integer()
    .primaryKey()
    .references(() => items.itemId, { onDelete: "cascade" }),
  data: text(),
  flag: integer().default(0),
});

export const fulltextItems = sqliteTable(
  "fulltextItems",
  {
    itemId: integer()
      .primaryKey()
      .references(() => items.itemId, { onDelete: "cascade" }),
    indexedPages: integer(),
    totalPages: integer(),
    indexedChars: integer(),
    totalChars: integer(),
    version: integer().default(0).notNull(),
    synced: integer().default(0).notNull(),
  },
  (table) => [
    index("fulltextItems_version").on(table.version),
    index("fulltextItems_synced").on(table.synced),
  ],
);

export const fulltextWords = sqliteTable("fulltextWords", {
  wordId: integer().primaryKey(),
  word: text(),
});

export const fulltextItemWords = sqliteTable(
  "fulltextItemWords",
  {
    wordId: integer().references(() => fulltextWords.wordId),
    itemId: integer().references(() => items.itemId, { onDelete: "cascade" }),
  },
  (table) => [
    index("fulltextItemWords_itemID").on(table.itemId),
    primaryKey({
      columns: [table.wordId, table.itemId],
      name: "fulltextItemWords_wordID_itemID_pk",
    }),
  ],
);

export const syncCache = sqliteTable(
  "syncCache",
  {
    libraryId: integer()
      .notNull()
      .references(() => libraries.libraryId, { onDelete: "cascade" }),
    key: text().notNull(),
    syncObjectTypeId: integer()
      .notNull()
      .references(() => syncObjectTypes.syncObjectTypeId),
    version: integer().notNull(),
    data: text(),
  },
  (table) => [
    primaryKey({
      columns: [
        table.libraryId,
        table.key,
        table.syncObjectTypeId,
        table.version,
      ],
      name: "syncCache_libraryID_key_syncObjectTypeID_version_pk",
    }),
  ],
);

export const syncDeleteLog = sqliteTable("syncDeleteLog", {
  syncObjectTypeId: integer()
    .notNull()
    .references(() => syncObjectTypes.syncObjectTypeId),
  libraryId: integer()
    .notNull()
    .references(() => libraries.libraryId, { onDelete: "cascade" }),
  key: text().notNull(),
  dateDeleted: text().default("sql`(CURRENT_TIMESTAMP)`").notNull(),
});

export const syncQueue = sqliteTable(
  "syncQueue",
  {
    libraryId: integer()
      .notNull()
      .references(() => libraries.libraryId, { onDelete: "cascade" }),
    key: text().notNull(),
    syncObjectTypeId: integer()
      .notNull()
      .references(() => syncObjectTypes.syncObjectTypeId, {
        onDelete: "cascade",
      }),
    lastCheck: numeric(),
    tries: integer(),
  },
  (table) => [
    primaryKey({
      columns: [table.libraryId, table.key, table.syncObjectTypeId],
      name: "syncQueue_libraryID_key_syncObjectTypeID_pk",
    }),
  ],
);

export const storageDeleteLog = sqliteTable(
  "storageDeleteLog",
  {
    libraryId: integer()
      .notNull()
      .references(() => libraries.libraryId, { onDelete: "cascade" }),
    key: text().notNull(),
    dateDeleted: text().default("sql`(CURRENT_TIMESTAMP)`").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.libraryId, table.key],
      name: "storageDeleteLog_libraryID_key_pk",
    }),
  ],
);

export const proxies = sqliteTable("proxies", {
  proxyId: integer().primaryKey(),
  multiHost: integer(),
  autoAssociate: integer(),
  scheme: text(),
});

export const proxyHosts = sqliteTable(
  "proxyHosts",
  {
    hostId: integer().primaryKey(),
    proxyId: integer().references(() => proxies.proxyId),
    hostname: text(),
  },
  (table) => [index("proxyHosts_proxyID").on(table.proxyId)],
);

export const relationPredicates = sqliteTable("relationPredicates", {
  predicateId: integer().primaryKey(),
  predicate: text(),
});

export const customItemTypes = sqliteTable("customItemTypes", {
  customItemTypeId: integer().primaryKey(),
  typeName: text(),
  label: text(),
  display: integer().default(1),
  icon: text(),
});

export const customFields = sqliteTable("customFields", {
  customFieldId: integer().primaryKey(),
  fieldName: text(),
  label: text(),
});

export const customItemTypeFields = sqliteTable(
  "customItemTypeFields",
  {
    customItemTypeId: integer()
      .notNull()
      .references(() => customItemTypes.customItemTypeId),
    fieldId: integer().references(() => fields.fieldId),
    customFieldId: integer().references(() => customFields.customFieldId),
    hide: integer().notNull(),
    orderIndex: integer().notNull(),
  },
  (table) => [
    index("customItemTypeFields_customFieldID").on(table.customFieldId),
    index("customItemTypeFields_fieldID").on(table.fieldId),
    primaryKey({
      columns: [table.customItemTypeId, table.orderIndex],
      name: "customItemTypeFields_customItemTypeID_orderIndex_pk",
    }),
  ],
);

export const customBaseFieldMappings = sqliteTable(
  "customBaseFieldMappings",
  {
    customItemTypeId: integer().references(
      () => customItemTypes.customItemTypeId,
    ),
    baseFieldId: integer().references(() => fields.fieldId),
    customFieldId: integer().references(() => customFields.customFieldId),
  },
  (table) => [
    index("customBaseFieldMappings_customFieldID").on(table.customFieldId),
    index("customBaseFieldMappings_baseFieldID").on(table.baseFieldId),
    primaryKey({
      columns: [table.customItemTypeId, table.baseFieldId, table.customFieldId],
      name: "customBaseFieldMappings_customItemTypeID_baseFieldID_customFieldID_pk",
    }),
  ],
);

export const translatorCache = sqliteTable("translatorCache", {
  fileName: text().primaryKey(),
  metadataJson: text(),
  lastModifiedTime: integer(),
});

export const dbDebug1 = sqliteTable("dbDebug1", {
  a: integer().primaryKey(),
});
