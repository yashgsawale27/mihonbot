import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createActor } from "../backend";
import type {
  NotificationPrefs,
  RecommendationProfile,
  WatchlistEntry,
} from "../types";
import type { ReadingStatus } from "../types";

export function useWatchlist() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["watchlist"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getWatchlist();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddToWatchlist() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: WatchlistEntry) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addToWatchlist(entry);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlist"] }),
  });
}

export function useRemoveFromWatchlist() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mangaDexId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.removeFromWatchlist(mangaDexId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlist"] }),
  });
}

export function useUpdateReadingProgress() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      mangaDexId,
      chaptersRead,
      status,
    }: {
      mangaDexId: string;
      chaptersRead: bigint;
      status: ReadingStatus;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateReadingProgress(mangaDexId, chaptersRead, status);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlist"] }),
  });
}

export function useTrending() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["trending"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTrendingManga();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMangaSearch(query: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      if (!actor || !query.trim()) return [];
      return actor.searchManga(query);
    },
    enabled: !!actor && !isFetching && query.trim().length >= 2,
    staleTime: 2 * 60 * 1000,
  });
}

export function useMangaDetails(mangaDexId: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["manga", mangaDexId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCachedMangaMeta(mangaDexId);
    },
    enabled: !!actor && !isFetching && !!mangaDexId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useFetchMangaMeta(mangaDexId: string) {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.fetchMangaMeta(mangaDexId);
    },
    onSuccess: (data) => {
      if (data) qc.setQueryData(["manga", mangaDexId], data);
    },
  });
}

export function useNotificationPrefs() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["notificationPrefs"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getNotificationPrefs();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetNotificationPrefs() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: NotificationPrefs) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setNotificationPrefs(prefs);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificationPrefs"] }),
  });
}

export function useAiRecommendations() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["aiRecommendations"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCachedAiRecommendations();
    },
    enabled: !!actor && !isFetching,
    staleTime: 10 * 60 * 1000,
  });
}

export function useRefreshAiRecommendations() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getAiRecommendations();
    },
    onSuccess: (data) => {
      qc.setQueryData(["aiRecommendations"], data);
    },
  });
}

export function useBotCommandLog(limit = 20n) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["botLog", limit.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBotCommandLog(limit);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30 * 1000,
  });
}

export function useLogBotCommand() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      command,
      response,
    }: {
      command: string;
      response: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.logBotCommand(command, response);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["botLog"] }),
  });
}

export function useRecommendationProfile() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["recommendationProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getRecommendationProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateRecommendationProfile() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: RecommendationProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateRecommendationProfile(profile);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["recommendationProfile"] }),
  });
}

export function useCheckForNewChapters() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mangaDexId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.checkForNewChapters(mangaDexId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlist"] }),
  });
}

// ─── WhatsApp / Twilio hooks ──────────────────────────────────────────────────

export function useWhatsAppChatHistory() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["whatsAppChatHistory"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getWhatsAppChatHistory();
    },
    enabled: !!actor && !isFetching,
    staleTime: 10 * 1000,
    refetchInterval: 10 * 1000,
  });
}

export function useClearWhatsAppChatHistory() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.clearWhatsAppChatHistory();
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["whatsAppChatHistory"] }),
  });
}

export function useSetTwilioConfig() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      accountSid,
      authToken,
      sandboxNumber,
    }: {
      accountSid: string;
      authToken: string;
      sandboxNumber: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setTwilioConfig(accountSid, authToken, sandboxNumber);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["twilioConfig"] }),
  });
}

export function useGetTwilioConfig() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["twilioConfig"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getTwilioConfig();
    },
    enabled: !!actor && !isFetching,
  });
}
