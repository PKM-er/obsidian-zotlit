import { RegularItemBase } from "./item-base";
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
export type ArtworkItem = RegularItemBase &
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
export type AudioRecordingItem = RegularItemBase &
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
export type BillItem = RegularItemBase &
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
export type BlogPostItem = RegularItemBase &
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
export type BookItem = RegularItemBase &
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
export type BookSectionItem = RegularItemBase &
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
export type CaseItem = RegularItemBase &
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
export type ComputerProgramItem = RegularItemBase &
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
export type ConferencePaperItem = RegularItemBase &
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
export type DictionaryEntryItem = RegularItemBase &
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
export type DocumentItem = RegularItemBase &
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
export type EmailItem = RegularItemBase &
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
export type EncyclopediaArticleItem = RegularItemBase &
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
export type FilmItem = RegularItemBase &
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
export type ForumPostItem = RegularItemBase &
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
export type HearingItem = RegularItemBase &
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
export type InstantMessageItem = RegularItemBase &
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
export type InterviewItem = RegularItemBase &
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
export type JournalArticleItem = RegularItemBase &
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
export type LetterItem = RegularItemBase &
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
export type MagazineArticleItem = RegularItemBase &
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
export type ManuscriptItem = RegularItemBase &
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
export type MapItem = RegularItemBase &
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
export type NewspaperArticleItem = RegularItemBase &
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
export type PatentItem = RegularItemBase &
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
export type PodcastItem = RegularItemBase &
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
export type PresentationItem = RegularItemBase &
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
export type RadioBroadcastItem = RegularItemBase &
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
export type ReportItem = RegularItemBase &
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
export type StatuteItem = RegularItemBase &
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
export type ThesisItem = RegularItemBase &
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
export type TvBroadcastItem = RegularItemBase &
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
export type VideoRecordingItem = RegularItemBase &
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
export type WebpageItem = RegularItemBase &
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
