import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams, useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  RefreshCw,
  Star,
  TrendingUp,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { SiWhatsapp } from "react-icons/si";
import { toast } from "sonner";
import { ContentTypeBadge, StatusBadge } from "../components/StatusBadge";
import {
  useAddToWatchlist,
  useFetchMangaMeta,
  useMangaDetails,
  useUpdateReadingProgress,
  useWatchlist,
} from "../hooks/useQueries";
import type { ContentType, MangaMeta, WatchlistEntry } from "../types";
import { ReadingStatus } from "../types";

// ── helpers ──────────────────────────────────────────────────────────────────

function statusLabel(s: ReadingStatus): string {
  const labels: Record<ReadingStatus, string> = {
    [ReadingStatus.reading]: "Reading",
    [ReadingStatus.planToRead]: "Plan to Read",
    [ReadingStatus.dropped]: "Dropped",
    [ReadingStatus.completed]: "Completed",
  };
  return labels[s];
}

function buildWhatsAppText(meta: MangaMeta, entry?: WatchlistEntry): string {
  const lines: string[] = [
    `📖 *${meta.title}*`,
    `Type: ${meta.contentType.charAt(0).toUpperCase() + meta.contentType.slice(1)}`,
    `Status: ${meta.status}`,
    `Author: ${meta.author}`,
  ];
  if (meta.artist && meta.artist !== meta.author) {
    lines.push(`Artist: ${meta.artist}`);
  }
  lines.push(`Rating: ⭐ ${meta.rating.toFixed(1)}/10`);
  if (meta.genres.length > 0) {
    lines.push(`Genres: ${meta.genres.slice(0, 5).join(", ")}`);
  }
  lines.push("");
  if (meta.description) {
    const desc =
      meta.description.length > 220
        ? `${meta.description.slice(0, 220)}…`
        : meta.description;
    lines.push(desc);
  }
  if (entry) {
    lines.push(
      `\n📊 My progress: Ch. ${Number(entry.chaptersRead)} — ${statusLabel(entry.readingStatus)}`,
    );
  }
  lines.push("");
  lines.push("Tracked via MihonBot 🤖");
  return lines.join("\n");
}

// ── skeleton ──────────────────────────────────────────────────────────────────

function SeriesDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-8">
      <Skeleton className="h-8 w-24 rounded-lg" />
      <div className="flex flex-col sm:flex-row gap-6 md:gap-10">
        <Skeleton className="w-40 md:w-56 aspect-[2/3] shrink-0 rounded-xl" />
        <div className="flex-1 space-y-4 pt-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-9 w-36 rounded-lg" />
            <Skeleton className="h-9 w-40 rounded-lg" />
          </div>
        </div>
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}

// ── star rating ───────────────────────────────────────────────────────────────

const STAR_SLOTS = ["s1", "s2", "s3", "s4", "s5"] as const;

function StarRating({ rating }: { rating: number }) {
  const filled = Math.round(rating / 2);
  return (
    <div className="flex items-center gap-1">
      {STAR_SLOTS.map((id, i) => (
        <Star
          key={id}
          className={`w-4 h-4 ${i < filled ? "fill-chart-1 text-chart-1" : "text-border"}`}
        />
      ))}
      <span className="text-sm text-muted-foreground ml-1">
        {rating.toFixed(1)}/10
      </span>
    </div>
  );
}

// ── chapter grid ──────────────────────────────────────────────────────────────

function ChapterGrid({
  total,
  chaptersRead,
}: { total: number; chaptersRead: number }) {
  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No chapter data available yet.
      </p>
    );
  }
  const limit = Math.min(total, 40);
  const chapters = Array.from({ length: limit }, (_, i) => total - i);
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-1.5">
      {chapters.map((ch) => {
        const isRead = ch <= chaptersRead;
        return (
          <div
            key={`ch-${ch}`}
            data-ocid={`chapter-chip-${ch}`}
            className={`text-xs font-mono rounded-lg py-2 text-center border transition-smooth ${
              isRead
                ? "bg-primary/15 border-primary/30 text-primary"
                : "bg-muted/40 border-border text-muted-foreground"
            }`}
          >
            {ch}
          </div>
        );
      })}
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function SeriesDetail() {
  const { mangaDexId } = useParams({ from: "/series/$mangaDexId" });
  const router = useRouter();

  const { data: meta, isLoading } = useMangaDetails(mangaDexId);
  const fetchMeta = useFetchMangaMeta(mangaDexId);
  const { data: watchlist } = useWatchlist();
  const addToWatchlist = useAddToWatchlist();
  const updateProgress = useUpdateReadingProgress();

  const watchlistEntry = watchlist?.find((e) => e.mangaDexId === mangaDexId);
  const inWatchlist = !!watchlistEntry;

  const [selectedStatus, setSelectedStatus] = useState<ReadingStatus>(
    ReadingStatus.planToRead,
  );
  const [chaptersRead, setChaptersRead] = useState(0);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (watchlistEntry) {
      setSelectedStatus(watchlistEntry.readingStatus);
      setChaptersRead(Number(watchlistEntry.chaptersRead));
    }
  }, [watchlistEntry]);

  useEffect(() => {
    if (!isLoading && !meta) {
      fetchMeta.mutate();
    }
  }, [isLoading, meta, fetchMeta.mutate]);

  const handleAddToWatchlist = () => {
    if (!meta) return;
    addToWatchlist.mutate(
      {
        mangaDexId,
        title: meta.title,
        contentType: meta.contentType as ContentType,
        chaptersRead: BigInt(chaptersRead),
        readingStatus: selectedStatus,
        lastKnownChapter: 0,
        addedAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      },
      {
        onSuccess: () => toast.success(`"${meta.title}" added to watchlist!`),
        onError: () => toast.error("Failed to add to watchlist."),
      },
    );
  };

  const handleUpdateProgress = () => {
    updateProgress.mutate(
      {
        mangaDexId,
        chaptersRead: BigInt(chaptersRead),
        status: selectedStatus,
      },
      {
        onSuccess: () => toast.success("Progress updated!"),
        onError: () => toast.error("Failed to update progress."),
      },
    );
  };

  const handleShareWhatsApp = () => {
    if (!meta) return;
    const text = buildWhatsAppText(meta, watchlistEntry);
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleRefresh = () => {
    fetchMeta.mutate(undefined, {
      onSuccess: () => toast.success("Metadata refreshed"),
      onError: () => toast.error("Failed to refresh metadata"),
    });
  };

  if (isLoading || (!meta && fetchMeta.isPending)) {
    return <SeriesDetailSkeleton />;
  }

  if (!meta) {
    return (
      <div
        className="max-w-5xl mx-auto p-8 text-center space-y-4"
        data-ocid="series-not-found"
      >
        <BookOpen className="w-16 h-16 text-muted-foreground mx-auto" />
        <h2 className="font-display text-xl font-bold">
          Series data not found
        </h2>
        <p className="text-muted-foreground text-sm">
          Metadata hasn't been loaded yet.
        </p>
        <div className="flex gap-2 justify-center">
          <Button
            onClick={handleRefresh}
            disabled={fetchMeta.isPending}
            className="gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${fetchMeta.isPending ? "animate-spin" : ""}`}
            />
            Fetch from MangaDex
          </Button>
          <Button
            variant="outline"
            onClick={() => router.history.back()}
            data-ocid="back-btn-notfound"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const totalChapters = watchlistEntry?.lastKnownChapter ?? 0;
  const progress =
    totalChapters > 0 ? Math.min(100, (chaptersRead / totalChapters) * 100) : 0;
  const statusOngoing = meta.status.toLowerCase() === "ongoing";
  const statusCompleted = meta.status.toLowerCase() === "completed";

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-8 pb-16">
      {/* back */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.history.back()}
          className="text-muted-foreground hover:text-foreground -ml-2 gap-1.5"
          data-ocid="back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </motion.div>

      {/* hero */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col sm:flex-row gap-6 md:gap-10"
      >
        {/* cover */}
        <div className="shrink-0 self-start">
          <div className="relative w-40 md:w-56 aspect-[2/3] rounded-xl overflow-hidden border border-border shadow-elevated">
            {meta.coverImageUrl && !imgError ? (
              <img
                src={meta.coverImageUrl}
                alt={meta.title}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            {inWatchlist && (
              <div className="absolute top-2 right-2 bg-primary rounded-full p-1 shadow-subtle">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* metadata */}
        <div className="flex-1 space-y-3 min-w-0">
          <h1
            className="font-display text-2xl md:text-3xl font-bold leading-tight text-foreground break-words"
            data-ocid="series-title"
          >
            {meta.title}
          </h1>

          {/* type + status badges */}
          <div className="flex flex-wrap gap-2 items-center">
            <ContentTypeBadge type={meta.contentType as ContentType} />
            <Badge
              variant="outline"
              className={`text-xs gap-1 ${
                statusOngoing
                  ? "border-chart-2/40 text-chart-2 bg-chart-2/10"
                  : statusCompleted
                    ? "border-chart-3/40 text-chart-3 bg-chart-3/10"
                    : "border-border text-muted-foreground"
              }`}
              data-ocid="series-pub-status"
            >
              <TrendingUp className="w-3 h-3" />
              {meta.status}
            </Badge>
          </div>

          {/* rating */}
          <StarRating rating={meta.rating} />

          {/* author / artist */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <User className="w-3.5 h-3.5 shrink-0" />
              <span>
                <span className="text-foreground/70">Author:</span>{" "}
                {meta.author}
              </span>
            </div>
            {meta.artist && meta.artist !== meta.author && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <User className="w-3.5 h-3.5 shrink-0" />
                <span>
                  <span className="text-foreground/70">Artist:</span>{" "}
                  {meta.artist}
                </span>
              </div>
            )}
          </div>

          {/* genres */}
          {meta.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5" data-ocid="genres-list">
              {meta.genres.slice(0, 8).map((genre) => (
                <span
                  key={genre}
                  className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* action buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={
                inWatchlist ? handleUpdateProgress : handleAddToWatchlist
              }
              disabled={addToWatchlist.isPending || updateProgress.isPending}
              data-ocid={
                inWatchlist ? "update-progress-btn" : "add-watchlist-btn"
              }
            >
              {inWatchlist ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Update Progress
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  Add to Watchlist
                </>
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10 hover:border-[#25D366]/70"
              onClick={handleShareWhatsApp}
              data-ocid="share-whatsapp-btn"
            >
              <SiWhatsapp className="w-4 h-4" />
              Share to WhatsApp
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={handleRefresh}
              disabled={fetchMeta.isPending}
              data-ocid="refresh-meta-btn"
            >
              <RefreshCw
                className={`w-4 h-4 ${fetchMeta.isPending ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </motion.section>

      <Separator />

      {/* synopsis */}
      {meta.description && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="space-y-3"
        >
          <h2 className="font-display text-lg font-semibold text-foreground">
            Synopsis
          </h2>
          <div className="bg-card border border-border rounded-xl p-4 md:p-5">
            <p
              className="text-sm text-muted-foreground leading-relaxed"
              data-ocid="series-synopsis"
            >
              {meta.description}
            </p>
          </div>
        </motion.section>
      )}

      {/* reading progress & status */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="bg-card border border-border rounded-xl p-4 md:p-5 space-y-4"
      >
        <h2 className="font-display text-lg font-semibold text-foreground">
          My Progress
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* chapters input */}
          <div className="space-y-2">
            <label
              htmlFor="chapters-read"
              className="text-xs text-muted-foreground uppercase tracking-wide"
            >
              Chapters Read
            </label>
            <div className="flex items-center gap-2">
              <input
                id="chapters-read"
                type="number"
                min={0}
                max={totalChapters > 0 ? totalChapters : undefined}
                value={chaptersRead}
                onChange={(e) =>
                  setChaptersRead(Math.max(0, Number(e.target.value)))
                }
                className="w-24 bg-muted border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                data-ocid="chapters-read-input"
              />
              {totalChapters > 0 && (
                <span className="text-sm text-muted-foreground font-mono">
                  / {totalChapters}
                </span>
              )}
            </div>
            {totalChapters > 0 && (
              <div className="mt-1 space-y-1">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                    data-ocid="progress-bar"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(progress)}% complete
                </p>
              </div>
            )}
          </div>

          {/* status selector */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Reading Status
            </p>
            <Select
              value={selectedStatus}
              onValueChange={(v) => setSelectedStatus(v as ReadingStatus)}
            >
              <SelectTrigger
                className="bg-muted border-input"
                data-ocid="reading-status-select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ReadingStatus.reading}>
                  <StatusBadge status={ReadingStatus.reading} />
                </SelectItem>
                <SelectItem value={ReadingStatus.planToRead}>
                  <StatusBadge status={ReadingStatus.planToRead} />
                </SelectItem>
                <SelectItem value={ReadingStatus.completed}>
                  <StatusBadge status={ReadingStatus.completed} />
                </SelectItem>
                <SelectItem value={ReadingStatus.dropped}>
                  <StatusBadge status={ReadingStatus.dropped} />
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.section>

      {/* chapter list */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Chapters
          </h2>
          {totalChapters > 0 && (
            <span className="text-xs text-muted-foreground font-mono">
              {totalChapters} known
            </span>
          )}
        </div>
        <div
          className="bg-card border border-border rounded-xl p-4 md:p-5"
          data-ocid="chapter-list"
        >
          <ChapterGrid total={totalChapters} chaptersRead={chaptersRead} />
          {totalChapters > 40 && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Showing latest 40 of {totalChapters} chapters
            </p>
          )}
        </div>
      </motion.section>
    </div>
  );
}
