import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { BookOpen, Plus, Star } from "lucide-react";
import type { MangaSearchResult, WatchlistEntry } from "../types";
import { ContentType } from "../types";

const CONTENT_TYPE_COLORS: Record<ContentType, string> = {
  [ContentType.manga]: "bg-primary/20 text-primary border-primary/30",
  [ContentType.manhwa]: "bg-accent/20 text-accent border-accent/30",
  [ContentType.comics]: "bg-chart-3/20 text-chart-3 border-chart-3/30",
};

interface MangaCardProps {
  manga: MangaSearchResult;
  onAddToWatchlist?: (manga: MangaSearchResult) => void;
  isInWatchlist?: boolean;
  compact?: boolean;
}

export function MangaCard({
  manga,
  onAddToWatchlist,
  isInWatchlist,
  compact = false,
}: MangaCardProps) {
  return (
    <div
      className={`group relative bg-card border border-border rounded-xl overflow-hidden transition-smooth hover:border-primary/40 hover:shadow-elevated ${
        compact ? "flex gap-3 p-3" : ""
      }`}
      data-ocid="manga-card"
    >
      {/* Cover Image */}
      <Link
        to="/series/$mangaDexId"
        params={{ mangaDexId: manga.mangaDexId }}
        className={compact ? "shrink-0" : "block"}
      >
        <div
          className={`bg-muted relative overflow-hidden ${
            compact ? "w-16 h-20 rounded-lg" : "w-full aspect-[2/3]"
          }`}
        >
          {manga.coverImageUrl ? (
            <img
              src={manga.coverImageUrl}
              alt={manga.title}
              className="w-full h-full object-cover transition-smooth group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          {!compact && (
            <div className="absolute top-2 left-2">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full border ${CONTENT_TYPE_COLORS[manga.contentType]}`}
              >
                {manga.contentType}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div
        className={
          compact ? "flex-1 min-w-0 flex flex-col justify-between" : "p-3"
        }
      >
        <div>
          <Link
            to="/series/$mangaDexId"
            params={{ mangaDexId: manga.mangaDexId }}
          >
            <h3
              className={`font-display font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 ${
                compact ? "text-sm" : "text-base mb-1"
              }`}
            >
              {manga.title}
            </h3>
          </Link>
          {!compact && (
            <p className="text-muted-foreground text-xs line-clamp-2 mb-2">
              {manga.description}
            </p>
          )}
          <div className={`flex flex-wrap gap-1 ${compact ? "mt-1" : "mb-3"}`}>
            {compact && (
              <span
                className={`text-xs font-medium px-1.5 py-0.5 rounded-full border ${CONTENT_TYPE_COLORS[manga.contentType]}`}
              >
                {manga.contentType}
              </span>
            )}
            {manga.genres.slice(0, compact ? 1 : 2).map((g) => (
              <Badge
                key={g}
                variant="secondary"
                className="text-xs px-1.5 py-0 h-5"
              >
                {g}
              </Badge>
            ))}
          </div>
        </div>

        <div
          className={`flex items-center justify-between ${compact ? "" : "mt-auto"}`}
        >
          <div className="flex items-center gap-1 text-chart-4">
            <Star className="w-3 h-3 fill-current" />
            <span className="text-xs text-muted-foreground">
              {manga.rating.toFixed(1)}
            </span>
          </div>
          {onAddToWatchlist && (
            <Button
              size="icon"
              variant={isInWatchlist ? "secondary" : "default"}
              className="h-7 w-7"
              onClick={(e) => {
                e.preventDefault();
                onAddToWatchlist(manga);
              }}
              aria-label={
                isInWatchlist ? "Already in watchlist" : "Add to watchlist"
              }
              data-ocid="manga-card-add-btn"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface WatchlistCardProps {
  entry: WatchlistEntry;
  onRemove?: (id: string) => void;
}

export function WatchlistCard({ entry }: WatchlistCardProps) {
  const statusColors: Record<string, string> = {
    reading: "bg-accent/20 text-accent border-accent/30",
    completed: "bg-chart-3/20 text-chart-3 border-chart-3/30",
    dropped: "bg-destructive/20 text-destructive border-destructive/30",
    planToRead: "bg-muted text-muted-foreground border-border",
  };

  const progress =
    entry.lastKnownChapter > 0
      ? Math.min(
          100,
          (Number(entry.chaptersRead) / entry.lastKnownChapter) * 100,
        )
      : 0;

  return (
    <div
      className="bg-card border border-border rounded-xl p-3 flex gap-3 hover:border-primary/30 transition-smooth"
      data-ocid="watchlist-card"
    >
      <div className="w-14 h-18 rounded-lg bg-muted shrink-0 flex items-center justify-center overflow-hidden">
        <BookOpen className="w-6 h-6 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <Link
          to="/series/$mangaDexId"
          params={{ mangaDexId: entry.mangaDexId }}
        >
          <h4 className="font-display font-semibold text-sm text-foreground hover:text-primary transition-colors line-clamp-1">
            {entry.title}
          </h4>
        </Link>
        <p className="text-muted-foreground text-xs mt-0.5">
          Ch. {entry.chaptersRead.toString()} / {entry.lastKnownChapter || "?"}
        </p>
        <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-smooth"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[entry.readingStatus] ?? "bg-muted text-muted-foreground"}`}
          >
            {entry.readingStatus}
          </span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded ${CONTENT_TYPE_COLORS[entry.contentType]}`}
          >
            {entry.contentType}
          </span>
        </div>
      </div>
    </div>
  );
}
