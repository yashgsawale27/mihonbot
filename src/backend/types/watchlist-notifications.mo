module {
  // ── Enums / variants ──────────────────────────────────────────────────────

  public type ContentType = {
    #manga;
    #manhwa;
    #comics;
  };

  public type ReadingStatus = {
    #reading;
    #planToRead;
    #dropped;
    #completed;
  };

  public type NotificationFrequency = {
    #immediate;
    #daily;
    #weekly;
  };

  // ── Manga metadata (shared / API-safe) ───────────────────────────────────

  public type MangaMeta = {
    mangaDexId : Text;
    title : Text;
    coverImageUrl : Text;
    description : Text;
    genres : [Text];
    contentType : ContentType;
    status : Text;          // "ongoing" | "completed" | "hiatus"
    author : Text;
    artist : Text;
    rating : Float;
    lastFetched : Int;
  };

  // ── Watchlist entry ───────────────────────────────────────────────────────

  public type WatchlistEntry = {
    mangaDexId : Text;
    title : Text;
    contentType : ContentType;
    readingStatus : ReadingStatus;
    chaptersRead : Nat;
    lastKnownChapter : Float;   // e.g. 123.5 for .5 chapters
    addedAt : Int;
    updatedAt : Int;
  };

  // ── Notification preferences ──────────────────────────────────────────────

  public type NotificationPrefs = {
    whatsappNumber : Text;
    webhookUrl : Text;
    frequency : NotificationFrequency;
    enabled : Bool;
  };

  // ── AI / recommendation data ──────────────────────────────────────────────

  public type RecommendationProfile = {
    preferredGenres : [Text];
    readingPatternNotes : Text;
    lastRecommendedAt : Int;
    pastRecommendations : [Text];  // mangaDexIds
  };

  // ── Bot command log ───────────────────────────────────────────────────────

  public type BotCommand = {
    id : Nat;
    userId : Principal;
    command : Text;
    response : Text;
    timestamp : Int;
  };

  // ── WhatsApp chat history ─────────────────────────────────────────────────

  public type MessageDirection = {
    #inbound;
    #outbound;
  };

  public type WhatsAppMessage = {
    id : Text;
    direction : MessageDirection;
    from : Text;
    to : Text;
    body : Text;
    timestamp : Int;
  };

  // ── Twilio config ─────────────────────────────────────────────────────────

  public type TwilioConfig = {
    accountSid : Text;
    authToken : Text;
    sandboxNumber : Text;
  };

  // ── Notification event ────────────────────────────────────────────────────

  public type NewChapterNotification = {
    mangaDexId : Text;
    title : Text;
    newChapter : Float;
    previousChapter : Float;
    notifyAt : Int;
    whatsappMessage : Text;
  };

  // ── MangaDex search / trending results ───────────────────────────────────

  public type MangaSearchResult = {
    mangaDexId : Text;
    title : Text;
    coverImageUrl : Text;
    description : Text;
    genres : [Text];
    contentType : ContentType;
    status : Text;
    author : Text;
    artist : Text;
    rating : Float;
  };

  // ── AI recommendation response ────────────────────────────────────────────

  public type AiRecommendation = {
    mangaDexId : Text;
    title : Text;
    reason : Text;
    matchScore : Float;
  };
};
