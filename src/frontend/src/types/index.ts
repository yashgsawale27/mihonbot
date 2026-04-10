export type {
  WatchlistEntry,
  MangaMeta,
  MangaSearchResult,
  NotificationPrefs,
  AiRecommendation,
  BotCommand,
  RecommendationProfile,
  NewChapterNotification,
  WhatsAppMessage,
} from "../backend";

export {
  ContentType,
  ReadingStatus,
  NotificationFrequency,
  MessageDirection,
} from "../backend";

export interface NavItem {
  label: string;
  path: string;
  icon: string;
}

export interface TwilioConfig {
  accountSid: string;
  sandboxNumber: string;
}
