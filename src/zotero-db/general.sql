SELECT
  key,
  itemID,
  fieldName,
  typeName itemType,
  value
FROM
  items
  JOIN itemData USING (itemID)
  JOIN itemDataValues USING (valueID)
  JOIN fields USING (fieldID)
  JOIN itemTypes USING (itemTypeID)
WHERE
  libraryID = ?
  AND itemTypeID NOT IN (1, 3, 27) -- annotation, attachment, note
  AND itemID NOT IN (
    SELECT
      itemID
    FROM
      deletedItems
  )