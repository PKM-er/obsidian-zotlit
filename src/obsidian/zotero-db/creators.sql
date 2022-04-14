SELECT
  itemID,
  firstName,
  lastName,
  fieldMode, -- 0: with full name, 1: only last name
  creatorType,
  orderIndex
FROM
  items
  LEFT JOIN itemCreators USING (itemID)
  JOIN creators USING (creatorID)
  JOIN creatorTypes USING (creatorTypeID) 
WHERE
  libraryID = ?
ORDER BY
  itemID,
  orderIndex