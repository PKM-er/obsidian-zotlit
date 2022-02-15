SELECT
  libraryID,
  CASE
    type
    WHEN 'user' THEN 'My Library'
    ELSE name
  END name
FROM
  libraries
  LEFT JOIN groups USING (libraryID)
  ORDER BY libraryID