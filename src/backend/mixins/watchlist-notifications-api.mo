import Types "../types/watchlist-notifications";
import CommonTypes "../types/common";
import WatchlistLib "../lib/watchlist-notifications";
import Crypto "../lib/crypto";
import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Nat32 "mo:core/Nat32";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Blob "mo:core/Blob";
import Principal "mo:core/Principal";
import Char "mo:core/Char";
import OutCall "mo:caffeineai-http-outcalls/outcall";

mixin (
  watchlists : Map.Map<CommonTypes.UserId, List.List<Types.WatchlistEntry>>,
  notifPrefs : Map.Map<CommonTypes.UserId, Types.NotificationPrefs>,
  metaCache : Map.Map<Text, Types.MangaMeta>,
  searchCache : Map.Map<Text, [Types.MangaSearchResult]>,
  recProfiles : Map.Map<CommonTypes.UserId, Types.RecommendationProfile>,
  recCache : Map.Map<CommonTypes.UserId, [Types.AiRecommendation]>,
  botLog : List.List<Types.BotCommand>,
  twilioConfig : { var accountSid : Text; var authToken : Text; var sandboxNumber : Text },
  whatsappChatHistory : List.List<Types.WhatsAppMessage>,
) {

  // ── Internal mutable counters ─────────────────────────────────────────────
  var nextBotCommandId : Nat = 0;
  var nextWhatsAppMsgId : Nat = 0;

  // ── Transform callbacks (required by IC HTTP outcall framework) ───────────

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public query func transform_twilio(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // ── Twilio config ─────────────────────────────────────────────────────────

  /// Update Twilio credentials at runtime.
  public shared func setTwilioConfig(accountSid : Text, authToken : Text, sandboxNumber : Text) : async () {
    twilioConfig.accountSid := accountSid;
    twilioConfig.authToken := authToken;
    twilioConfig.sandboxNumber := sandboxNumber;
  };

  /// Read current Twilio config (authToken is masked).
  public query func getTwilioConfig() : async { accountSid : Text; sandboxNumber : Text; authTokenMasked : Text } {
    let token = twilioConfig.authToken;
    let masked = if (token.size() > 4) {
      "****" # Text.fromIter(token.toIter().drop(token.size() - 4))
    } else {
      "****"
    };
    {
      accountSid = twilioConfig.accountSid;
      sandboxNumber = twilioConfig.sandboxNumber;
      authTokenMasked = masked;
    };
  };

  // ── WhatsApp chat history ─────────────────────────────────────────────────

  /// Return the last 100 WhatsApp messages.
  public query func getWhatsAppChatHistory() : async [Types.WhatsAppMessage] {
    let total = whatsappChatHistory.size();
    let start = if (total > 100) { total - 100 } else { 0 };
    whatsappChatHistory.sliceToArray(start, total);
  };

  // cap is 100 — consistent with the 100-message return limit above

  /// Clear all WhatsApp chat history.
  public shared func clearWhatsAppChatHistory() : async () {
    whatsappChatHistory.clear();
  };

  // ── Watchlist ─────────────────────────────────────────────────────────────

  /// Add or update a manga/manhwa/comic in the caller's watchlist.
  public shared ({ caller }) func addToWatchlist(entry : Types.WatchlistEntry) : async () {
    WatchlistLib.addToWatchlist(watchlists, caller, entry);
  };

  /// Remove a title from the caller's watchlist by MangaDex ID.
  public shared ({ caller }) func removeFromWatchlist(mangaDexId : Text) : async () {
    WatchlistLib.removeFromWatchlist(watchlists, caller, mangaDexId);
  };

  /// Return the caller's full watchlist.
  public shared query ({ caller }) func getWatchlist() : async [Types.WatchlistEntry] {
    WatchlistLib.getWatchlist(watchlists, caller);
  };

  /// Update reading progress for a watchlist entry.
  public shared ({ caller }) func updateReadingProgress(
    mangaDexId : Text,
    chaptersRead : Nat,
    status : Types.ReadingStatus,
  ) : async () {
    WatchlistLib.updateProgress(watchlists, caller, mangaDexId, chaptersRead, status);
  };

  // ── Notification preferences ──────────────────────────────────────────────

  /// Save the caller's WhatsApp / webhook notification preferences.
  public shared ({ caller }) func setNotificationPrefs(prefs : Types.NotificationPrefs) : async () {
    WatchlistLib.setNotificationPrefs(notifPrefs, caller, prefs);
  };

  /// Get the caller's notification preferences.
  public shared query ({ caller }) func getNotificationPrefs() : async ?Types.NotificationPrefs {
    WatchlistLib.getNotificationPrefs(notifPrefs, caller);
  };

  // ── Metadata ──────────────────────────────────────────────────────────────

  /// Fetch and cache manga metadata from MangaDex (uses http-outcall internally).
  public shared func fetchMangaMeta(mangaDexId : Text) : async ?Types.MangaMeta {
    let url = "https://api.mangadex.org/manga/" # mangaDexId # "?includes[]=author&includes[]=artist&includes[]=cover_art";
    let responseJson = await OutCall.httpGetRequest(url, [], transform);
    let meta = parseMangaMeta(mangaDexId, responseJson);
    switch (meta) {
      case (?m) { WatchlistLib.cacheMangaMeta(metaCache, m) };
      case null {};
    };
    meta;
  };

  /// Return cached metadata for a manga, without making an outcall.
  public shared query func getCachedMangaMeta(mangaDexId : Text) : async ?Types.MangaMeta {
    WatchlistLib.getCachedMeta(metaCache, mangaDexId);
  };

  // ── Chapter update check ──────────────────────────────────────────────────

  /// Check MangaDex for new chapters and queue notifications for all
  /// users watching the given title.  Returns notification events generated.
  public shared func checkForNewChapters(mangaDexId : Text) : async [Types.NewChapterNotification] {
    let url = "https://api.mangadex.org/manga/" # mangaDexId # "/feed?limit=1&order[chapter]=desc&translatedLanguage[]=en";
    let responseJson = await OutCall.httpGetRequest(url, [], transform);
    let latestChapterOpt = parseLatestChapter(responseJson);
    switch (latestChapterOpt) {
      case null { [] };
      case (?latestChapter) {
        let titleText = switch (WatchlistLib.getCachedMeta(metaCache, mangaDexId)) {
          case (?m) { m.title };
          case null { mangaDexId };
        };
        WatchlistLib.detectNewChapters(watchlists, notifPrefs, mangaDexId, latestChapter, titleText);
      };
    };
  };

  // ── Search ────────────────────────────────────────────────────────────────

  /// Search MangaDex by title (manga, manhwa, or comics).
  public shared func searchManga(titleQuery : Text) : async [Types.MangaSearchResult] {
    switch (WatchlistLib.getCachedSearchResults(searchCache, titleQuery)) {
      case (?cached) { cached };
      case null {
        let encoded = encodeURIComponent(titleQuery);
        let url = "https://api.mangadex.org/manga?title=" # encoded # "&includes[]=cover_art&includes[]=author&includes[]=artist&limit=20";
        let responseJson = await OutCall.httpGetRequest(url, [], transform);
        let results = parseMangaSearchResults(responseJson);
        WatchlistLib.cacheSearchResults(searchCache, titleQuery, results);
        results;
      };
    };
  };

  /// Return the trending / bestseller list from MangaDex.
  public shared func getTrendingManga() : async [Types.MangaSearchResult] {
    let cacheKey = "__trending__";
    switch (WatchlistLib.getCachedSearchResults(searchCache, cacheKey)) {
      case (?cached) { cached };
      case null {
        let url = "https://api.mangadex.org/manga?order[followedCount]=desc&includes[]=cover_art&includes[]=author&includes[]=artist&limit=20";
        let responseJson = await OutCall.httpGetRequest(url, [], transform);
        let results = parseMangaSearchResults(responseJson);
        WatchlistLib.cacheSearchResults(searchCache, cacheKey, results);
        results;
      };
    };
  };

  // ── AI Recommendations ────────────────────────────────────────────────────

  /// Request AI recommendations based on the caller's reading profile.
  public shared ({ caller }) func getAiRecommendations() : async [Types.AiRecommendation] {
    let profileOpt = WatchlistLib.getRecommendationProfile(recProfiles, caller);
    let watchlist = WatchlistLib.getWatchlist(watchlists, caller);

    let genresList = switch (profileOpt) {
      case null { "" };
      case (?p) {
        p.preferredGenres.foldLeft("", func(acc : Text, g : Text) : Text {
          if (acc == "") { g } else { acc # ", " # g }
        })
      };
    };
    let watchlistTitles = watchlist.foldLeft("", func(acc : Text, e : Types.WatchlistEntry) : Text {
      if (acc == "") { e.title } else { acc # ", " # e.title }
    });
    let notes = switch (profileOpt) {
      case null { "" };
      case (?p) { p.readingPatternNotes };
    };

    let prompt = "You are a manga/manhwa/comics recommendation AI. " #
      "Based on this user's reading history and preferences, recommend 5 titles they would enjoy. " #
      "Preferred genres: " # genresList # ". " #
      "Currently reading or has read: " # watchlistTitles # ". " #
      "Reading pattern notes: " # notes # ". " #
      "For each recommendation provide: mangaDexId (from mangadex.org), title, reason (1-2 sentences), matchScore (0.0-1.0). " #
      "Respond ONLY with a JSON array: [{\"mangaDexId\":\"...\",\"title\":\"...\",\"reason\":\"...\",\"matchScore\":0.9}]";

    let requestBody = "{\"model\":\"gpt-4o-mini\",\"messages\":[{\"role\":\"user\",\"content\":\"" # escapeJson(prompt) # "\"}],\"max_tokens\":800}";
    let headers = [
      { name = "Content-Type"; value = "application/json" },
      { name = "Authorization"; value = "Bearer YOUR_OPENAI_API_KEY" },
    ];

    let responseJson = await OutCall.httpPostRequest(
      "https://api.openai.com/v1/chat/completions",
      headers,
      requestBody,
      transform,
    );

    let recs = parseAiRecommendations(responseJson);
    WatchlistLib.cacheAiRecommendations(recCache, caller, recs);

    switch (profileOpt) {
      case null {};
      case (?p) {
        WatchlistLib.setRecommendationProfile(recProfiles, caller, { p with lastRecommendedAt = Time.now() });
      };
    };
    recs;
  };

  /// Return the last cached AI recommendations for the caller (no outcall).
  public shared query ({ caller }) func getCachedAiRecommendations() : async [Types.AiRecommendation] {
    WatchlistLib.getCachedAiRecommendations(recCache, caller);
  };

  /// Update the caller's recommendation profile (genres, notes).
  public shared ({ caller }) func updateRecommendationProfile(
    profile : Types.RecommendationProfile,
  ) : async () {
    WatchlistLib.setRecommendationProfile(recProfiles, caller, profile);
  };

  /// Get the caller's recommendation profile.
  public shared query ({ caller }) func getRecommendationProfile() : async ?Types.RecommendationProfile {
    WatchlistLib.getRecommendationProfile(recProfiles, caller);
  };

  // ── Bot command log ───────────────────────────────────────────────────────

  /// Log a WhatsApp bot command and its response.
  public shared ({ caller }) func logBotCommand(command : Text, response : Text) : async Nat {
    let newId = WatchlistLib.logBotCommand(botLog, nextBotCommandId, caller, command, response, Time.now());
    nextBotCommandId := newId;
    newId - 1;
  };

  /// Get the most recent bot commands for the caller.
  public shared query ({ caller }) func getBotCommandLog(limit : Nat) : async [Types.BotCommand] {
    WatchlistLib.getUserBotLog(botLog, caller, limit);
  };

  // ── WhatsApp webhook (IC HTTP gateway) ───────────────────────────────────

  /// Handle incoming HTTP requests — routes POST /whatsapp-webhook to the bot.
  /// Must be a non-query public func so the IC treats it as an update call.
  public func http_request_update(req : HttpRequest) : async HttpResponse {
    // Match /whatsapp-webhook regardless of query string or trailing slash
    let path = switch (req.url.split(#char '?').next()) {
      case (?p) { p };
      case null { req.url };
    };
    let isWebhookPath = path == "/whatsapp-webhook" or path == "/whatsapp-webhook/";
    if (req.method == "POST" and isWebhookPath) {
      handleWhatsAppWebhook(req);
    } else {
      { status_code = 404; headers = [("Content-Type", "text/plain")]; body = "Not Found".encodeUtf8(); upgrade = null };
    };
  };

  // ── Private: webhook handler (fully synchronous — no outcalls) ───────────

  func handleWhatsAppWebhook(req : HttpRequest) : HttpResponse {
    let bodyText = switch (req.body.decodeUtf8()) {
      case null { "" };
      case (?t) { t };
    };

    // Parse form-encoded body — no signature validation (sandbox mode)
    let params = parseFormEncoded(bodyText);
    let fromNumber = getParam(params, "From");
    let messageBody = getParam(params, "Body");

    // Log inbound message (sync)
    let msgId = nextWhatsAppMsgId.toText();
    nextWhatsAppMsgId += 1;
    appendChatMessage({
      id = msgId;
      direction = #inbound;
      from = fromNumber;
      to = twilioConfig.sandboxNumber;
      body = messageBody;
      timestamp = Time.now();
    });

    // Route command synchronously — no awaits, no outcalls
    let replyText = routeCommand(messageBody, fromNumber);

    // Log outbound message (sync)
    let outId = nextWhatsAppMsgId.toText();
    nextWhatsAppMsgId += 1;
    appendChatMessage({
      id = outId;
      direction = #outbound;
      from = twilioConfig.sandboxNumber;
      to = fromNumber;
      body = replyText;
      timestamp = Time.now();
    });

    // Log bot command (sync)
    let _ = WatchlistLib.logBotCommand(botLog, nextBotCommandId, Principal.anonymous(), messageBody, replyText, Time.now());
    nextBotCommandId += 1;

    // Return TwiML directly in the response — Twilio reads and delivers it
    let twiml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Message>" # xmlEscape(replyText) # "</Message></Response>";
    {
      status_code = 200;
      headers = [("Content-Type", "text/xml")];
      body = twiml.encodeUtf8();
      upgrade = null;
    };
  };

  private func appendChatMessage(msg : Types.WhatsAppMessage) {
    // Cap at 100 entries — drop oldest if needed
    if (whatsappChatHistory.size() >= 100) {
      // rebuild without first entry to trim the oldest
      let arr = whatsappChatHistory.toArray();
      whatsappChatHistory.clear();
      var i = 1;
      while (i < arr.size()) {
        whatsappChatHistory.add(arr[i]);
        i += 1;
      };
    };
    whatsappChatHistory.add(msg);
  };

  // ── Private: Twilio signature validation ─────────────────────────────────

  private func validateTwilioSignature(signature : Text, url : Text, body : Text) : Bool {
    if (signature == "") { return false };

    // Build the string to sign: url + sorted params concatenated as key=value
    let params = parseFormEncoded(body);
    // Sort params by key
    let sorted = params.sort(func(a, b) { Text.compare(a.0, b.0) });
    var toSign = url;
    for ((k, v) in sorted.values()) {
      toSign := toSign # k # v;
    };

    // Compute HMAC-SHA1
    let keyBytes = Crypto.textToBytes(twilioConfig.authToken);
    let msgBytes = Crypto.textToBytes(toSign);
    let digest = Crypto.hmacSha1(keyBytes, msgBytes);
    let computed = Crypto.base64Encode(digest);

    computed == signature;
  };

  // ── Private: command routing (fully synchronous — no outcalls) ──────────

  private func routeCommand(body : Text, _fromNumber : Text) : Text {
    let trimmed = body.trimStart(#char ' ').trimEnd(#char ' ');
    let lower = trimmed.toLower();

    if (lower == "hello" or lower == "hi" or lower == "hey" or lower == "start" or lower == "hii" or lower == "helo") {
      greetingMessage();
    } else if (lower == "/watchlist" or lower == "watchlist") {
      handleWatchlistCommand();
    } else if (lower == "/recommend" or lower == "recommend") {
      handleRecommendCommand();
    } else if (lower == "/trending" or lower == "trending") {
      handleTrendingCommand();
    } else if (lower == "/help" or lower == "help") {
      helpMessage();
    } else if (lower.startsWith(#text "/details ") or lower.startsWith(#text "details ")) {
      let title = if (lower.startsWith(#text "/details ")) {
        Text.fromIter(trimmed.toIter().drop(9))
      } else {
        Text.fromIter(trimmed.toIter().drop(8))
      };
      handleDetailsCommand(title);
    } else if (lower.startsWith(#text "/add ") or lower.startsWith(#text "add ")) {
      let title = if (lower.startsWith(#text "/add ")) {
        Text.fromIter(trimmed.toIter().drop(5))
      } else {
        Text.fromIter(trimmed.toIter().drop(4))
      };
      handleAddCommand(title);
    } else {
      // Echo back with help hint — no AI outcall to avoid Twilio timeout
      handleFreeFormQuestion(trimmed);
    };
  };

  private func handleWatchlistCommand() : Text {
    // Use anonymous principal for bot context — show global top entries
    let systemPrincipal = Principal.anonymous();
    let entries = WatchlistLib.getWatchlist(watchlists, systemPrincipal);
    if (entries.size() == 0) {
      "📚 Your watchlist is empty!\nAdd titles with: /add <title name>";
    } else {
      var msg = "📚 *Your Watchlist:*\n";
      let limit = if (entries.size() > 5) { 5 } else { entries.size() };
      var i = 0;
      while (i < limit) {
        let e = entries[i];
        let statusEmoji = switch (e.readingStatus) {
          case (#reading) { "📖" };
          case (#planToRead) { "📌" };
          case (#completed) { "✅" };
          case (#dropped) { "❌" };
        };
        msg := msg # (i + 1).toText() # ". " # statusEmoji # " *" # e.title # "*";
        if (e.chaptersRead > 0) {
          msg := msg # " — Ch." # e.chaptersRead.toText();
        };
        msg := msg # "\n";
        i += 1;
      };
      if (entries.size() > 5) {
        msg := msg # "_...and " # (entries.size() - 5).toText() # " more_";
      };
      msg;
    };
  };

  private func handleRecommendCommand() : Text {
    let systemPrincipal = Principal.anonymous();
    let cached = WatchlistLib.getCachedAiRecommendations(recCache, systemPrincipal);
    if (cached.size() == 0) {
      "🤖 *AI Picks:*\n\nNo recommendations cached yet. Visit the MihonBot dashboard to generate personalized picks!\n\n💡 Tip: Add titles to your watchlist first for better recommendations.";
    } else {
      var msg = "🤖 *AI Picks for you:*\n\n";
      let limit = if (cached.size() > 3) { 3 } else { cached.size() };
      var i = 0;
      while (i < limit) {
        let r = cached[i];
        msg := msg # (i + 1).toText() # ". ✨ *" # r.title # "*\n   → " # r.reason # "\n\n";
        i += 1;
      };
      msg;
    };
  };

  private func handleTrendingCommand() : Text {
    let cacheKey = "__trending__";
    let results = switch (WatchlistLib.getCachedSearchResults(searchCache, cacheKey)) {
      case (?cached) { cached };
      case null { [] };
    };
    if (results.size() == 0) {
      "🔥 *Trending Now:*\n\nTrending data is loading. Check back in a moment or visit MihonBot dashboard for live trending titles!\n\n🌟 Popular right now: Jujutsu Kaisen, One Piece, Solo Leveling";
    } else {
      var msg = "🔥 *Trending Now:*\n\n";
      let limit = if (results.size() > 5) { 5 } else { results.size() };
      var i = 0;
      while (i < limit) {
        let r = results[i];
        let emoji = switch (i) {
          case 0 { "🥇" };
          case 1 { "🥈" };
          case 2 { "🥉" };
          case _ { "🌟" };
        };
        msg := msg # (i + 1).toText() # ". " # emoji # " *" # r.title # "*\n";
        i += 1;
      };
      msg;
    };
  };

  private func greetingMessage() : Text {
    "👋 *Welcome to MihonBot!* 🎌\n\n" #
    "I'm your manga, manhwa & comics companion. Here's what I can do:\n\n" #
    "📋 /watchlist — Your reading list\n" #
    "🤖 /recommend — AI-powered picks\n" #
    "🔥 /trending — What's hot right now\n" #
    "🔍 /details <title> — Series info\n" #
    "➕ /add <title> — Add to watchlist\n" #
    "❓ /help — Show this menu\n\n" #
    "💬 Or just ask me anything about manga/manhwa/comics!\n" #
    "Let's get reading! 📖";
  };

  private func helpMessage() : Text {
    "🎌 *MihonBot Commands:*\n\n" #
    "📋 /watchlist — Your reading list\n" #
    "🤖 /recommend — AI-powered picks\n" #
    "🔥 /trending — What's hot right now\n" #
    "🔍 /details <title> — Series info\n" #
    "➕ /add <title> — Add to watchlist\n" #
    "❓ /help — Show this menu\n\n" #
    "💬 Or just ask me anything about manga/manhwa/comics!";
  };

  private func handleDetailsCommand(title : Text) : Text {
    if (title == "") {
      return "🔍 Usage: /details <title name>\nExample: /details One Piece";
    };
    // Check search cache first
    let encoded = encodeURIComponent(title);
    switch (WatchlistLib.getCachedSearchResults(searchCache, title)) {
      case (?results) {
        if (results.size() > 0) {
          let r = results[0];
          let typeEmoji = switch (r.contentType) {
            case (#manga) { "📕" };
            case (#manhwa) { "📗" };
            case (#comics) { "📘" };
          };
          let statusText = switch (r.status) {
            case "ongoing" { "🟢 Ongoing" };
            case "completed" { "✅ Completed" };
            case "hiatus" { "⏸️ On Hiatus" };
            case _ { r.status };
          };
          typeEmoji # " *" # r.title # "*\n" #
          "📊 Status: " # statusText # "\n" #
          "✍️ Author: " # r.author # "\n" #
          "🏷️ Type: " # (switch (r.contentType) { case (#manga) "Manga"; case (#manhwa) "Manhwa"; case (#comics) "Comics" }) # "\n" #
          "🔗 MangaDex: https://mangadex.org/title/" # r.mangaDexId;
        } else {
          "😕 Couldn't find *" # title # "* in cache.\n\nSearch for it on the MihonBot dashboard for full details!\n🌐 https://mangadex.org/search?q=" # encoded;
        }
      };
      case null {
        "🔍 *" # title # "*\n\nNo cached details yet. Search on the MihonBot dashboard or visit:\n🌐 https://mangadex.org/search?q=" # encoded;
      };
    };
  };

  private func handleAddCommand(title : Text) : Text {
    if (title == "") {
      return "➕ Usage: /add <title name>\nExample: /add One Piece";
    };
    "➕ *" # title # "* — to add this to your watchlist, please use the MihonBot dashboard!\n\n🌐 Visit the app and search for the title to add it with full details.";
  };

  private func handleFreeFormQuestion(question : Text) : Text {
    // Sync fallback — no AI outcall to guarantee Twilio response within timeout
    "🤖 You asked: *" # question # "*\n\n" #
    "I can help with manga/manhwa/comics! Try these commands:\n\n" #
    "📋 /watchlist — Your reading list\n" #
    "🤖 /recommend — AI-powered picks\n" #
    "🔥 /trending — What's hot\n" #
    "🔍 /details <title> — Series info\n" #
    "➕ /add <title> — Add to watchlist\n" #
    "❓ /help — All commands\n\n" #
    "🌐 Or visit the MihonBot dashboard for full AI features!";
  };

  // ── Private: outbound Twilio message ─────────────────────────────────────

  private func sendTwilioMessage(toNumber : Text, body : Text) : async () {
    let sid = twilioConfig.accountSid;
    let token = twilioConfig.authToken;
    let from = "whatsapp:" # twilioConfig.sandboxNumber;
    let to = if (toNumber.startsWith(#text "whatsapp:")) { toNumber } else { "whatsapp:" # toNumber };

    let formBody = "From=" # encodeURIComponent(from) #
      "&To=" # encodeURIComponent(to) #
      "&Body=" # encodeURIComponent(body);

    // Basic auth: base64(sid:token)
    let credentials = Crypto.base64Encode(Crypto.textToBytes(sid # ":" # token));
    let url = "https://api.twilio.com/2010-04-01/Accounts/" # sid # "/Messages.json";
    let headers = [
      { name = "Content-Type"; value = "application/x-www-form-urlencoded" },
      { name = "Authorization"; value = "Basic " # credentials },
    ];

    let _ = await OutCall.httpPostRequest(url, headers, formBody, transform_twilio);
  };

  // ── Private: HTTP types ───────────────────────────────────────────────────

  public type HttpRequest = {
    method : Text;
    url : Text;
    headers : [(Text, Text)];
    body : Blob;
  };

  public type HttpResponse = {
    status_code : Nat16;
    headers : [(Text, Text)];
    body : Blob;
    upgrade : ?Bool;
  };

  // ── Private: HTTP helpers ─────────────────────────────────────────────────

  private func findHeader(headers : [(Text, Text)], name : Text) : Text {
    let lower = name.toLower();
    switch (headers.find<(Text, Text)>(func(h) { h.0.toLower() == lower })) {
      case (?(_, v)) { v };
      case null { "" };
    };
  };

  /// Parse application/x-www-form-urlencoded body into key-value pairs.
  private func parseFormEncoded(body : Text) : [(Text, Text)] {
    let parts = body.split(#char '&');
    let result = List.empty<(Text, Text)>();
    for (part in parts) {
      switch (part.toArray().find<Char>(func(c) { c == '=' })) {
        case null { result.add((urlDecode(part), "")) };
        case (?_) {
          let kv = part.split(#char '=');
          let kvArr = kv.toArray();
          if (kvArr.size() >= 2) {
            let k = urlDecode(kvArr[0]);
            // Value may contain '=' characters, rejoin
            var v = kvArr[1];
            var i = 2;
            while (i < kvArr.size()) {
              v := v # "=" # kvArr[i];
              i += 1;
            };
            result.add((k, urlDecode(v)));
          };
        };
      };
    };
    result.toArray();
  };

  private func getParam(params : [(Text, Text)], key : Text) : Text {
    switch (params.find<(Text, Text)>(func(p) { p.0 == key })) {
      case (?(_, v)) { v };
      case null { "" };
    };
  };

  /// Decode percent-encoded URL string.
  private func urlDecode(s : Text) : Text {
    let chars = s.toArray();
    var result = "";
    var i = 0;
    while (i < chars.size()) {
      let ch = Text.fromChar(chars[i]);
      if (ch == "+" ) {
        result := result # " ";
        i += 1;
      } else if (ch == "%" and i + 2 < chars.size()) {
        let hi = hexDigit(chars[i + 1]);
        let lo = hexDigit(chars[i + 2]);
        switch (hi, lo) {
          case (?h, ?l) {
            let code : Nat32 = Nat32.fromNat(h * 16 + l);
            result := result # Text.fromChar(Char.fromNat32(code));
            i += 3;
          };
          case _ {
            result := result # ch;
            i += 1;
          };
        };
      } else {
        result := result # ch;
        i += 1;
      };
    };
    result;
  };

  private func hexDigit(c : Char) : ?Nat {
    if (c >= '0' and c <= '9') { ?((c.toNat32() - '0'.toNat32()).toNat()) }
    else if (c >= 'a' and c <= 'f') { ?((c.toNat32() - 'a'.toNat32()).toNat() + 10) }
    else if (c >= 'A' and c <= 'F') { ?((c.toNat32() - 'A'.toNat32()).toNat() + 10) }
    else { null }
  };

  /// Escape XML special characters for TwiML body.
  private func xmlEscape(s : Text) : Text {
    var r = "";
    for (c in s.toIter()) {
      let ch = Text.fromChar(c);
      if (ch == "&") { r := r # "&amp;" }
      else if (ch == "<") { r := r # "&lt;" }
      else if (ch == ">") { r := r # "&gt;" }
      else if (ch == "\"") { r := r # "&quot;" }
      else if (ch == "'") { r := r # "&#39;" }
      else { r := r # ch };
    };
    r;
  };

  // ── Private: JSON / text helpers ──────────────────────────────────────────

  /// Minimal URI percent-encoding for the query string.
  private func encodeURIComponent(text : Text) : Text {
    var encoded = "";
    for (c in text.toIter()) {
      let ch = Text.fromChar(c);
      if (
        (c >= 'A' and c <= 'Z') or
        (c >= 'a' and c <= 'z') or
        (c >= '0' and c <= '9') or
        ch == "-" or ch == "_" or ch == "." or ch == "~"
      ) {
        encoded := encoded # ch;
      } else if (ch == " ") {
        encoded := encoded # "%20";
      } else {
        let code = c.toNat32();
        encoded := encoded # "%" # natToHex(code.toNat());
      };
    };
    encoded;
  };

  /// Escape double quotes and backslashes for JSON string embedding.
  private func escapeJson(text : Text) : Text {
    var result = "";
    for (c in text.toIter()) {
      let ch = Text.fromChar(c);
      if (ch == "\"") {
        result := result # "\\\"";
      } else if (ch == "\\") {
        result := result # "\\\\";
      } else if (ch == "\n") {
        result := result # "\\n";
      } else {
        result := result # ch;
      };
    };
    result;
  };

  /// Convert a Nat to a 2-digit hex string (for percent-encoding).
  private func natToHex(n : Nat) : Text {
    let hexChars = ["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F"];
    let hi = n / 16;
    let lo = n % 16;
    hexChars[hi] # hexChars[lo];
  };

  /// Extract a JSON string value for a given key.
  private func extractJsonString(json : Text, key : Text) : ?Text {
    let needle = "\"" # key # "\":\"";
    let needle2 = "\"" # key # "\": \"";
    let startOpt = findSubstring(json, needle);
    let start = switch (startOpt) {
      case (?s) { s + needle.size() };
      case null {
        switch (findSubstring(json, needle2)) {
          case (?s) { s + needle2.size() };
          case null { return null };
        }
      };
    };
    let chars = json.toArray();
    var value = "";
    var i = start;
    while (i < chars.size()) {
      let ch = Text.fromChar(chars[i]);
      if (ch == "\"") {
        return ?value;
      } else if (ch == "\\" and i + 1 < chars.size()) {
        i += 1;
        let escaped = Text.fromChar(chars[i]);
        if (escaped == "n") { value := value # "\n" }
        else if (escaped == "t") { value := value # "\t" }
        else { value := value # escaped };
      } else {
        value := value # ch;
      };
      i += 1;
    };
    null;
  };

  /// Find the first occurrence of needle in haystack; returns start index.
  private func findSubstring(haystack : Text, needle : Text) : ?Nat {
    let hArr = haystack.toArray();
    let nArr = needle.toArray();
    let hLen = hArr.size();
    let nLen = nArr.size();
    if (nLen == 0) { return ?0 };
    if (nLen > hLen) { return null };
    var i = 0;
    while (i <= hLen - nLen) {
      var j = 0;
      var matched = true;
      while (j < nLen and matched) {
        if (hArr[i + j] != nArr[j]) { matched := false };
        j += 1;
      };
      if (matched) { return ?i };
      i += 1;
    };
    null;
  };

  /// Determine ContentType from MangaDex publicationDemographic / tags.
  private func detectContentType(json : Text) : Types.ContentType {
    if (json.contains(#text "manhwa") or json.contains(#text "Korean")) {
      #manhwa
    } else if (json.contains(#text "comic") or json.contains(#text "Comics")) {
      #comics
    } else {
      #manga
    };
  };

  /// Parse a Float from a chapter string like "123" or "123.5".
  private func parseChapterFloat(s : Text) : Float {
    switch (Int.fromText(s)) {
      case (?n) { n.toFloat() };
      case null { 0.0 };
    };
  };

  /// Parse a MangaMeta from a MangaDex /manga/{id} JSON response.
  private func parseMangaMeta(mangaDexId : Text, json : Text) : ?Types.MangaMeta {
    let titleOpt = extractJsonString(json, "en");
    let title = switch (titleOpt) {
      case (?t) { t };
      case null {
        switch (extractJsonString(json, "title")) {
          case (?t) { t };
          case null { mangaDexId };
        }
      };
    };
    let description = switch (extractJsonString(json, "en")) {
      case (?d) { d };
      case null { "" };
    };
    let status = switch (extractJsonString(json, "status")) {
      case (?s) { s };
      case null { "unknown" };
    };
    let author = switch (extractJsonString(json, "name")) {
      case (?a) { a };
      case null { "Unknown" };
    };
    let contentType = detectContentType(json);
    let coverFileName = switch (extractJsonString(json, "fileName")) {
      case (?f) { f };
      case null { "" };
    };
    let coverImageUrl = if (coverFileName == "") {
      ""
    } else {
      "https://uploads.mangadex.org/covers/" # mangaDexId # "/" # coverFileName
    };

    ?{
      mangaDexId = mangaDexId;
      title = title;
      coverImageUrl = coverImageUrl;
      description = description;
      genres = [];
      contentType = contentType;
      status = status;
      author = author;
      artist = author;
      rating = 0.0;
      lastFetched = Time.now();
    };
  };

  /// Extract the latest chapter number from a MangaDex feed JSON response.
  private func parseLatestChapter(json : Text) : ?Float {
    switch (extractJsonString(json, "chapter")) {
      case null { null };
      case (?chStr) { ?parseChapterFloat(chStr) };
    };
  };

  /// Parse a list of MangaSearchResult from a MangaDex /manga list JSON.
  private func parseMangaSearchResults(json : Text) : [Types.MangaSearchResult] {
    let results = List.empty<Types.MangaSearchResult>();
    var remaining = json;
    var continueLoop = true;
    while (continueLoop) {
      let idNeedle = "\"id\":\"";
      switch (findSubstring(remaining, idNeedle)) {
        case null { continueLoop := false };
        case (?idStart) {
          let afterId = remaining.toArray();
          let valueStart = idStart + idNeedle.size();
          var idStr = "";
          var k = valueStart;
          var innerLoop = true;
          while (innerLoop and k < afterId.size()) {
            let ch = Text.fromChar(afterId[k]);
            if (ch == "\"") { innerLoop := false }
            else { idStr := idStr # ch };
            k += 1;
          };
          let sliceStart = idStart + idNeedle.size() + idStr.size() + 1;
          let titleOpt = extractJsonString(remaining, "en");
          let title = switch (titleOpt) {
            case (?t) { t };
            case null { idStr };
          };
          let status = switch (extractJsonString(remaining, "status")) {
            case (?s) { s };
            case null { "unknown" };
          };
          let contentType = detectContentType(remaining);
          let coverFileName = switch (extractJsonString(remaining, "fileName")) {
            case (?f) { f };
            case null { "" };
          };
          let coverImageUrl = if (coverFileName == "") {
            ""
          } else {
            "https://uploads.mangadex.org/covers/" # idStr # "/" # coverFileName
          };
          let author = switch (extractJsonString(remaining, "name")) {
            case (?a) { a };
            case null { "Unknown" };
          };
          results.add({
            mangaDexId = idStr;
            title = title;
            coverImageUrl = coverImageUrl;
            description = "";
            genres = [];
            contentType = contentType;
            status = status;
            author = author;
            artist = author;
            rating = 0.0;
          });
          if (sliceStart >= remaining.size()) {
            continueLoop := false;
          } else {
            remaining := Text.fromIter(remaining.toIter().drop(sliceStart));
          };
        };
      };
    };
    results.toArray();
  };

  /// Parse AI recommendations from an OpenAI chat completion JSON response.
  private func parseAiRecommendations(json : Text) : [Types.AiRecommendation] {
    let contentOpt = extractJsonString(json, "content");
    let arrayJson = switch (contentOpt) {
      case null { json };
      case (?c) { c };
    };
    let results = List.empty<Types.AiRecommendation>();
    var remaining = arrayJson;
    var continueLoop = true;
    while (continueLoop) {
      switch (findSubstring(remaining, "\"mangaDexId\"")) {
        case null { continueLoop := false };
        case (?start) {
          let mangaDexId = switch (extractJsonString(remaining, "mangaDexId")) {
            case (?v) { v };
            case null { "" };
          };
          let title = switch (extractJsonString(remaining, "title")) {
            case (?v) { v };
            case null { "" };
          };
          let reason = switch (extractJsonString(remaining, "reason")) {
            case (?v) { v };
            case null { "" };
          };
          let matchScore = switch (extractJsonNumber(remaining, "matchScore")) {
            case (?v) { v };
            case null { 0.0 };
          };
          if (mangaDexId != "") {
            results.add({ mangaDexId; title; reason; matchScore });
          };
          let advanceBy = start + "\"mangaDexId\"".size() + mangaDexId.size() + 4;
          if (advanceBy >= remaining.size()) {
            continueLoop := false;
          } else {
            remaining := Text.fromIter(remaining.toIter().drop(advanceBy));
          };
        };
      };
    };
    results.toArray();
  };

  /// Extract a JSON number value for a given key (returns as Float).
  private func extractJsonNumber(json : Text, key : Text) : ?Float {
    let needle = "\"" # key # "\":";
    let needle2 = "\"" # key # "\": ";
    let startOpt = findSubstring(json, needle);
    let start = switch (startOpt) {
      case (?s) { s + needle.size() };
      case null {
        switch (findSubstring(json, needle2)) {
          case (?s) { s + needle2.size() };
          case null { return null };
        }
      };
    };
    let chars = json.toArray();
    var numStr = "";
    var i = start;
    while (i < chars.size() and Text.fromChar(chars[i]) == " ") { i += 1 };
    while (i < chars.size()) {
      let ch = Text.fromChar(chars[i]);
      if (ch == "," or ch == "}" or ch == "]" or ch == " ") {
        i := chars.size();
      } else {
        numStr := numStr # ch;
        i += 1;
      };
    };
    if (numStr == "") { return null };
    let parts = numStr.split(#char '.');
    let partsArr = parts.toArray();
    if (partsArr.size() == 0) { return null };
    let intPart = switch (Int.fromText(partsArr[0])) {
      case (?n) { n };
      case null { return null };
    };
    if (partsArr.size() == 1) {
      return ?intPart.toFloat();
    };
    let decStr = partsArr[1];
    let decVal = switch (Nat.fromText(decStr)) {
      case (?n) { n };
      case null { return ?intPart.toFloat() };
    };
    let divisor = natPow(10, decStr.size()).toInt().toFloat();
    ?(intPart.toFloat() + decVal.toInt().toFloat() / divisor);
  };

  /// Integer power.
  private func natPow(base : Nat, exp : Nat) : Nat {
    if (exp == 0) { 1 }
    else { base * natPow(base, exp - 1) };
  };
};
