import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Brain, Plus, RefreshCw, Sparkles, Star } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useAddToWatchlist,
  useAiRecommendations,
  useRecommendationProfile,
  useRefreshAiRecommendations,
  useUpdateRecommendationProfile,
} from "../hooks/useQueries";
import type { AiRecommendation, RecommendationProfile } from "../types";
import { ContentType, ReadingStatus } from "../types";

const GENRE_OPTIONS = [
  "Action",
  "Romance",
  "Fantasy",
  "Horror",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Mystery",
];

function RecommendationCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Skeleton className="w-full aspect-[2/3]" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <div className="flex items-center justify-between mt-3">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function MatchScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const colorClass =
    pct >= 85
      ? "bg-chart-3/20 text-chart-3 border-chart-3/40"
      : pct >= 70
        ? "bg-accent/20 text-accent border-accent/40"
        : "bg-primary/20 text-primary border-primary/40";
  return (
    <span
      className={`text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${colorClass}`}
    >
      <Star className="w-3 h-3 fill-current" />
      {pct}% match
    </span>
  );
}

function RecommendationCard({
  rec,
  index,
}: {
  rec: AiRecommendation;
  index: number;
}) {
  const addToWatchlist = useAddToWatchlist();

  function handleAdd() {
    const now = BigInt(Date.now()) * 1_000_000n;
    addToWatchlist.mutate(
      {
        mangaDexId: rec.mangaDexId,
        title: rec.title,
        contentType: ContentType.manga,
        readingStatus: ReadingStatus.planToRead,
        chaptersRead: 0n,
        lastKnownChapter: 0,
        addedAt: now,
        updatedAt: now,
      },
      {
        onSuccess: () => toast.success(`Added "${rec.title}" to watchlist`),
        onError: () => toast.error("Failed to add to watchlist"),
      },
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
    >
      <Card className="group bg-card border-border hover:border-primary/40 transition-smooth overflow-hidden h-full flex flex-col">
        {/* Cover placeholder */}
        <div className="relative w-full aspect-[2/3] bg-muted overflow-hidden">
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-secondary">
            <BookOpen className="w-12 h-12 text-muted-foreground/50" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-2 left-2">
            <MatchScoreBadge score={rec.matchScore} />
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1 gap-2">
          <h3 className="font-display font-bold text-foreground text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {rec.title}
          </h3>
          <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3 flex-1">
            {rec.reason}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-auto border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground transition-smooth"
            onClick={handleAdd}
            disabled={addToWatchlist.isPending}
            data-ocid="rec-add-watchlist-btn"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add to Watchlist
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

export default function AiAgent() {
  const { data: recommendations, isLoading: recsLoading } =
    useAiRecommendations();
  const { data: profile, isLoading: profileLoading } =
    useRecommendationProfile();
  const refreshRecs = useRefreshAiRecommendations();
  const updateProfile = useUpdateRecommendationProfile();

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [patternNotes, setPatternNotes] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  useEffect(() => {
    if (profile) {
      setSelectedGenres(profile.preferredGenres);
      setPatternNotes(profile.readingPatternNotes);
      if (profile.lastRecommendedAt > 0n) {
        setLastRefreshed(
          new Date(Number(profile.lastRecommendedAt) / 1_000_000),
        );
      }
    }
  }, [profile]);

  function toggleGenre(genre: string) {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    );
  }

  function handleSaveProfile() {
    const base: RecommendationProfile = profile ?? {
      preferredGenres: [],
      readingPatternNotes: "",
      lastRecommendedAt: 0n,
      pastRecommendations: [],
    };
    updateProfile.mutate(
      {
        ...base,
        preferredGenres: selectedGenres,
        readingPatternNotes: patternNotes,
      },
      {
        onSuccess: () => toast.success("Profile saved!"),
        onError: () => toast.error("Failed to save profile"),
      },
    );
  }

  function handleRefresh() {
    refreshRecs.mutate(undefined, {
      onSuccess: () => {
        setLastRefreshed(new Date());
        toast.success("Recommendations refreshed by AI!");
      },
      onError: () => toast.error("Failed to refresh recommendations"),
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                AI Agent
              </h1>
              <p className="text-muted-foreground text-sm">
                Personalized recommendations powered by your reading patterns
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Profile setup */}
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="font-display text-lg font-semibold text-foreground">
              Profile Setup
            </h2>
          </div>

          <Card className="bg-card border-border p-6 space-y-6">
            {/* Genre checkboxes */}
            <div>
              <Label className="text-sm font-medium text-foreground mb-3 block">
                Preferred Genres
              </Label>
              {profileLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {GENRE_OPTIONS.map((g) => (
                    <Skeleton key={g} className="h-9 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div
                  className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                  data-ocid="genre-checklist"
                >
                  {GENRE_OPTIONS.map((genre) => (
                    <label
                      key={genre}
                      htmlFor={`genre-${genre}`}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-smooth
                        ${
                          selectedGenres.includes(genre)
                            ? "bg-primary/10 border-primary/40 text-primary"
                            : "bg-muted/40 border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                        }`}
                    >
                      <Checkbox
                        id={`genre-${genre}`}
                        checked={selectedGenres.includes(genre)}
                        onCheckedChange={() => toggleGenre(genre)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        data-ocid={`genre-check-${genre.toLowerCase().replace(/\s/g, "-")}`}
                      />
                      <span className="text-sm font-medium">{genre}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Reading pattern notes */}
            <div>
              <Label
                htmlFor="pattern-notes"
                className="text-sm font-medium text-foreground mb-2 block"
              >
                Reading Pattern Notes
              </Label>
              <Textarea
                id="pattern-notes"
                placeholder="Describe your tastes... e.g. 'I love slow-burn romance with strong female leads, epic fantasy battles, and dark psychological thrillers. I prefer completed series.'"
                className="min-h-28 bg-muted/40 border-border focus:border-primary resize-none text-sm"
                value={patternNotes}
                onChange={(e) => setPatternNotes(e.target.value)}
                data-ocid="pattern-notes-input"
              />
              <p className="text-muted-foreground text-xs mt-1.5">
                The more detail you provide, the better the AI recommendations
              </p>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={updateProfile.isPending || profileLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth"
              data-ocid="save-profile-btn"
            >
              {updateProfile.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </Card>
        </motion.section>

        {/* Recommendations section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-accent" />
              <h2 className="font-display text-lg font-semibold text-foreground">
                AI Recommendations
              </h2>
              {recommendations && recommendations.length > 0 && (
                <span className="text-xs bg-accent/20 text-accent border border-accent/30 px-2 py-0.5 rounded-full font-medium">
                  {recommendations.length} picks
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {lastRefreshed && (
                <span className="text-xs text-muted-foreground hidden sm:block">
                  Last refreshed:{" "}
                  {lastRefreshed.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
              <Button
                size="sm"
                variant="outline"
                className="border-accent/40 text-accent hover:bg-accent hover:text-accent-foreground transition-smooth"
                onClick={handleRefresh}
                disabled={refreshRecs.isPending}
                data-ocid="refresh-recs-btn"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 mr-1.5 ${refreshRecs.isPending ? "animate-spin" : ""}`}
                />
                {refreshRecs.isPending ? "Generating…" : "Refresh"}
              </Button>
            </div>
          </div>

          {recsLoading || refreshRecs.isPending ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {["sk0", "sk1", "sk2", "sk3", "sk4", "sk5"].map((k) => (
                <RecommendationCardSkeleton key={k} />
              ))}
            </div>
          ) : recommendations && recommendations.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {recommendations.slice(0, 6).map((rec, i) => (
                <RecommendationCard key={rec.mangaDexId} rec={rec} index={i} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-muted/30 border border-border rounded-2xl p-12 text-center"
              data-ocid="recs-empty-state"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                No recommendations yet
              </h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                Set up your profile with genres and reading notes, then let the
                AI generate personalized picks just for you.
              </p>
              <Button
                onClick={handleRefresh}
                className="bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth"
                data-ocid="recs-empty-refresh-btn"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Recommendations
              </Button>
            </motion.div>
          )}
        </motion.section>
      </div>
    </div>
  );
}
