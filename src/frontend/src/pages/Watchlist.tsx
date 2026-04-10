import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@tanstack/react-router";
import { BookOpen, Edit3, ListFilter, SortAsc, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { WatchlistCardSkeleton } from "../components/LoadingSpinner";
import { ContentTypeBadge, StatusBadge } from "../components/StatusBadge";
import {
  useRemoveFromWatchlist,
  useUpdateReadingProgress,
  useWatchlist,
} from "../hooks/useQueries";
import type { WatchlistEntry } from "../types";
import { ReadingStatus } from "../types";

type FilterTab = "all" | ReadingStatus;
type SortKey = "title" | "dateAdded" | "lastUpdated";

const FILTER_TABS: { label: string; value: FilterTab }[] = [
  { label: "All", value: "all" },
  { label: "Reading", value: ReadingStatus.reading },
  { label: "Plan to Read", value: ReadingStatus.planToRead },
  { label: "Completed", value: ReadingStatus.completed },
  { label: "Dropped", value: ReadingStatus.dropped },
];

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: "Title", value: "title" },
  { label: "Date Added", value: "dateAdded" },
  { label: "Last Updated", value: "lastUpdated" },
];

function sortEntries(
  entries: WatchlistEntry[],
  key: SortKey,
): WatchlistEntry[] {
  return [...entries].sort((a, b) => {
    if (key === "title") return a.title.localeCompare(b.title);
    if (key === "dateAdded") return Number(b.addedAt - a.addedAt);
    return Number(b.updatedAt - a.updatedAt);
  });
}

function EditProgressDialog({
  entry,
  open,
  onClose,
}: {
  entry: WatchlistEntry;
  open: boolean;
  onClose: () => void;
}) {
  const [chapters, setChapters] = useState(
    Number(entry.chaptersRead).toString(),
  );
  const [status, setStatus] = useState<ReadingStatus>(entry.readingStatus);
  const updateProgress = useUpdateReadingProgress();

  function handleSave() {
    const parsed = Number.parseInt(chapters, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      toast.error("Enter a valid chapter number");
      return;
    }
    updateProgress.mutate(
      { mangaDexId: entry.mangaDexId, chaptersRead: BigInt(parsed), status },
      {
        onSuccess: () => {
          toast.success("Progress updated");
          onClose();
        },
        onError: () => toast.error("Failed to update progress"),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground line-clamp-1">
            Edit: {entry.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-sm text-muted-foreground mb-1.5 block">
              Chapters Read
            </Label>
            <Input
              type="number"
              min={0}
              value={chapters}
              onChange={(e) => setChapters(e.target.value)}
              className="bg-muted/40 border-border focus:border-primary"
              data-ocid="edit-chapters-input"
            />
            {entry.lastKnownChapter > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Total known chapters: {entry.lastKnownChapter}
              </p>
            )}
          </div>
          <div>
            <Label className="text-sm text-muted-foreground mb-1.5 block">
              Reading Status
            </Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as ReadingStatus)}
            >
              <SelectTrigger
                className="bg-muted/40 border-border"
                data-ocid="edit-status-select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value={ReadingStatus.reading}>Reading</SelectItem>
                <SelectItem value={ReadingStatus.planToRead}>
                  Plan to Read
                </SelectItem>
                <SelectItem value={ReadingStatus.completed}>
                  Completed
                </SelectItem>
                <SelectItem value={ReadingStatus.dropped}>Dropped</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1 border-border"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSave}
              disabled={updateProgress.isPending}
              data-ocid="edit-progress-save-btn"
            >
              {updateProgress.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WatchlistRow({
  entry,
  onEdit,
}: {
  entry: WatchlistEntry;
  onEdit: (entry: WatchlistEntry) => void;
}) {
  const remove = useRemoveFromWatchlist();
  const progress =
    entry.lastKnownChapter > 0
      ? Math.min(
          100,
          (Number(entry.chaptersRead) / entry.lastKnownChapter) * 100,
        )
      : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25 }}
    >
      <Card
        className="bg-card border-border hover:border-primary/30 transition-smooth p-4"
        data-ocid="watchlist-row"
      >
        <div className="flex gap-4 items-start">
          {/* Cover */}
          <Link
            to="/series/$mangaDexId"
            params={{ mangaDexId: entry.mangaDexId }}
            className="shrink-0"
          >
            <div className="w-14 h-[72px] rounded-lg bg-muted flex items-center justify-center overflow-hidden">
              <BookOpen className="w-6 h-6 text-muted-foreground/60" />
            </div>
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <Link
                to="/series/$mangaDexId"
                params={{ mangaDexId: entry.mangaDexId }}
              >
                <h3 className="font-display font-semibold text-sm text-foreground hover:text-primary transition-colors line-clamp-1 leading-snug">
                  {entry.title}
                </h3>
              </Link>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => onEdit(entry)}
                  aria-label="Edit progress"
                  data-ocid="watchlist-edit-btn"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      aria-label="Remove from watchlist"
                      data-ocid="watchlist-remove-btn"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border max-w-sm">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-display text-foreground">
                        Remove from watchlist?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground">
                        <span className="font-medium text-foreground">
                          "{entry.title}"
                        </span>{" "}
                        will be removed and your progress lost.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-border bg-muted/40 hover:bg-muted">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() =>
                          remove.mutate(entry.mangaDexId, {
                            onSuccess: () =>
                              toast.success(`Removed "${entry.title}"`),
                            onError: () =>
                              toast.error("Failed to remove entry"),
                          })
                        }
                        data-ocid="watchlist-confirm-remove-btn"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <ContentTypeBadge type={entry.contentType} />
              <StatusBadge status={entry.readingStatus} />
              <span className="text-xs font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                Ch.{" "}
                <span className="text-foreground font-semibold">
                  {Number(entry.chaptersRead)}
                </span>
                {entry.lastKnownChapter > 0 && (
                  <span> / {entry.lastKnownChapter}</span>
                )}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-2.5 h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function Watchlist() {
  const { data: watchlist, isLoading } = useWatchlist();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [sortKey, setSortKey] = useState<SortKey>("lastUpdated");
  const [editTarget, setEditTarget] = useState<WatchlistEntry | null>(null);

  const filtered =
    activeFilter === "all"
      ? (watchlist ?? [])
      : (watchlist ?? []).filter((e) => e.readingStatus === activeFilter);

  const sorted = sortEntries(filtered, sortKey);

  const counts: Record<FilterTab, number> = {
    all: watchlist?.length ?? 0,
    [ReadingStatus.reading]:
      watchlist?.filter((e) => e.readingStatus === ReadingStatus.reading)
        .length ?? 0,
    [ReadingStatus.planToRead]:
      watchlist?.filter((e) => e.readingStatus === ReadingStatus.planToRead)
        .length ?? 0,
    [ReadingStatus.completed]:
      watchlist?.filter((e) => e.readingStatus === ReadingStatus.completed)
        .length ?? 0,
    [ReadingStatus.dropped]:
      watchlist?.filter((e) => e.readingStatus === ReadingStatus.dropped)
        .length ?? 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <ListFilter className="w-5 h-5 text-primary" />
              <h1 className="font-display text-xl font-bold text-foreground">
                My Watchlist
              </h1>
              {watchlist && (
                <span className="text-xs bg-primary/15 text-primary border border-primary/25 px-2 py-0.5 rounded-full font-medium ml-1">
                  {watchlist.length}
                </span>
              )}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 shrink-0">
              <SortAsc className="w-4 h-4 text-muted-foreground hidden sm:block" />
              <Select
                value={sortKey}
                onValueChange={(v) => setSortKey(v as SortKey)}
              >
                <SelectTrigger
                  className="bg-muted/40 border-border h-8 text-xs w-[140px]"
                  data-ocid="watchlist-sort-select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-sm"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter tabs */}
          <Tabs
            value={activeFilter}
            onValueChange={(v) => setActiveFilter(v as FilterTab)}
          >
            <TabsList
              className="bg-muted/40 border border-border h-9 gap-1 flex-wrap w-full justify-start"
              data-ocid="watchlist-filter-tabs"
            >
              {FILTER_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-7 px-3"
                >
                  {tab.label}
                  <span className="ml-1.5 text-[10px] opacity-70">
                    {counts[tab.value]}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-3">
            {["ws0", "ws1", "ws2", "ws3", "ws4"].map((k) => (
              <WatchlistCardSkeleton key={k} />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-muted/20 border border-border rounded-2xl py-16 text-center"
            data-ocid="watchlist-empty-state"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              {activeFilter === "all"
                ? "Your watchlist is empty"
                : `No ${activeFilter} titles`}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              {activeFilter === "all"
                ? "Discover manga, manhwa, and comics to add to your list"
                : "Switch to another filter or add more titles"}
            </p>
            <Link to="/discover">
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth"
                data-ocid="watchlist-discover-btn"
              >
                Browse Titles
              </Button>
            </Link>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {sorted.map((entry) => (
                <WatchlistRow
                  key={entry.mangaDexId}
                  entry={entry}
                  onEdit={setEditTarget}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Edit dialog */}
      {editTarget && (
        <EditProgressDialog
          entry={editTarget}
          open={true}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
