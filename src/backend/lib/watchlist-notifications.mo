import Types "../types/watchlist-notifications";
import CommonTypes "../types/common";
import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {

  // ── Watchlist management ──────────────────────────────────────────────────

  /// Add or update a watchlist entry for a user.
  public func addToWatchlist(
    watchlists : Map.Map<CommonTypes.UserId, List.List<Types.WatchlistEntry>>,
    userId : CommonTypes.UserId,
    entry : Types.WatchlistEntry,
  ) {
    let userList = switch (watchlists.get(userId)) {
      case (?list) { list };
      case null {
        let newList = List.empty<Types.WatchlistEntry>();
        watchlists.add(userId, newList);
        newList;
      };
    };
    // Replace existing entry if it exists, otherwise add
    let existing = userList.findIndex(func(e : Types.WatchlistEntry) : Bool { e.mangaDexId == entry.mangaDexId });
    switch (existing) {
      case (?idx) { userList.put(idx, entry) };
      case null { userList.add(entry) };
    };
  };

  /// Remove a title from a user's watchlist.
  public func removeFromWatchlist(
    watchlists : Map.Map<CommonTypes.UserId, List.List<Types.WatchlistEntry>>,
    userId : CommonTypes.UserId,
    mangaDexId : Text,
  ) {
    switch (watchlists.get(userId)) {
      case null {};
      case (?userList) {
        let kept = userList.filter(func(e : Types.WatchlistEntry) : Bool { e.mangaDexId != mangaDexId });
        userList.clear();
        userList.append(kept);
      };
    };
  };

  /// Get all watchlist entries for a user.
  public func getWatchlist(
    watchlists : Map.Map<CommonTypes.UserId, List.List<Types.WatchlistEntry>>,
    userId : CommonTypes.UserId,
  ) : [Types.WatchlistEntry] {
    switch (watchlists.get(userId)) {
      case null { [] };
      case (?userList) { userList.toArray() };
    };
  };

  /// Update reading progress (chapters read + status) for a watchlist entry.
  public func updateProgress(
    watchlists : Map.Map<CommonTypes.UserId, List.List<Types.WatchlistEntry>>,
    userId : CommonTypes.UserId,
    mangaDexId : Text,
    chaptersRead : Nat,
    status : Types.ReadingStatus,
  ) {
    switch (watchlists.get(userId)) {
      case null {};
      case (?userList) {
        userList.mapInPlace(
          func(e : Types.WatchlistEntry) : Types.WatchlistEntry {
            if (e.mangaDexId == mangaDexId) {
              { e with chaptersRead = chaptersRead; readingStatus = status; updatedAt = Time.now() }
            } else { e };
          }
        );
      };
    };
  };

  // ── Notification preferences ──────────────────────────────────────────────

  /// Save (upsert) notification preferences for a user.
  public func setNotificationPrefs(
    prefs : Map.Map<CommonTypes.UserId, Types.NotificationPrefs>,
    userId : CommonTypes.UserId,
    notifPrefs : Types.NotificationPrefs,
  ) {
    prefs.add(userId, notifPrefs);
  };

  /// Retrieve notification preferences for a user.
  public func getNotificationPrefs(
    prefs : Map.Map<CommonTypes.UserId, Types.NotificationPrefs>,
    userId : CommonTypes.UserId,
  ) : ?Types.NotificationPrefs {
    prefs.get(userId);
  };

  // ── Manga metadata cache ──────────────────────────────────────────────────

  /// Upsert manga metadata into the cache.
  public func cacheMangaMeta(
    cache : Map.Map<Text, Types.MangaMeta>,
    meta : Types.MangaMeta,
  ) {
    cache.add(meta.mangaDexId, meta);
  };

  /// Look up cached manga metadata by MangaDex ID.
  public func getCachedMeta(
    cache : Map.Map<Text, Types.MangaMeta>,
    mangaDexId : Text,
  ) : ?Types.MangaMeta {
    cache.get(mangaDexId);
  };

  // ── Chapter update tracking ───────────────────────────────────────────────

  /// Build a WhatsApp-formatted new-chapter notification message.
  public func formatNewChapterMessage(
    title : Text,
    newChapter : Float,
    mangaDexId : Text,
  ) : Text {
    // Format chapter number: show as integer if whole, else with decimal
    let chapterText = debug_show(newChapter);
    "📖 *" # title # "* — Chapter *" # chapterText # "* is out!\n" #
    "🔗 Read on MangaDex: https://mangadex.org/title/" # mangaDexId # "\n" #
    "Happy reading! 🎉";
  };

  /// Update the last-known chapter for a title across all users watching it,
  /// and return notification events for users whose copy is outdated.
  public func detectNewChapters(
    watchlists : Map.Map<CommonTypes.UserId, List.List<Types.WatchlistEntry>>,
    prefs : Map.Map<CommonTypes.UserId, Types.NotificationPrefs>,
    mangaDexId : Text,
    latestChapter : Float,
    title : Text,
  ) : [Types.NewChapterNotification] {
    let notifications = List.empty<Types.NewChapterNotification>();
    let now = Time.now();

    for ((userId, userList) in watchlists.entries()) {
      let entryOpt = userList.find(func(e : Types.WatchlistEntry) : Bool { e.mangaDexId == mangaDexId });
      switch (entryOpt) {
        case null {};
        case (?entry) {
          if (latestChapter > entry.lastKnownChapter) {
            // Update the entry with new chapter
            userList.mapInPlace(
              func(e : Types.WatchlistEntry) : Types.WatchlistEntry {
                if (e.mangaDexId == mangaDexId) {
                  { e with lastKnownChapter = latestChapter; updatedAt = now }
                } else { e };
              }
            );
            // Only notify if user has notifications enabled
            let userPrefs = prefs.get(userId);
            switch (userPrefs) {
              case null {};
              case (?p) {
                if (p.enabled) {
                  let msg = formatNewChapterMessage(title, latestChapter, mangaDexId);
                  notifications.add({
                    mangaDexId = mangaDexId;
                    title = title;
                    newChapter = latestChapter;
                    previousChapter = entry.lastKnownChapter;
                    notifyAt = now;
                    whatsappMessage = msg;
                  });
                };
              };
            };
          };
        };
      };
    };
    notifications.toArray();
  };

  // ── AI recommendation profile ─────────────────────────────────────────────

  /// Upsert the AI recommendation profile for a user.
  public func setRecommendationProfile(
    profiles : Map.Map<CommonTypes.UserId, Types.RecommendationProfile>,
    userId : CommonTypes.UserId,
    profile : Types.RecommendationProfile,
  ) {
    profiles.add(userId, profile);
  };

  /// Get the AI recommendation profile for a user.
  public func getRecommendationProfile(
    profiles : Map.Map<CommonTypes.UserId, Types.RecommendationProfile>,
    userId : CommonTypes.UserId,
  ) : ?Types.RecommendationProfile {
    profiles.get(userId);
  };

  // ── Bot command log ───────────────────────────────────────────────────────

  /// Append a command/response pair to the bot log. Returns new ID.
  public func logBotCommand(
    commandLog : List.List<Types.BotCommand>,
    nextId : Nat,
    userId : CommonTypes.UserId,
    command : Text,
    response : Text,
    timestamp : Int,
  ) : Nat {
    commandLog.add({
      id = nextId;
      userId = userId;
      command = command;
      response = response;
      timestamp = timestamp;
    });
    nextId + 1;
  };

  /// Retrieve the most recent N bot commands for a user.
  public func getUserBotLog(
    commandLog : List.List<Types.BotCommand>,
    userId : CommonTypes.UserId,
    limit : Nat,
  ) : [Types.BotCommand] {
    let userCommands = commandLog.filter(func(c : Types.BotCommand) : Bool { Principal.equal(c.userId, userId) });
    let total = userCommands.size();
    let start = if (total > limit) { total - limit } else { 0 };
    userCommands.sliceToArray(start, total);
  };

  // ── Search & trending (results stored after outcall) ─────────────────────

  /// Store/cache the latest search results for a query.
  public func cacheSearchResults(
    searchCache : Map.Map<Text, [Types.MangaSearchResult]>,
    searchQuery : Text,
    results : [Types.MangaSearchResult],
  ) {
    searchCache.add(searchQuery, results);
  };

  /// Retrieve cached search results.
  public func getCachedSearchResults(
    searchCache : Map.Map<Text, [Types.MangaSearchResult]>,
    searchQuery : Text,
  ) : ?[Types.MangaSearchResult] {
    searchCache.get(searchQuery);
  };

  // ── AI recommendations (results stored after outcall) ────────────────────

  /// Store the latest AI recommendations for a user.
  public func cacheAiRecommendations(
    recCache : Map.Map<CommonTypes.UserId, [Types.AiRecommendation]>,
    userId : CommonTypes.UserId,
    recs : [Types.AiRecommendation],
  ) {
    recCache.add(userId, recs);
  };

  /// Retrieve the cached AI recommendations for a user.
  public func getCachedAiRecommendations(
    recCache : Map.Map<CommonTypes.UserId, [Types.AiRecommendation]>,
    userId : CommonTypes.UserId,
  ) : [Types.AiRecommendation] {
    switch (recCache.get(userId)) {
      case null { [] };
      case (?recs) { recs };
    };
  };
};
