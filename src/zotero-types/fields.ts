export type ItemField =
  | "title"
  | "abstractNote"
  | "artworkMedium"
  | "medium"
  | "artworkSize"
  | "date"
  | "language"
  | "shortTitle"
  | "archive"
  | "archiveLocation"
  | "libraryCatalog"
  | "callNumber"
  | "url"
  | "accessDate"
  | "rights"
  | "extra"
  | "audioRecordingFormat"
  | "seriesTitle"
  | "volume"
  | "numberOfVolumes"
  | "place"
  | "label"
  | "publisher"
  | "runningTime"
  | "ISBN"
  | "billNumber"
  | "number"
  | "code"
  | "codeVolume"
  | "section"
  | "codePages"
  | "pages"
  | "legislativeBody"
  | "session"
  | "history"
  | "blogTitle"
  | "publicationTitle"
  | "websiteType"
  | "type"
  | "series"
  | "seriesNumber"
  | "edition"
  | "numPages"
  | "bookTitle"
  | "caseName"
  | "court"
  | "dateDecided"
  | "docketNumber"
  | "reporter"
  | "reporterVolume"
  | "firstPage"
  | "versionNumber"
  | "system"
  | "company"
  | "programmingLanguage"
  | "proceedingsTitle"
  | "conferenceName"
  | "DOI"
  | "dictionaryTitle"
  | "subject"
  | "encyclopediaTitle"
  | "distributor"
  | "genre"
  | "videoRecordingFormat"
  | "forumTitle"
  | "postType"
  | "committee"
  | "documentNumber"
  | "interviewMedium"
  | "issue"
  | "seriesText"
  | "journalAbbreviation"
  | "ISSN"
  | "letterType"
  | "manuscriptType"
  | "mapType"
  | "scale"
  | "country"
  | "assignee"
  | "issuingAuthority"
  | "patentNumber"
  | "filingDate"
  | "applicationNumber"
  | "priorityNumbers"
  | "issueDate"
  | "references"
  | "legalStatus"
  | "episodeNumber"
  | "audioFileType"
  | "presentationType"
  | "meetingName"
  | "programTitle"
  | "network"
  | "reportNumber"
  | "reportType"
  | "institution"
  | "nameOfAct"
  | "codeNumber"
  | "publicLawNumber"
  | "dateEnacted"
  | "thesisType"
  | "university"
  | "studio"
  | "websiteTitle";
export type ItemType =
  | "artwork"
  | "attachment"
  | "audioRecording"
  | "bill"
  | "blogPost"
  | "book"
  | "bookSection"
  | "case"
  | "computerProgram"
  | "conferencePaper"
  | "dictionaryEntry"
  | "document"
  | "email"
  | "encyclopediaArticle"
  | "film"
  | "forumPost"
  | "hearing"
  | "instantMessage"
  | "interview"
  | "journalArticle"
  | "letter"
  | "magazineArticle"
  | "manuscript"
  | "map"
  | "newspaperArticle"
  | "note"
  | "patent"
  | "podcast"
  | "presentation"
  | "radioBroadcast"
  | "report"
  | "statute"
  | "thesis"
  | "tvBroadcast"
  | "videoRecording"
  | "webpage"
  | "annotation";
export const AllFields = {
  artwork: [
    "abstractNote",
    "accessDate",
    "archive",
    "archiveLocation",
    "artworkMedium",
    "artworkSize",
    "callNumber",
    "date",
    "extra",
    "language",
    "libraryCatalog",
    "rights",
    "shortTitle",
    "title",
    "url",
  ],
  attachment: ["accessDate", "title", "url"],
  audioRecording: [
    "ISBN",
    "abstractNote",
    "accessDate",
    "archive",
    "archiveLocation",
    "audioRecordingFormat",
    "callNumber",
    "date",
    "extra",
    "label",
    "language",
    "libraryCatalog",
    "numberOfVolumes",
    "place",
    "rights",
    "runningTime",
    "seriesTitle",
    "shortTitle",
    "title",
    "url",
    "volume",
  ],
  bill: [
    "abstractNote",
    "accessDate",
    "billNumber",
    "code",
    "codePages",
    "codeVolume",
    "date",
    "extra",
    "history",
    "language",
    "legislativeBody",
    "rights",
    "section",
    "session",
    "shortTitle",
    "title",
    "url",
  ],
  blogPost: [
    "abstractNote",
    "accessDate",
    "blogTitle",
    "date",
    "extra",
    "language",
    "rights",
    "shortTitle",
    "title",
    "url",
    "websiteType",
  ],
  book: [
    "ISBN",
    "abstractNote",
    "accessDate",
    "archive",
    "archiveLocation",
    "callNumber",
    "date",
    "edition",
    "extra",
    "language",
    "libraryCatalog",
    "numPages",
    "numberOfVolumes",
    "place",
    "publisher",
    "rights",
    "series",
    "seriesNumber",
    "shortTitle",
    "title",
    "url",
    "volume",
  ],
  bookSection: [
    "ISBN",
    "abstractNote",
    "accessDate",
    "archive",
    "archiveLocation",
    "bookTitle",
    "callNumber",
    "date",
    "edition",
    "extra",
    "language",
    "libraryCatalog",
    "numberOfVolumes",
    "pages",
    "place",
    "publisher",
    "rights",
    "series",
    "seriesNumber",
    "shortTitle",
    "title",
    "url",
    "volume",
  ],
  case: [
    "abstractNote",
    "accessDate",
    "caseName",
    "court",
    "dateDecided",
    "docketNumber",
    "extra",
    "firstPage",
    "history",
    "language",
    "reporter",
    "reporterVolume",
    "rights",
    "shortTitle",
    "url",
  ],
  computerProgram: [
    "ISBN",
    "abstractNote",
    "accessDate",
    "archive",
    "archiveLocation",
    "callNumber",
    "company",
    "date",
    "extra",
    "libraryCatalog",
    "place",
    "programmingLanguage",
    "rights",
    "seriesTitle",
    "shortTitle",
    "system",
    "title",
    "url",
    "versionNumber",
  ],
  conferencePaper: [
    "DOI",
    "ISBN",
    "abstractNote",
    "accessDate",
    "archive",
    "archiveLocation",
    "callNumber",
    "conferenceName",
    "date",
    "extra",
    "language",
    "libraryCatalog",
    "pages",
    "place",
    "proceedingsTitle",
    "publisher",
    "rights",
    "series",
    "shortTitle",
    "title",
    "url",
    "volume",
  ],
  dictionaryEntry: [
    "ISBN",
    "abstractNote",
    "accessDate",
    "archive",
    "archiveLocation",
    "callNumber",
    "date",
    "dictionaryTitle",
    "edition",
    "extra",
    "language",
    "libraryCatalog",
    "numberOfVolumes",
    "pages",
    "place",
    "publisher",
    "rights",
    "series",
    "seriesNumber",
    "shortTitle",
    "title",
    "url",
    "volume",
  ],
  document: [
    "abstractNote",
    "accessDate",
    "archive",
    "archiveLocation",
    "callNumber",
    "date",
    "extra",
    "language",
    "libraryCatalog",
    "publisher",
    "rights",
    "shortTitle",
    "title",
    "url",
  ],
  email: [
    "abstractNote",
    "accessDate",
    "date",
    "extra",
    "language",
    "rights",
    "shortTitle",
    "subject",
    "url",
  ],
  encyclopediaArticle: [
    "ISBN",
    "abstractNote",
    "accessDate",
    "archive",
    "archiveLocation",
    "callNumber",
    "date",
    "edition",
    "encyclopediaTitle",
    "extra",
    "language",
    "libraryCatalog",
    "numberOfVolumes",
    "pages",
    "place",
    "publisher",
    "rights",
    "series",
    "seriesNumber",
    "shortTitle",
    "title",
    "url",
    "volume",
  ],
  film: [
    "abstractNote",
    "accessDate",
    "archive",
    "archiveLocation",
    "callNumber",
    "date",
    "distributor",
    "extra",
    "genre",
    "language",
    "libraryCatalog",
    "rights",
    "runningTime",
    "shortTitle",
    "title",
    "url",
    "videoRecordingFormat",
  ],
  forumPost: [
    "abstractNote",
    "accessDate",
    "date",
    "extra",
    "forumTitle",
    "language",
    "postType",
    "rights",
    "shortTitle",
    "title",
    "url",
  ],
  hearing: [
    "abstractNote",
    "accessDate",
    "committee",
    "date",
    "documentNumber",
    "extra",
    "history",
    "language",
    "legislativeBody",
    "numberOfVolumes",
    "pages",
    "place",
    "publisher",
    "rights",
    "session",
    "shortTitle",
    "title",
    "url",
  ],
  instantMessage: [
    "abstractNote",
    "accessDate",
    "date",
    "extra",
    "language",
    "rights",
    "shortTitle",
    "title",
    "url",
  ],
  interview: [
    "abstractNote",
    "accessDate",
    "archive",
    "archiveLocation",
    "callNumber",
    "date",
    "extra",
    "interviewMedium",
    "language",
    "libraryCatalog",
    "rights",
    "shortTitle",
    "title",
    "url",
  ],
  journalArticle: [
    "DOI",
    "ISSN",
    "abstractNote",
    "accessDate",
    "archive",
    "archiveLocation",
    "callNumber",
    "date",
    "extra",
    "issue",
    "journalAbbreviation",
    "language",
    "libraryCatalog",
    "pages",
    "publicationTitle",
    "rights",
    "series",
    "seriesText",
    "seriesTitle",
    "shortTitle",
    "title",
    "url",
    "volume",
  ],
  letter: [
    "abstractNote",
    "accessDate",
    "archive",
    "archiveLocation",
    "callNumber",
    "date",
    "extra",
    "language",
    "letterType",
    "libraryCatalog",
    "rights",
    "shortTitle",
    "title",
    "url",
  ],
  magazineArticle: [
    "ISSN",
    "abstractNote",
    "accessDate",
    "archive",
    "archiveLocation",
    "callNumber",
    "date",
    "extra",
    "issue",
    "language",
    "libraryCatalog",
    "pages",
    "publicationTitle",
    "rights",
    "shortTitle",
    "title",
    "url",
    "volume",
  ],
  manuscript: [
    "abstractNote",
    "accessDate",
    "archive",
    "archiveLocation",
    "callNumber",
    "date",
    "extra",
    "language",
    "libraryCatalog",
    "manuscriptType",
    "numPages",
    "place",
    "rights",
    "shortTitle",
    "title",
    "url",
  ],
  map: [
    "ISBN",
    "abstractNote",
    "accessDate",
    "archive",
    "archiveLocation",
    "callNumber",
    "date",
    "edition",
    "extra",
    "language",
    "libraryCatalog",
    "mapType",
    "place",
    "publisher",
    "rights",
    "scale",
    "seriesTitle",
    "shortTitle",
    "title",
    "url",
  ],
  newspaperArticle: [
    "ISSN",
    "abstractNote",
    "accessDate",
    "archive",
    "archiveLocation",
    "callNumber",
    "date",
    "edition",
    "extra",
    "language",
    "libraryCatalog",
    "pages",
    "place",
    "publicationTitle",
    "rights",
    "section",
    "shortTitle",
    "title",
    "url",
  ],
  note: [],
  patent: [
    "abstractNote",
    "accessDate",
    "applicationNumber",
    "assignee",
    "country",
    "extra",
    "filingDate",
    "issueDate",
    "issuingAuthority",
    "language",
    "legalStatus",
    "pages",
    "patentNumber",
    "place",
    "priorityNumbers",
    "references",
    "rights",
    "shortTitle",
    "title",
    "url",
  ],
  podcast: [
    "abstractNote",
    "accessDate",
    "audioFileType",
    "episodeNumber",
    "extra",
    "language",
    "rights",
    "runningTime",
    "seriesTitle",
    "shortTitle",
    "title",
    "url",
  ],
  presentation: [
    "abstractNote",
    "accessDate",
    "date",
    "extra",
    "language",
    "meetingName",
    "place",
    "presentationType",
    "rights",
    "shortTitle",
    "title",
    "url",
  ],
  radioBroadcast: [
    "abstractNote",
    "accessDate",
    "archive",
    "archiveLocation",
    "audioRecordingFormat",
    "callNumber",
    "date",
    "episodeNumber",
    "extra",
    "language",
    "libraryCatalog",
    "network",
    "place",
    "programTitle",
    "rights",
    "runningTime",
    "shortTitle",
    "title",
    "url",
  ],
  report: [
    "abstractNote",
    "accessDate",
    "archive",
    "archiveLocation",
    "callNumber",
    "date",
    "extra",
    "institution",
    "language",
    "libraryCatalog",
    "pages",
    "place",
    "reportNumber",
    "reportType",
    "rights",
    "seriesTitle",
    "shortTitle",
    "title",
    "url",
  ],
  statute: [
    "abstractNote",
    "accessDate",
    "code",
    "codeNumber",
    "dateEnacted",
    "extra",
    "history",
    "language",
    "nameOfAct",
    "pages",
    "publicLawNumber",
    "rights",
    "section",
    "session",
    "shortTitle",
    "url",
  ],
  thesis: [
    "abstractNote",
    "accessDate",
    "archive",
    "archiveLocation",
    "callNumber",
    "date",
    "extra",
    "language",
    "libraryCatalog",
    "numPages",
    "place",
    "rights",
    "shortTitle",
    "thesisType",
    "title",
    "university",
    "url",
  ],
  tvBroadcast: [
    "abstractNote",
    "accessDate",
    "archive",
    "archiveLocation",
    "callNumber",
    "date",
    "episodeNumber",
    "extra",
    "language",
    "libraryCatalog",
    "network",
    "place",
    "programTitle",
    "rights",
    "runningTime",
    "shortTitle",
    "title",
    "url",
    "videoRecordingFormat",
  ],
  videoRecording: [
    "ISBN",
    "abstractNote",
    "accessDate",
    "archive",
    "archiveLocation",
    "callNumber",
    "date",
    "extra",
    "language",
    "libraryCatalog",
    "numberOfVolumes",
    "place",
    "rights",
    "runningTime",
    "seriesTitle",
    "shortTitle",
    "studio",
    "title",
    "url",
    "videoRecordingFormat",
    "volume",
  ],
  webpage: [
    "abstractNote",
    "accessDate",
    "date",
    "extra",
    "language",
    "rights",
    "shortTitle",
    "title",
    "url",
    "websiteTitle",
    "websiteType",
  ],
  annotation: [],
};
export const AllTypes = [
  "artwork",
  "attachment",
  "audioRecording",
  "bill",
  "blogPost",
  "book",
  "bookSection",
  "case",
  "computerProgram",
  "conferencePaper",
  "dictionaryEntry",
  "document",
  "email",
  "encyclopediaArticle",
  "film",
  "forumPost",
  "hearing",
  "instantMessage",
  "interview",
  "journalArticle",
  "letter",
  "magazineArticle",
  "manuscript",
  "map",
  "newspaperArticle",
  "note",
  "patent",
  "podcast",
  "presentation",
  "radioBroadcast",
  "report",
  "statute",
  "thesis",
  "tvBroadcast",
  "videoRecording",
  "webpage",
  "annotation",
];
