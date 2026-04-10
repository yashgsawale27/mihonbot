import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Compass,
  Crown,
  Filter,
  Search,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { MangaCard } from "../components/MangaCard";
import { SearchInput } from "../components/SearchInput";
import {
  useAddToWatchlist,
  useMangaSearch,
  useTrending,
  useWatchlist,
} from "../hooks/useQueries";
import type { MangaSearchResult } from "../types";
import { ContentType, ReadingStatus } from "../types";

// ── Static sample data ──────────────────────────────────────────────────────

const SAMPLE_TRENDING: MangaSearchResult[] = [
  {
    mangaDexId: "chainsaw-man",
    title: "Chainsaw Man",
    coverImageUrl: "",
    description:
      "Denji lives in poverty, working as a devil hunter to pay back his father's debt to the yakuza.",
    genres: ["Action", "Horror"],
    contentType: ContentType.manga,
    status: "ongoing",
    author: "Tatsuki Fujimoto",
    artist: "Tatsuki Fujimoto",
    rating: 8.8,
  },
  {
    mangaDexId: "jujutsu-kaisen",
    title: "Jujutsu Kaisen",
    coverImageUrl: "",
    description:
      "A boy swallows a cursed talisman and joins a secret organization of Jujutsu Sorcerers.",
    genres: ["Action", "Supernatural"],
    contentType: ContentType.manga,
    status: "ongoing",
    author: "Gege Akutami",
    artist: "Gege Akutami",
    rating: 8.7,
  },
  {
    mangaDexId: "blue-lock",
    title: "Blue Lock",
    coverImageUrl: "",
    description:
      "300 strikers compete in a radical soccer program to become Japan's ace.",
    genres: ["Sports", "Action"],
    contentType: ContentType.manga,
    status: "ongoing",
    author: "Muneyuki Kaneshiro",
    artist: "Yusuke Nomura",
    rating: 8.7,
  },
  {
    mangaDexId: "tower-of-god",
    title: "Tower of God",
    coverImageUrl: "",
    description:
      "Twenty-Fifth Bam enters a mysterious tower to find his lost friend Rachel.",
    genres: ["Fantasy", "Adventure"],
    contentType: ContentType.manhwa,
    status: "ongoing",
    author: "SIU",
    artist: "SIU",
    rating: 8.6,
  },
  {
    mangaDexId: "omniscient-reader",
    title: "Omniscient Reader",
    coverImageUrl: "",
    description:
      "A man who read a web novel his whole life becomes its sole survivor.",
    genres: ["Fantasy", "Action"],
    contentType: ContentType.manhwa,
    status: "ongoing",
    author: "sing N song",
    artist: "Sleepy-C",
    rating: 9.2,
  },
  {
    mangaDexId: "lookism",
    title: "Lookism",
    coverImageUrl: "",
    description:
      "A bullied teenager discovers he can switch between two very different bodies.",
    genres: ["Drama", "Action"],
    contentType: ContentType.manhwa,
    status: "ongoing",
    author: "Park Tae-jun",
    artist: "Park Tae-jun",
    rating: 8.3,
  },
  {
    mangaDexId: "saga-comics",
    title: "Saga",
    coverImageUrl: "",
    description:
      "An epic space opera following two soldiers from warring races who fall in love.",
    genres: ["Sci-Fi", "Drama"],
    contentType: ContentType.comics,
    status: "ongoing",
    author: "Brian K. Vaughan",
    artist: "Fiona Staples",
    rating: 9.1,
  },
  {
    mangaDexId: "batman-year-one",
    title: "Batman: Year One",
    coverImageUrl: "",
    description:
      "The definitive origin story of Batman and his first year fighting crime in Gotham.",
    genres: ["Action", "Crime"],
    contentType: ContentType.comics,
    status: "completed",
    author: "Frank Miller",
    artist: "David Mazzucchelli",
    rating: 9.0,
  },
];

const SAMPLE_BESTSELLERS: MangaSearchResult[] = [
  {
    mangaDexId: "one-piece",
    title: "One Piece",
    coverImageUrl: "",
    description:
      "Monkey D. Luffy sets out on a journey to find the legendary treasure One Piece.",
    genres: ["Adventure", "Action"],
    contentType: ContentType.manga,
    status: "ongoing",
    author: "Eiichiro Oda",
    artist: "Eiichiro Oda",
    rating: 9.4,
  },
  {
    mangaDexId: "demon-slayer",
    title: "Demon Slayer",
    coverImageUrl: "",
    description:
      "Tanjiro Kamado trains to become a demon slayer after his family is slaughtered.",
    genres: ["Action", "Supernatural"],
    contentType: ContentType.manga,
    status: "completed",
    author: "Koyoharu Gotouge",
    artist: "Koyoharu Gotouge",
    rating: 8.5,
  },
  {
    mangaDexId: "solo-leveling",
    title: "Solo Leveling",
    coverImageUrl: "",
    description:
      "The weakest hunter in the world gains a power to level up alone — and becomes invincible.",
    genres: ["Action", "Fantasy"],
    contentType: ContentType.manhwa,
    status: "completed",
    author: "Chugong",
    artist: "DUBU (Redice Studio)",
    rating: 9.1,
  },
  {
    mangaDexId: "spy-x-family",
    title: "Spy x Family",
    coverImageUrl: "",
    description:
      "A spy must maintain a fake family to complete his mission — but his daughter can read minds.",
    genres: ["Comedy", "Action"],
    contentType: ContentType.manga,
    status: "ongoing",
    author: "Tatsuya Endo",
    artist: "Tatsuya Endo",
    rating: 8.9,
  },
  {
    mangaDexId: "sandman",
    title: "The Sandman",
    coverImageUrl: "",
    description:
      "Morpheus, the lord of dreams, is trapped for decades and must rebuild his realm.",
    genres: ["Fantasy", "Horror"],
    contentType: ContentType.comics,
    status: "completed",
    author: "Neil Gaiman",
    artist: "Various",
    rating: 9.5,
  },
  {
    mangaDexId: "god-of-highschool",
    title: "The God of High School",
    coverImageUrl: "",
    description:
      "A martial arts tournament that spans the supernatural as fighters battle for one wish.",
    genres: ["Action", "Martial Arts"],
    contentType: ContentType.manhwa,
    status: "completed",
    author: "Yongje Park",
    artist: "Yongje Park",
    rating: 8.4,
  },
];

// ── Filter config ────────────────────────────────────────────────────────────

const CONTENT_FILTERS: { label: string; value: ContentType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Manga", value: ContentType.manga },
  { label: "Manhwa", value: ContentType.manhwa },
  { label: "Comics", value: ContentType.comics },
];

// ── Skeleton grid ────────────────────────────────────────────────────────────

const SKELETON_KEYS = [
  "sk1",
  "sk2",
  "sk3",
  "sk4",
  "sk5",
  "sk6",
  "sk7",
  "sk8",
  "sk9",
  "sk10",
];

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {SKELETON_KEYS.map((k) => (
        <div
          key={k}
          className="bg-card border border-border rounded-xl overflow-hidden"
        >
          <Skeleton className="w-full aspect-[2/3]" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Rank badge styles ────────────────────────────────────────────────────────

const RANK_STYLES = [
  "bg-chart-4/90 text-background font-bold",
  "bg-muted-foreground/70 text-background font-bold",
  "bg-chart-5/70 text-background font-bold",
];

// ── Featured hero card (first 2 trending) ───────────────────────────────────

function FeaturedCard({
  manga,
  onAdd,
  isInWatchlist,
}: {
  manga: MangaSearchResult;
  onAdd: (m: MangaSearchResult) => void;
  isInWatchlist: boolean;
}) {
  return (
    <motion.div
      className="relative rounded-2xl overflow-hidden bg-card border border-border group cursor-pointer hover:border-primary/50 transition-smooth"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Link to="/series/$mangaDexId" params={{ mangaDexId: manga.mangaDexId }}>
        <div className="relative h-48 bg-gradient-to-br from-muted to-background overflow-hidden">
          {manga.coverImageUrl ? (
            <img
              src={manga.coverImageUrl}
              alt={manga.title}
              className="w-full h-full object-cover opacity-60 group-hover:opacity-75 group-hover:scale-105 transition-smooth"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
          <div className="absolute top-3 left-3">
            <Badge
              variant="secondary"
              className="gap-1 text-xs bg-primary/20 text-primary border-primary/30"
            >
              <TrendingUp className="w-3 h-3" />
              Trending
            </Badge>
          </div>
        </div>
      </Link>
      <div className="p-4">
        <Link
          to="/series/$mangaDexId"
          params={{ mangaDexId: manga.mangaDexId }}
        >
          <h3 className="font-display font-bold text-lg text-foreground hover:text-primary transition-colors line-clamp-1 mb-1">
            {manga.title}
          </h3>
        </Link>
        <p className="text-muted-foreground text-xs line-clamp-2 mb-3">
          {manga.description}
        </p>
        <div className="flex flex-wrap gap-1 mb-3">
          {manga.genres.slice(0, 2).map((g) => (
            <Badge key={g} variant="secondary" className="text-xs">
              {g}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-chart-4 text-chart-4" />
            <span className="text-sm font-semibold text-foreground">
              {manga.rating.toFixed(1)}
            </span>
          </div>
          <Button
            size="sm"
            variant={isInWatchlist ? "secondary" : "default"}
            className="gap-1.5 text-xs h-8"
            onClick={(e) => {
              e.preventDefault();
              onAdd(manga);
            }}
            disabled={isInWatchlist}
            data-ocid="featured-card-add-btn"
          >
            {isInWatchlist ? "In Watchlist" : "+ Watchlist"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Bestseller row item ──────────────────────────────────────────────────────

function BestsellerRow({
  manga,
  rank,
  onAdd,
  isInWatchlist,
}: {
  manga: MangaSearchResult;
  rank: number;
  onAdd: (m: MangaSearchResult) => void;
  isInWatchlist: boolean;
}) {
  const rankCls =
    rank <= 3 ? RANK_STYLES[rank - 1] : "bg-muted text-muted-foreground";

  return (
    <motion.div
      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-smooth group"
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: rank * 0.05 }}
      data-ocid="bestseller-row"
    >
      <span
        className={`text-sm min-w-[28px] text-center px-1.5 py-0.5 rounded-full font-mono ${rankCls}`}
      >
        {rank}
      </span>
      <div className="w-10 h-14 rounded-lg bg-muted shrink-0 overflow-hidden flex items-center justify-center">
        {manga.coverImageUrl ? (
          <img
            src={manga.coverImageUrl}
            alt={manga.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <BookOpen className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <Link
          to="/series/$mangaDexId"
          params={{ mangaDexId: manga.mangaDexId }}
        >
          <h4 className="font-display font-semibold text-sm text-foreground hover:text-primary transition-colors line-clamp-1">
            {manga.title}
          </h4>
        </Link>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{manga.author}</span>
          <span className="text-muted-foreground/40 text-xs">•</span>
          <div className="flex items-center gap-0.5">
            <Star className="w-3 h-3 fill-chart-4 text-chart-4" />
            <span className="text-xs text-muted-foreground">
              {manga.rating.toFixed(1)}
            </span>
          </div>
        </div>
        <div className="flex gap-1 mt-1">
          {manga.genres.slice(0, 2).map((g) => (
            <Badge
              key={g}
              variant="secondary"
              className="text-xs px-1.5 py-0 h-4"
            >
              {g}
            </Badge>
          ))}
        </div>
      </div>
      <Button
        size="sm"
        variant={isInWatchlist ? "ghost" : "outline"}
        className="shrink-0 h-8 text-xs"
        onClick={() => onAdd(manga)}
        disabled={isInWatchlist}
        data-ocid="bestseller-add-btn"
      >
        {isInWatchlist ? "✓" : "+ Add"}
      </Button>
    </motion.div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ query }: { query: string }) {
  return (
    <div
      className="text-center py-16 col-span-full"
      data-ocid="discover-empty-state"
    >
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        <Search className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="font-display font-semibold text-foreground mb-2">
        {query ? `No results for "${query}"` : "Nothing here yet"}
      </h3>
      <p className="text-muted-foreground text-sm max-w-xs mx-auto">
        {query
          ? "Try a different search term or switch the content filter"
          : "Try searching for manga, manhwa, or comics above"}
      </p>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function Discover() {
  const [search, setSearch] = useState("");
  const [contentFilter, setContentFilter] = useState<ContentType | "all">(
    "all",
  );

  const { data: trending, isLoading: trendingLoading } = useTrending();
  const { data: searchResults, isLoading: searchLoading } =
    useMangaSearch(search);
  const { data: watchlist } = useWatchlist();
  const addToWatchlist = useAddToWatchlist();

  const watchlistIds = new Set(watchlist?.map((w) => w.mangaDexId) ?? []);
  const isSearching = search.trim().length >= 2;
  const isLoading = isSearching ? searchLoading : trendingLoading;

  const handleAdd = (manga: MangaSearchResult) => {
    if (watchlistIds.has(manga.mangaDexId)) return;
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

  const applyFilter = (items: MangaSearchResult[]) =>
    contentFilter === "all"
      ? items
      : items.filter((m) => m.contentType === contentFilter);

  const rawTrending =
    trending && trending.length > 0 ? trending : SAMPLE_TRENDING;
  const rawBest = SAMPLE_BESTSELLERS;

  const trendingFiltered = applyFilter(
    isSearching ? (searchResults ?? []) : rawTrending,
  );
  const bestFiltered = applyFilter(rawBest);

  const featuredItems = trendingFiltered.slice(0, 2);
  const gridItems = trendingFiltered.slice(2);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Page hero bar ───────────────────────────────────────────── */}
      <div className="bg-card border-b border-border px-4 lg:px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Compass className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Discover
              </h1>
              <p className="text-muted-foreground text-sm">
                Find manga, manhwa &amp; comics to track
              </p>
            </div>
          </div>
          <SearchInput
            value={search}
            onChange={setSearch}
            isLoading={searchLoading}
            className="sm:w-80"
            data-ocid="discover-search"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-8">
        {/* ── Content type filter ──────────────────────────────────── */}
        <div
          className="flex items-center gap-2 flex-wrap"
          data-ocid="content-filter"
        >
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {CONTENT_FILTERS.map(({ label, value }) => (
            <Button
              key={value}
              variant={contentFilter === value ? "default" : "ghost"}
              size="sm"
              onClick={() => setContentFilter(value)}
              className={
                contentFilter !== value
                  ? "text-muted-foreground hover:text-foreground"
                  : ""
              }
            >
              {label}
            </Button>
          ))}
        </div>

        {/* ── Tabs: Trending / Best Sellers ───────────────────────── */}
        <Tabs defaultValue="trending" className="space-y-6">
          <TabsList className="bg-muted/50 border border-border">
            <TabsTrigger
              value="trending"
              className="gap-2"
              data-ocid="tab-trending"
            >
              <TrendingUp className="w-4 h-4" />
              {isSearching ? "Search Results" : "Trending"}
            </TabsTrigger>
            <TabsTrigger
              value="bestsellers"
              className="gap-2"
              data-ocid="tab-bestsellers"
            >
              <Crown className="w-4 h-4" />
              Best Sellers
            </TabsTrigger>
          </TabsList>

          {/* ── Trending tab ──────────────────────────────────────── */}
          <TabsContent value="trending" className="space-y-6">
            {isLoading ? (
              <SkeletonGrid />
            ) : trendingFiltered.length === 0 ? (
              <EmptyState query={search} />
            ) : (
              <>
                {/* Featured duo — only show when not searching */}
                {!isSearching && featuredItems.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h2 className="font-display font-semibold text-foreground">
                        Hot Right Now
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {featuredItems.map((manga, i) => (
                        <motion.div
                          key={manga.mangaDexId}
                          initial={{ opacity: 0, y: 24 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <FeaturedCard
                            manga={manga}
                            onAdd={handleAdd}
                            isInWatchlist={watchlistIds.has(manga.mangaDexId)}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Card grid */}
                <div>
                  {!isSearching && gridItems.length > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-accent" />
                      <h2 className="font-display font-semibold text-foreground">
                        Trending This Week
                      </h2>
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {(isSearching ? trendingFiltered : gridItems).map(
                      (manga, i) => (
                        <motion.div
                          key={manga.mangaDexId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <MangaCard
                            manga={manga}
                            onAddToWatchlist={handleAdd}
                            isInWatchlist={watchlistIds.has(manga.mangaDexId)}
                          />
                        </motion.div>
                      ),
                    )}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* ── Best Sellers tab ──────────────────────────────────── */}
          <TabsContent value="bestsellers" className="space-y-4">
            {trendingLoading ? (
              <div className="space-y-3">
                {["bs1", "bs2", "bs3", "bs4", "bs5"].map((k) => (
                  <div
                    key={k}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                  >
                    <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                    <Skeleton className="w-10 h-14 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="w-14 h-8 rounded-lg shrink-0" />
                  </div>
                ))}
              </div>
            ) : bestFiltered.length === 0 ? (
              <EmptyState query="" />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="w-4 h-4 text-chart-4" />
                  <h2 className="font-display font-semibold text-foreground">
                    Top Rated &amp; Most Read
                  </h2>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {bestFiltered.length} titles
                  </Badge>
                </div>
                {bestFiltered.map((manga, i) => (
                  <BestsellerRow
                    key={manga.mangaDexId}
                    manga={manga}
                    rank={i + 1}
                    onAdd={handleAdd}
                    isInWatchlist={watchlistIds.has(manga.mangaDexId)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
