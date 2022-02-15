SELECT
  libraryID,
  key,
  itemID,
  typeName itemType,
  fieldName,
  value
FROM
  items
  JOIN itemData USING (itemID)
  JOIN itemDataValues USING (valueID)
  JOIN fields USING (fieldID)
  JOIN itemTypes USING (itemTypeID)
WHERE
  libraryID = ?
  AND itemType NOT IN ('annotation', 'attachment', 'note')
  AND itemID NOT IN (
    SELECT
      itemID
    FROM
      deletedItems
  )