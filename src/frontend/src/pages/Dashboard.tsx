import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  BookOpen,
  Bot,
  ChevronRight,
  Clock,
  Library,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { WatchlistCardSkeleton } from "../components/LoadingSpinner";
import { WatchlistCard } from "../components/MangaCard";
import { MangaCard } from "../components/MangaCard";
import {
  useAiRecommendations,
  useBotCommandLog,
  useCheckForNewChapters,
  useTrending,
  useWatchlist,
} from "../hooks/useQueries";
import { useAddToWatchlist } from "../hooks/useQueries";
import type { MangaSearchResult, WatchlistEntry } from "../types";
import { ContentType, ReadingStatus } from "../types";

const SAMPLE_TRENDING: MangaSearchResult[] = [
  {
    mangaDexId: "jujutsu-kaisen",
    title: "Jujutsu Kaisen",
    coverImageUrl: "",
    description:
      "Yuji Itadori battles cursed spirits as a vessel for the most powerful curse.",
    genres: ["Action", "Supernatural"],
    contentType: ContentType.manga,
    status: "ongoing",
    author: "Gege Akutami",
    artist: "Gege Akutami",
    rating: 8.7,
  },
  {
    mangaDexId: "spy-x-family",
    title: "Spy x Family",
    coverImageUrl: "",
    description:
      "A spy, an assassin, and a telepath form a fake family for a secret mission.",
    genres: ["Action", "Comedy"],
    contentType: ContentType.manga,
    status: "ongoing",
    author: "Tatsuya Endo",
    artist: "Tatsuya Endo",
    rating: 8.9,
  },
  {
    mangaDexId: "solo-leveling",
    title: "Solo Leveling",
    coverImageUrl: "",
    description:
      "The weakest hunter becomes the world's strongest in a world of dungeons.",
    genres: ["Action", "Fantasy"],
    contentType: ContentType.manhwa,
    status: "completed",
    author: "Chugong",
    artist: "DUBU",
    rating: 9.1,
  },
  {
    mangaDexId: "one-piece",
    title: "One Piece",
    coverImageUrl: "",
    description: "Monkey D. Luffy's quest to become King of the Pirates.",
    genres: ["Adventure", "Action"],
    contentType: ContentType.manga,
    status: "ongoing",
    author: "Eiichiro Oda",
    artist: "Eiichiro Oda",
    rating: 9.5,
  },
];

// --- Quick Stats ---

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: "primary" | "accent" | "chart-3" | "chart-4";
  loading?: boolean;
}

function StatCard({
  icon,
  label,
  value,
  accent = "primary",
  loading,
}: StatCardProps) {
  const accentMap: Record<string, string> = {
    primary: "text-primary bg-primary/10 border-primary/20",
    accent: "text-accent bg-accent/10 border-accent/20",
    "chart-3": "text-chart-3 bg-chart-3/10 border-chart-3/20",
    "chart-4": "text-chart-4 bg-chart-4/10 border-chart-4/20",
  };
  return (
    <div
      className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
      data-ocid="stat-card"
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center border ${accentMap[accent]}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs uppercase tracking-wide">
          {label}
        </p>
        {loading ? (
          <Skeleton className="h-6 w-16 mt-1" />
        ) : (
          <p className="font-display font-bold text-xl text-foreground leading-tight">
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

// --- Recent Activity Feed ---

function RecentActivityItem({
  entry,
  index,
}: {
  entry: WatchlistEntry;
  index: number;
}) {
  const isNew =
    entry.lastKnownChapter > 0 &&
    Number(entry.chaptersRead) < entry.lastKnownChapter;
  const updatedMs = Number(entry.updatedAt);
  const now = Date.now();
  const diffH = Math.floor((now - updatedMs) / (1000 * 60 * 60));
  const timeAgo =
    diffH < 1
      ? "just now"
      : diffH < 24
        ? `${diffH}h ago`
        : `${Math.floor(diffH / 24)}d ago`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      className="flex items-center gap-3 py-2.5 border-b border-border last:border-0"
      data-ocid="activity-item"
    >
      <div className="w-8 h-8 rounded-lg bg-muted shrink-0 flex items-center justify-center">
        <BookOpen className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <Link
          to="/series/$mangaDexId"
          params={{ mangaDexId: entry.mangaDexId }}
        >
          <span className="font-medium text-sm text-foreground hover:text-primary transition-colors line-clamp-1">
            {entry.title}
          </span>
        </Link>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ch. {entry.lastKnownChapter} available
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {isNew && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/40 leading-tight">
            NEW
          </span>
        )}
        <span className="text-xs text-muted-foreground">{timeAgo}</span>
      </div>
    </motion.div>
  );
}

// --- Bot Command Panel ---

function BotCommandPanel() {
  const { data: commands, isLoading } = useBotCommandLog(5n);
  const exampleCommands = [
    { cmd: "/track", desc: "manga_name", color: "text-primary" },
    {
      cmd: "/status",
      desc: "on_going | completed | dropped",
      color: "text-accent",
    },
    { cmd: "/recommend", desc: "get AI picks", color: "text-chart-3" },
    { cmd: "/watchlist", desc: "view your list", color: "text-chart-4" },
  ];

  return (
    <div
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-elevated"
      data-ocid="bot-panel"
    >
      <div className="border-b border-border px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <span className="font-display font-semibold text-sm">
            MihonBot Command Panel
          </span>
        </div>
        <Badge
          variant="secondary"
          className="text-xs bg-accent/10 text-accent border-accent/20"
        >
          WhatsApp Live
        </Badge>
      </div>
      <div className="p-5 font-mono text-xs space-y-2">
        {isLoading
          ? ["a", "b", "c", "d"].map((k) => (
              <Skeleton key={`skeleton-bot-${k}`} className="h-4 w-full" />
            ))
          : commands && commands.length > 0
            ? commands.slice(0, 4).map((cmd) => (
                <div key={cmd.id.toString()} className="flex gap-2">
                  <span className="text-muted-foreground">{">"}</span>
                  <span className="text-foreground truncate">
                    {cmd.command}
                  </span>
                </div>
              ))
            : exampleCommands.map((item) => (
                <div key={item.cmd} className="flex gap-2">
                  <span className="text-muted-foreground">{">"}</span>
                  <span className={item.color}>{item.cmd}</span>
                  <span className="text-muted-foreground">{item.desc}</span>
                </div>
              ))}
        <div className="flex gap-2">
          <span className="text-muted-foreground">{">"}</span>
          <span className="text-primary">/latest_updates</span>
          <span className="text-muted-foreground animate-pulse">|</span>
        </div>
      </div>
      <div className="px-5 pb-5 space-y-2">
        <Link to="/watchlist">
          <Button className="w-full gap-2" data-ocid="bot-add-manga-btn">
            <Plus className="w-4 h-4" /> Add Manga
          </Button>
        </Link>
        <Link to="/settings">
          <Button
            variant="outline"
            className="w-full gap-2 border-accent/30 text-accent hover:bg-accent/10"
            data-ocid="bot-set-alert-btn"
          >
            <Bell className="w-4 h-4" /> Set WhatsApp Alert
          </Button>
        </Link>
        <Link to="/bot">
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
            data-ocid="bot-view-commands-btn"
          >
            View All Commands
          </Button>
        </Link>
      </div>
    </div>
  );
}

// --- Main Dashboard ---

export default function Dashboard() {
  const { data: trending, isLoading: trendingLoading } = useTrending();
  const { data: watchlist, isLoading: watchlistLoading } = useWatchlist();
  const { data: recommendations } = useAiRecommendations();
  const addToWatchlist = useAddToWatchlist();
  const checkChapters = useCheckForNewChapters();

  const displayTrending =
    trending && trending.length > 0 ? trending.slice(0, 4) : SAMPLE_TRENDING;

  // Derive stats
  const totalSeries = watchlist?.length ?? 0;
  const readingCount =
    watchlist?.filter((w) => w.readingStatus === ReadingStatus.reading)
      .length ?? 0;
  const newChaptersCount =
    watchlist?.filter(
      (w) =>
        w.lastKnownChapter > 0 && Number(w.chaptersRead) < w.lastKnownChapter,
    ).length ?? 0;

  // Recent activity: entries with latest known chapters, sorted by updatedAt desc
  const recentActivity = watchlist
    ? [...watchlist]
        .filter((w) => w.lastKnownChapter > 0)
        .sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt))
        .slice(0, 5)
    : [];

  const handleAdd = (manga: MangaSearchResult) => {
    addToWatchlist.mutate(
      {
        mangaDexId: manga.mangaDexId,
        title: manga.title,
        contentType: manga.contentType,
        chaptersRead: 0n,
        lastKnownChapter: 0,
        readingStatus: ReadingStatus.planToRead,
        addedAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      },
      {
        onSuccess: () => toast.success(`Added "${manga.title}" to watchlist`),
        onError: () => toast.error("Failed to add to watchlist"),
      },
    );
  };

  const handleCheckAllChapters = () => {
    if (!watchlist || watchlist.length === 0) {
      toast.info("Your watchlist is empty.");
      return;
    }
    const readingEntries = watchlist.filter(
      (w) => w.readingStatus === ReadingStatus.reading,
    );
    if (readingEntries.length === 0) {
      toast.info("No series marked as reading.");
      return;
    }
    const first = readingEntries[0];
    checkChapters.mutate(first.mangaDexId, {
      onSuccess: (notifications) => {
        if (notifications.length > 0) {
          toast.success(
            `Found ${notifications.length} new chapter(s)! Check your WhatsApp.`,
          );
        } else {
          toast.info("All caught up — no new chapters found.");
        }
      },
      onError: () => toast.error("Failed to check for new chapters"),
    });
  };

  const watchlistIds = new Set(watchlist?.map((w) => w.mangaDexId) ?? []);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Main Content */}
        <div className="space-y-8">
          {/* Hero Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl overflow-hidden bg-card border border-border"
            style={{ minHeight: "200px" }}
          >
            <img
              src="/assets/generated/hero-mihonbot.dim_1200x600.jpg"
              alt="MihonBot Hero"
              className="w-full h-48 object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent flex items-center p-6">
              <div>
                <Badge className="mb-2 bg-primary/20 text-primary border-primary/30">
                  <Sparkles className="w-3 h-3 mr-1" /> AI-Powered Tracker
                </Badge>
                <h1 className="font-display text-2xl font-bold text-foreground">
                  Your Manga Hub,
                  <br />
                  <span className="text-primary">Always Updated</span>
                </h1>
                <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                  Track manga, manhwa & comics. Get WhatsApp alerts for new
                  chapters.
                </p>
                <div className="flex gap-2 mt-3">
                  <Link to="/discover">
                    <Button
                      size="sm"
                      className="gap-1.5"
                      data-ocid="hero-browse-btn"
                    >
                      <BookOpen className="w-4 h-4" /> Browse Series
                    </Button>
                  </Link>
                  <Link to="/ai-agent">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-accent/30 text-accent hover:bg-accent/10"
                      data-ocid="hero-ai-btn"
                    >
                      <Sparkles className="w-4 h-4" /> Get Recommendations
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats Row */}
          <section data-ocid="stats-row">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3"
            >
              <StatCard
                icon={<Library className="w-5 h-5" />}
                label="Total Series"
                value={watchlistLoading ? "—" : totalSeries}
                accent="primary"
                loading={watchlistLoading}
              />
              <StatCard
                icon={<BookOpen className="w-5 h-5" />}
                label="Reading"
                value={watchlistLoading ? "—" : readingCount}
                accent="chart-3"
                loading={watchlistLoading}
              />
              <div className="col-span-2 sm:col-span-1">
                <StatCard
                  icon={<Zap className="w-5 h-5" />}
                  label="New Chapters"
                  value={watchlistLoading ? "—" : newChaptersCount}
                  accent="accent"
                  loading={watchlistLoading}
                />
              </div>
            </motion.div>
          </section>

          {/* Quick Actions */}
          <section>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex flex-wrap gap-3"
              data-ocid="quick-actions"
            >
              <Button
                onClick={handleCheckAllChapters}
                disabled={checkChapters.isPending}
                className="gap-2"
                data-ocid="check-chapters-btn"
              >
                <RefreshCw
                  className={`w-4 h-4 ${checkChapters.isPending ? "animate-spin" : ""}`}
                />
                {checkChapters.isPending
                  ? "Checking…"
                  : "Check for New Chapters"}
              </Button>
              <Link to="/discover">
                <Button
                  variant="outline"
                  className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
                  data-ocid="goto-discover-btn"
                >
                  <TrendingUp className="w-4 h-4" /> Go to Discover
                </Button>
              </Link>
              <Link to="/ai-agent">
                <Button
                  variant="outline"
                  className="gap-2 border-accent/30 text-accent hover:bg-accent/10"
                  data-ocid="ai-recommend-quick-btn"
                >
                  <Sparkles className="w-4 h-4" /> AI Recommendations
                </Button>
              </Link>
            </motion.div>
          </section>

          {/* Trending Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="font-display text-xl font-bold">
                  Trending Titles
                </h2>
              </div>
              <Link to="/discover">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-muted-foreground hover:text-foreground"
                  data-ocid="trending-see-all-btn"
                >
                  See all <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            {trendingLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["t1", "t2", "t3", "t4"].map((k) => (
                  <div
                    key={k}
                    className="bg-card border border-border rounded-xl overflow-hidden"
                  >
                    <Skeleton className="w-full aspect-[2/3]" />
                    <div className="p-3 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {displayTrending.map((manga, i) => (
                  <motion.div
                    key={manga.mangaDexId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <MangaCard
                      manga={manga}
                      onAddToWatchlist={handleAdd}
                      isInWatchlist={watchlistIds.has(manga.mangaDexId)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* My Watchlist */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent" />
                <h2 className="font-display text-xl font-bold">My Watchlist</h2>
                {watchlist && watchlist.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-accent/15 text-accent border-accent/20"
                  >
                    {watchlist.length}
                  </Badge>
                )}
                {!watchlistLoading && newChaptersCount > 0 && (
                  <Badge className="bg-accent/20 text-accent border-accent/40 gap-1">
                    <Zap className="w-3 h-3" />
                    {newChaptersCount} new
                  </Badge>
                )}
              </div>
              <Link to="/watchlist">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-muted-foreground hover:text-foreground"
                  data-ocid="watchlist-manage-btn"
                >
                  Manage <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            {watchlistLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {["w1", "w2", "w3", "w4", "w5", "w6"].map((k) => (
                  <WatchlistCardSkeleton key={k} />
                ))}
              </div>
            ) : watchlist && watchlist.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {watchlist.slice(0, 6).map((entry, i) => (
                  <motion.div
                    key={entry.mangaDexId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <WatchlistCard entry={entry} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div
                className="bg-card border border-dashed border-border rounded-2xl p-10 text-center"
                data-ocid="watchlist-empty-state"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1">
                  Your watchlist is empty
                </h3>
                <p className="text-muted-foreground text-sm mb-5 max-w-xs mx-auto">
                  Start tracking manga, manhwa, and comics — get WhatsApp alerts
                  when new chapters drop.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Link to="/discover">
                    <Button
                      size="sm"
                      className="gap-2"
                      data-ocid="empty-discover-btn"
                    >
                      <Plus className="w-4 h-4" /> Discover Series
                    </Button>
                  </Link>
                  <Link to="/ai-agent">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 border-accent/30 text-accent hover:bg-accent/10"
                      data-ocid="empty-ai-btn"
                    >
                      <Sparkles className="w-4 h-4" /> Get AI Picks
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </section>

          {/* Recent Activity Feed */}
          {(watchlistLoading || recentActivity.length > 0) && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-chart-3" />
                  <h2 className="font-display text-xl font-bold">
                    Recent Activity
                  </h2>
                </div>
                <Badge
                  variant="secondary"
                  className="gap-1 text-xs bg-muted text-muted-foreground"
                >
                  <Clock className="w-3 h-3" /> Latest releases
                </Badge>
              </div>
              <div
                className="bg-card border border-border rounded-2xl px-5 py-1"
                data-ocid="activity-feed"
              >
                {watchlistLoading ? (
                  ["a1", "a2", "a3", "a4", "a5"].map((k) => (
                    <div
                      key={k}
                      className="flex items-center gap-3 py-3 border-b border-border last:border-0"
                    >
                      <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-2/3" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                      <Skeleton className="h-5 w-12" />
                    </div>
                  ))
                ) : recentActivity.length > 0 ? (
                  recentActivity.map((entry, i) => (
                    <RecentActivityItem
                      key={entry.mangaDexId}
                      entry={entry}
                      index={i}
                    />
                  ))
                ) : (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    No recent chapter activity yet.
                  </div>
                )}
              </div>
            </section>
          )}

          {/* AI Picks Preview */}
          {recommendations && recommendations.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-chart-4" />
                  <h2 className="font-display text-xl font-bold">
                    AI Recommendations
                  </h2>
                </div>
                <Link to="/ai-agent">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-muted-foreground hover:text-foreground"
                    data-ocid="ai-recs-more-btn"
                  >
                    More picks <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {recommendations.slice(0, 3).map((rec, i) => (
                  <motion.div
                    key={rec.mangaDexId}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-smooth"
                    data-ocid="ai-rec-card"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-display font-semibold text-sm text-foreground line-clamp-1">
                        {rec.title}
                      </h4>
                      <Badge className="ml-2 shrink-0 bg-chart-4/15 text-chart-4 border-chart-4/20 text-xs">
                        {Math.round(rec.matchScore * 100)}%
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs line-clamp-2">
                      {rec.reason}
                    </p>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Bot Panel Sidebar */}
        <div className="xl:sticky xl:top-20 xl:self-start">
          <BotCommandPanel />
        </div>
      </div>
    </div>
  );
}
