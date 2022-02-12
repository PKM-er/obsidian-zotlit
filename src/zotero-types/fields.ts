import { ItemBase } from "./item-base";

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
export type ItemFields =
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

export type RegularItem =
  | ArtworkItem
  | AudioRecordingItem
  | BillItem
  | BlogPostItem
  | BookItem
  | BookSectionItem
  | CaseItem
  | ComputerProgramItem
  | ConferencePaperItem
  | DictionaryEntryItem
  | DocumentItem
  | EmailItem
  | EncyclopediaArticleItem
  | FilmItem
  | ForumPostItem
  | HearingItem
  | InstantMessageItem
  | InterviewItem
  | JournalArticleItem
  | LetterItem
  | MagazineArticleItem
  | ManuscriptItem
  | MapItem
  | NewspaperArticleItem
  | PatentItem
  | PodcastItem
  | PresentationItem
  | RadioBroadcastItem
  | ReportItem
  | StatuteItem
  | ThesisItem
  | TvBroadcastItem
  | VideoRecordingItem
  | WebpageItem;
export type ArtworkItem = ItemBase &
  Record<"itemType", "artwork"> &
  Partial<
    Record<
      | "abstractNote"
      | "archive"
      | "archiveLocation"
      | "artworkMedium"
      | "artworkSize"
      | "callNumber"
      | "date"
      | "extra"
      | "language"
      | "libraryCatalog"
      | "rights"
      | "shortTitle"
      | "title"
      | "url",
      string
    > &
      Record<"accessDate", Date>
  >;

export type AttachmentItem = ItemBase &
  Record<"itemType", "attachment"> &
  Partial<Record<"title" | "url", string> & Record<"accessDate", Date>>;

export type AudioRecordingItem = ItemBase &
  Record<"itemType", "audioRecording"> &
  Partial<
    Record<
      | "ISBN"
      | "abstractNote"
      | "archive"
      | "archiveLocation"
      | "audioRecordingFormat"
      | "callNumber"
      | "date"
      | "extra"
      | "label"
      | "language"
      | "libraryCatalog"
      | "numberOfVolumes"
      | "place"
      | "rights"
      | "runningTime"
      | "seriesTitle"
      | "shortTitle"
      | "title"
      | "url"
      | "volume",
      string
    > &
      Record<"accessDate", Date>
  >;

export type BillItem = ItemBase &
  Record<"itemType", "bill"> &
  Partial<
    Record<
      | "abstractNote"
      | "billNumber"
      | "code"
      | "codePages"
      | "codeVolume"
      | "date"
      | "extra"
      | "history"
      | "language"
      | "legislativeBody"
      | "rights"
      | "section"
      | "session"
      | "shortTitle"
      | "title"
      | "url",
      string
    > &
      Record<"accessDate", Date>
  >;

export type BlogPostItem = ItemBase &
  Record<"itemType", "blogPost"> &
  Partial<
    Record<
      | "abstractNote"
      | "blogTitle"
      | "date"
      | "extra"
      | "language"
      | "rights"
      | "shortTitle"
      | "title"
      | "url"
      | "websiteType",
      string
    > &
      Record<"accessDate", Date>
  >;

export type BookItem = ItemBase &
  Record<"itemType", "book"> &
  Partial<
    Record<
      | "ISBN"
      | "abstractNote"
      | "archive"
      | "archiveLocation"
      | "callNumber"
      | "date"
      | "edition"
      | "extra"
      | "language"
      | "libraryCatalog"
      | "numPages"
      | "numberOfVolumes"
      | "place"
      | "publisher"
      | "rights"
      | "series"
      | "seriesNumber"
      | "shortTitle"
      | "title"
      | "url"
      | "volume",
      string
    > &
      Record<"accessDate", Date>
  >;

export type BookSectionItem = ItemBase &
  Record<"itemType", "bookSection"> &
  Partial<
    Record<
      | "ISBN"
      | "abstractNote"
      | "archive"
      | "archiveLocation"
      | "bookTitle"
      | "callNumber"
      | "date"
      | "edition"
      | "extra"
      | "language"
      | "libraryCatalog"
      | "numberOfVolumes"
      | "pages"
      | "place"
      | "publisher"
      | "rights"
      | "series"
      | "seriesNumber"
      | "shortTitle"
      | "title"
      | "url"
      | "volume",
      string
    > &
      Record<"accessDate", Date>
  >;

export type CaseItem = ItemBase &
  Record<"itemType", "case"> &
  Partial<
    Record<
      | "abstractNote"
      | "caseName"
      | "court"
      | "dateDecided"
      | "docketNumber"
      | "extra"
      | "firstPage"
      | "history"
      | "language"
      | "reporter"
      | "reporterVolume"
      | "rights"
      | "shortTitle"
      | "url",
      string
    > &
      Record<"accessDate", Date>
  >;

export type ComputerProgramItem = ItemBase &
  Record<"itemType", "computerProgram"> &
  Partial<
    Record<
      | "ISBN"
      | "abstractNote"
      | "archive"
      | "archiveLocation"
      | "callNumber"
      | "company"
      | "date"
      | "extra"
      | "libraryCatalog"
      | "place"
      | "programmingLanguage"
      | "rights"
      | "seriesTitle"
      | "shortTitle"
      | "system"
      | "title"
      | "url"
      | "versionNumber",
      string
    > &
      Record<"accessDate", Date>
  >;

export type ConferencePaperItem = ItemBase &
  Record<"itemType", "conferencePaper"> &
  Partial<
    Record<
      | "DOI"
      | "ISBN"
      | "abstractNote"
      | "archive"
      | "archiveLocation"
      | "callNumber"
      | "conferenceName"
      | "date"
      | "extra"
      | "language"
      | "libraryCatalog"
      | "pages"
      | "place"
      | "proceedingsTitle"
      | "publisher"
      | "rights"
      | "series"
      | "shortTitle"
      | "title"
      | "url"
      | "volume",
      string
    > &
      Record<"accessDate", Date>
  >;

export type DictionaryEntryItem = ItemBase &
  Record<"itemType", "dictionaryEntry"> &
  Partial<
    Record<
      | "ISBN"
      | "abstractNote"
      | "archive"
      | "archiveLocation"
      | "callNumber"
      | "date"
      | "dictionaryTitle"
      | "edition"
      | "extra"
      | "language"
      | "libraryCatalog"
      | "numberOfVolumes"
      | "pages"
      | "place"
      | "publisher"
      | "rights"
      | "series"
      | "seriesNumber"
      | "shortTitle"
      | "title"
      | "url"
      | "volume",
      string
    > &
      Record<"accessDate", Date>
  >;

export type DocumentItem = ItemBase &
  Record<"itemType", "document"> &
  Partial<
    Record<
      | "abstractNote"
      | "archive"
      | "archiveLocation"
      | "callNumber"
      | "date"
      | "extra"
      | "language"
      | "libraryCatalog"
      | "publisher"
      | "rights"
      | "shortTitle"
      | "title"
      | "url",
      string
    > &
      Record<"accessDate", Date>
  >;

export type EmailItem = ItemBase &
  Record<"itemType", "email"> &
  Partial<
    Record<
      | "abstractNote"
      | "date"
      | "extra"
      | "language"
      | "rights"
      | "shortTitle"
      | "subject"
      | "url",
      string
    > &
      Record<"accessDate", Date>
  >;

export type EncyclopediaArticleItem = ItemBase &
  Record<"itemType", "encyclopediaArticle"> &
  Partial<
    Record<
      | "ISBN"
      | "abstractNote"
      | "archive"
      | "archiveLocation"
      | "callNumber"
      | "date"
      | "edition"
      | "encyclopediaTitle"
      | "extra"
      | "language"
      | "libraryCatalog"
      | "numberOfVolumes"
      | "pages"
      | "place"
      | "publisher"
      | "rights"
      | "series"
      | "seriesNumber"
      | "shortTitle"
      | "title"
      | "url"
      | "volume",
      string
    > &
      Record<"accessDate", Date>
  >;

export type FilmItem = ItemBase &
  Record<"itemType", "film"> &
  Partial<
    Record<
      | "abstractNote"
      | "archive"
      | "archiveLocation"
      | "callNumber"
      | "date"
      | "distributor"
      | "extra"
      | "genre"
      | "language"
      | "libraryCatalog"
      | "rights"
      | "runningTime"
      | "shortTitle"
      | "title"
      | "url"
      | "videoRecordingFormat",
      string
    > &
      Record<"accessDate", Date>
  >;

export type ForumPostItem = ItemBase &
  Record<"itemType", "forumPost"> &
  Partial<
    Record<
      | "abstractNote"
      | "date"
      | "extra"
      | "forumTitle"
      | "language"
      | "postType"
      | "rights"
      | "shortTitle"
      | "title"
      | "url",
      string
    > &
      Record<"accessDate", Date>
  >;

export type HearingItem = ItemBase &
  Record<"itemType", "hearing"> &
  Partial<
    Record<
      | "abstractNote"
      | "committee"
      | "date"
      | "documentNumber"
      | "extra"
      | "history"
      | "language"
      | "legislativeBody"
      | "numberOfVolumes"
      | "pages"
      | "place"
      | "publisher"
      | "rights"
      | "session"
      | "shortTitle"
      | "title"
      | "url",
      string
    > &
      Record<"accessDate", Date>
  >;

export type InstantMessageItem = ItemBase &
  Record<"itemType", "instantMessage"> &
  Partial<
    Record<
      | "abstractNote"
      | "date"
      | "extra"
      | "language"
      | "rights"
      | "shortTitle"
      | "title"
      | "url",
      string
    > &
      Record<"accessDate", Date>
  >;

export type InterviewItem = ItemBase &
  Record<"itemType", "interview"> &
  Partial<
    Record<
      | "abstractNote"
      | "archive"
      | "archiveLocation"
      | "callNumber"
      | "date"
      | "extra"
      | "interviewMedium"
      | "language"
      | "libraryCatalog"
      | "rights"
      | "shortTitle"
      | "title"
      | "url",
      string
    > &
      Record<"accessDate", Date>
  >;

export type JournalArticleItem = ItemBase &
  Record<"itemType", "journalArticle"> &
  Partial<
    Record<
      | "DOI"
      | "ISSN"
      | "abstractNote"
      | "archive"
      | "archiveLocation"
      | "callNumber"
      | "date"
      | "extra"
      | "issue"
      | "journalAbbreviation"
      | "language"
      | "libraryCatalog"
      | "pages"
      | "publicationTitle"
      | "rights"
      | "series"
      | "seriesText"
      | "seriesTitle"
      | "shortTitle"
      | "title"
      | "url"
      | "volume",
      string
    > &
      Record<"accessDate", Date>
  >;

export type LetterItem = ItemBase &
  Record<"itemType", "letter"> &
  Partial<
    Record<
      | "abstractNote"
      | "archive"
      | "archiveLocation"
      | "callNumber"
      | "date"
      | "extra"
      | "language"
      | "letterType"
      | "libraryCatalog"
      | "rights"
      | "shortTitle"
      | "title"
      | "url",
      string
    > &
      Record<"accessDate", Date>
  >;

export type MagazineArticleItem = ItemBase &
  Record<"itemType", "magazineArticle"> &
  Partial<
    Record<
      | "ISSN"
      | "abstractNote"
      | "archive"
      | "archiveLocation"
      | "callNumber"
      | "date"
      | "extra"
      | "issue"
      | "language"
      | "libraryCatalog"
      | "pages"
      | "publicationTitle"
      | "rights"
      | "shortTitle"
      | "title"
      | "url"
      | "volume",
      string
    > &
      Record<"accessDate", Date>
  >;

export type ManuscriptItem = ItemBase &
  Record<"itemType", "manuscript"> &
  Partial<
    Record<
      | "abstractNote"
      | "archive"
      | "archiveLocation"
      | "callNumber"
      | "date"
      | "extra"
      | "language"
      | "libraryCatalog"
      | "manuscriptType"
      | "numPages"
      | "place"
      | "rights"
      | "shortTitle"
      | "title"
      | "url",
      string
    > &
      Record<"accessDate", Date>
  >;

export type MapItem = ItemBase &
  Record<"itemType", "map"> &
  Partial<
    Record<
      | "ISBN"
      | "abstractNote"
      | "archive"
      | "archiveLocation"
      | "callNumber"
      | "date"
      | "edition"
      | "extra"
      | "language"
      | "libraryCatalog"
      | "mapType"
      | "place"
      | "publisher"
      | "rights"
      | "scale"
      | "seriesTitle"
      | "shortTitle"
      | "title"
      | "url",
      string
    > &
      Record<"accessDate", Date>
  >;

export type NewspaperArticleItem = ItemBase &
  Record<"itemType", "newspaperArticle"> &
  Partial<
    Record<
      | "ISSN"
      | "abstractNote"
      | "archive"
      | "archiveLocation"
      | "callNumber"
      | "date"
      | "edition"
      | "extra"
      | "language"
      | "libraryCatalog"
      | "pages"
      | "place"
      | "publicationTitle"
      | "rights"
      | "section"
      | "shortTitle"
      | "title"
      | "url",
      string
    > &
      Record<"accessDate", Date>
  >;

export type NoteItem = ItemBase & Record<"itemType", "note">;

export type PatentItem = ItemBase &
  Record<"itemType", "patent"> &
  Partial<
    Record<
      | "abstractNote"
      | "applicationNumber"
      | "assignee"
      | "country"
      | "extra"
      | "filingDate"
      | "issueDate"
      | "issuingAuthority"
      | "language"
      | "legalStatus"
      | "pages"
      | "patentNumber"
      | "place"
      | "priorityNumbers"
      | "references"
      | "rights"
      | "shortTitle"
      | "title"
      | "url",
      string
    > &
      Record<"accessDate", Date>
  >;

export type PodcastItem = ItemBase &
  Record<"itemType", "podcast"> &
  Partial<
    Record<
      | "abstractNote"
      | "audioFileType"
      | "episodeNumber"
      | "extra"
      | "language"
      | "rights"
      | "runningTime"
      | "seriesTitle"
      | "shortTitle"
      | "title"
      | "url",
      string
    > &
      Record<"accessDate", Date>
  >;

export type PresentationItem = ItemBase &
  Record<"itemType", "presentation"> &
  Partial<
    Record<
      | "abstractNote"
      | "date"
      | "extra"
      | "language"
      | "meetingName"
      | "place"
      | "presentationType"
      | "rights"
      | "shortTitle"
      | "title"
      | "url",
      string
    > &
      Record<"accessDate", Date>
  >;

export type RadioBroadcastItem = ItemBase &
  Record<"itemType", "radioBroadcast"> &
  Partial<
    Record<
      | "abstractNote"
      | "archive"
      | "archiveLocation"
      | "audioRecordingFormat"
      | "callNumber"
      | "date"
      | "episodeNumber"
      | "extra"
      | "language"
      | "libraryCatalog"
      | "network"
      | "place"
      | "programTitle"
      | "rights"
      | "runningTime"
      | "shortTitle"
      | "title"
      | "url",
      string
    > &
      Record<"accessDate", Date>
  >;

export type ReportItem = ItemBase &
  Record<"itemType", "report"> &
  Partial<
    Record<
      | "abstractNote"
      | "archive"
      | "archiveLocation"
      | "callNumber"
      | "date"
      | "extra"
      | "institution"
      | "language"
      | "libraryCatalog"
      | "pages"
      | "place"
      | "reportNumber"
      | "reportType"
      | "rights"
      | "seriesTitle"
      | "shortTitle"
      | "title"
      | "url",
      string
    > &
      Record<"accessDate", Date>
  >;

export type StatuteItem = ItemBase &
  Record<"itemType", "statute"> &
  Partial<
    Record<
      | "abstractNote"
      | "code"
      | "codeNumber"
      | "dateEnacted"
      | "extra"
      | "history"
      | "language"
      | "nameOfAct"
      | "pages"
      | "publicLawNumber"
      | "rights"
      | "section"
      | "session"
      | "shortTitle"
      | "url",
      string
    > &
      Record<"accessDate", Date>
  >;

export type ThesisItem = ItemBase &
  Record<"itemType", "thesis"> &
  Partial<
    Record<
      | "abstractNote"
      | "archive"
      | "archiveLocation"
      | "callNumber"
      | "date"
      | "extra"
      | "language"
      | "libraryCatalog"
      | "numPages"
      | "place"
      | "rights"
      | "shortTitle"
      | "thesisType"
      | "title"
      | "university"
      | "url",
      string
    > &
      Record<"accessDate", Date>
  >;

export type TvBroadcastItem = ItemBase &
  Record<"itemType", "tvBroadcast"> &
  Partial<
    Record<
      | "abstractNote"
      | "archive"
      | "archiveLocation"
      | "callNumber"
      | "date"
      | "episodeNumber"
      | "extra"
      | "language"
      | "libraryCatalog"
      | "network"
      | "place"
      | "programTitle"
      | "rights"
      | "runningTime"
      | "shortTitle"
      | "title"
      | "url"
      | "videoRecordingFormat",
      string
    > &
      Record<"accessDate", Date>
  >;

export type VideoRecordingItem = ItemBase &
  Record<"itemType", "videoRecording"> &
  Partial<
    Record<
      | "ISBN"
      | "abstractNote"
      | "archive"
      | "archiveLocation"
      | "callNumber"
      | "date"
      | "extra"
      | "language"
      | "libraryCatalog"
      | "numberOfVolumes"
      | "place"
      | "rights"
      | "runningTime"
      | "seriesTitle"
      | "shortTitle"
      | "studio"
      | "title"
      | "url"
      | "videoRecordingFormat"
      | "volume",
      string
    > &
      Record<"accessDate", Date>
  >;

export type WebpageItem = ItemBase &
  Record<"itemType", "webpage"> &
  Partial<
    Record<
      | "abstractNote"
      | "date"
      | "extra"
      | "language"
      | "rights"
      | "shortTitle"
      | "title"
      | "url"
      | "websiteTitle"
      | "websiteType",
      string
    > &
      Record<"accessDate", Date>
  >;

export type AnnotationItem = ItemBase & Record<"itemType", "annotation">;

const Fields = {
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
export default Fields;
