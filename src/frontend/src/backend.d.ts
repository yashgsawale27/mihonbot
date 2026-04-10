import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AiRecommendation {
    title: string;
    mangaDexId: string;
    matchScore: number;
    reason: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface MangaSearchResult {
    status: string;
    coverImageUrl: string;
    title: string;
    contentType: ContentType;
    mangaDexId: string;
    description: string;
    author: string;
    genres: Array<string>;
    artist: string;
    rating: number;
}
export interface MangaMeta {
    status: string;
    coverImageUrl: string;
    title: string;
    contentType: ContentType;
    mangaDexId: string;
    description: string;
    author: string;
    genres: Array<string>;
    lastFetched: bigint;
    artist: string;
    rating: number;
}
export interface RecommendationProfile {
    readingPatternNotes: string;
    preferredGenres: Array<string>;
    lastRecommendedAt: bigint;
    pastRecommendations: Array<string>;
}
export interface WhatsAppMessage {
    id: string;
    to: string;
    direction: MessageDirection;
    body: string;
    from: string;
    timestamp: bigint;
}
export interface NewChapterNotification {
    whatsappMessage: string;
    newChapter: number;
    title: string;
    mangaDexId: string;
    previousChapter: number;
    notifyAt: bigint;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface BotCommand {
    id: bigint;
    userId: Principal;
    command: string;
    response: string;
    timestamp: bigint;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface HttpResponse {
    body: Uint8Array;
    headers: Array<[string, string]>;
    upgrade?: boolean;
    status_code: number;
}
export interface WatchlistEntry {
    title: string;
    contentType: ContentType;
    chaptersRead: bigint;
    mangaDexId: string;
    updatedAt: bigint;
    addedAt: bigint;
    lastKnownChapter: number;
    readingStatus: ReadingStatus;
}
export interface HttpRequest {
    url: string;
    method: string;
    body: Uint8Array;
    headers: Array<[string, string]>;
}
export interface NotificationPrefs {
    enabled: boolean;
    whatsappNumber: string;
    frequency: NotificationFrequency;
    webhookUrl: string;
}
export enum ContentType {
    manga = "manga",
    manhwa = "manhwa",
    comics = "comics"
}
export enum MessageDirection {
    inbound = "inbound",
    outbound = "outbound"
}
export enum NotificationFrequency {
    immediate = "immediate",
    daily = "daily",
    weekly = "weekly"
}
export enum ReadingStatus {
    reading = "reading",
    dropped = "dropped",
    completed = "completed",
    planToRead = "planToRead"
}
export interface backendInterface {
    addToWatchlist(entry: WatchlistEntry): Promise<void>;
    checkForNewChapters(mangaDexId: string): Promise<Array<NewChapterNotification>>;
    clearWhatsAppChatHistory(): Promise<void>;
    fetchMangaMeta(mangaDexId: string): Promise<MangaMeta | null>;
    getAiRecommendations(): Promise<Array<AiRecommendation>>;
    getBotCommandLog(limit: bigint): Promise<Array<BotCommand>>;
    getCachedAiRecommendations(): Promise<Array<AiRecommendation>>;
    getCachedMangaMeta(mangaDexId: string): Promise<MangaMeta | null>;
    getNotificationPrefs(): Promise<NotificationPrefs | null>;
    getRecommendationProfile(): Promise<RecommendationProfile | null>;
    getTrendingManga(): Promise<Array<MangaSearchResult>>;
    getTwilioConfig(): Promise<{
        accountSid: string;
        sandboxNumber: string;
        authTokenMasked: string;
    }>;
    getWatchlist(): Promise<Array<WatchlistEntry>>;
    getWhatsAppChatHistory(): Promise<Array<WhatsAppMessage>>;
    /**
     * / Handle GET/HEAD — upgrade POST requests to update calls.
     */
    http_request(req: HttpRequest): Promise<HttpResponse>;
    http_request_update(req: HttpRequest): Promise<HttpResponse>;
    logBotCommand(command: string, response: string): Promise<bigint>;
    removeFromWatchlist(mangaDexId: string): Promise<void>;
    searchManga(titleQuery: string): Promise<Array<MangaSearchResult>>;
    setNotificationPrefs(prefs: NotificationPrefs): Promise<void>;
    setTwilioConfig(accountSid: string, authToken: string, sandboxNumber: string): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    transform_twilio(input: TransformationInput): Promise<TransformationOutput>;
    updateReadingProgress(mangaDexId: string, chaptersRead: bigint, status: ReadingStatus): Promise<void>;
    updateRecommendationProfile(profile: RecommendationProfile): Promise<void>;
}
