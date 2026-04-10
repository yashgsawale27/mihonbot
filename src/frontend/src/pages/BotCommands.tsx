import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bot,
  CheckCircle2,
  Circle,
  MessageSquare,
  Save,
  Terminal,
  Trash2,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SiWhatsapp } from "react-icons/si";
import { toast } from "sonner";
import {
  useClearWhatsAppChatHistory,
  useGetTwilioConfig,
  useSetTwilioConfig,
  useWhatsAppChatHistory,
} from "../hooks/useQueries";
import { MessageDirection } from "../types";
import type { WhatsAppMessage } from "../types";

interface CommandEntry {
  syntax: string;
  description: string;
  example: string;
  category: "watchlist" | "discover" | "notifications" | "info";
}

const BOT_COMMANDS: CommandEntry[] = [
  {
    syntax: "/watchlist",
    description:
      "List all manga, manhwa, and comics in your current watchlist.",
    example: "📚 Your watchlist: Chainsaw Man (Ch.145), One Piece (Ch.1101)…",
    category: "watchlist",
  },
  {
    syntax: "/recommend",
    description:
      "Get AI-powered recommendations based on your reading history.",
    example: "🤖 Based on your taste: Solo Leveling, Blue Lock, Dungeon Meshi…",
    category: "discover",
  },
  {
    syntax: "/trending",
    description: "Show top trending manga, manhwa, and comics right now.",
    example: "🔥 Trending now: Jujutsu Kaisen, Spy x Family, Oshi no Ko…",
    category: "discover",
  },
  {
    syntax: "/details [title]",
    description:
      "Get full details about a specific title including genres, status, and rating.",
    example: "📖 Chainsaw Man — Action, Supernatural | Ongoing | ★ 9.2",
    category: "info",
  },
  {
    syntax: "/add [title]",
    description:
      "Add a manga, manhwa, or comic to your watchlist directly from WhatsApp.",
    example: "✅ Added 'Blue Lock' to your watchlist!",
    category: "watchlist",
  },
  {
    syntax: "/status [title]",
    description: "Check reading status and latest chapter for a tracked title.",
    example: "📊 One Piece: Reading | Ch. 1101 / 1103 | 2 new chapters!",
    category: "watchlist",
  },
  {
    syntax: "/newchapters",
    description:
      "Check all titles with new chapters released since your last read.",
    example: "🆕 New chapters: Chainsaw Man Ch.146, Jujutsu Kaisen Ch.267",
    category: "notifications",
  },
];

const NATURAL_LANGUAGE_EXAMPLES = [
  { input: "What's new in my list?", maps: "/newchapters" },
  { input: "Recommend me something like Solo Leveling", maps: "/recommend" },
  { input: "Tell me about Attack on Titan", maps: "/details Attack on Titan" },
  { input: "Add Dungeon Meshi to my list", maps: "/add Dungeon Meshi" },
  { input: "What's trending this week?", maps: "/trending" },
];

const CATEGORY_STYLES: Record<
  CommandEntry["category"],
  { badge: string; label: string }
> = {
  watchlist: {
    badge: "border-primary/30 bg-primary/10 text-primary",
    label: "Watchlist",
  },
  discover: {
    badge: "border-accent/30 bg-accent/10 text-accent",
    label: "Discover",
  },
  notifications: {
    badge: "border-primary/30 bg-primary/10 text-primary",
    label: "Alerts",
  },
  info: {
    badge: "border-muted-foreground/30 bg-muted/10 text-muted-foreground",
    label: "Info",
  },
};

function formatChatTimestamp(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  const d = new Date(ms);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function ChatBubble({ msg }: { msg: WhatsAppMessage }) {
  const isInbound = msg.direction === MessageDirection.inbound;
  return (
    <div
      className={`flex w-full ${isInbound ? "justify-start" : "justify-end"}`}
      data-ocid="chat-bubble"
    >
      <div
        className={`max-w-[80%] flex flex-col gap-1 ${isInbound ? "items-start" : "items-end"}`}
      >
        <span className="text-xs text-muted-foreground px-1">
          {isInbound ? msg.from : "Bot"}
        </span>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words ${
            isInbound
              ? "bg-primary/15 border border-primary/20 text-foreground rounded-tl-sm"
              : "bg-accent/20 border border-accent/25 text-foreground rounded-tr-sm"
          }`}
        >
          {msg.body}
        </div>
        <span className="text-xs text-muted-foreground/60 px-1">
          {formatChatTimestamp(msg.timestamp)}
        </span>
      </div>
    </div>
  );
}

function ChatHistoryPanel() {
  const { data: messages, isLoading } = useWhatsAppChatHistory();
  const clearHistory = useClearWhatsAppChatHistory();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleClear = async () => {
    try {
      await clearHistory.mutateAsync();
      toast.success("Chat history cleared");
    } catch {
      toast.error("Failed to clear history");
    }
  };

  return (
    <Card
      className="bg-card border-border flex flex-col"
      data-ocid="chat-history-panel"
    >
      <CardHeader className="pb-3 flex-row items-center gap-2">
        <MessageSquare className="w-4 h-4 text-accent shrink-0" />
        <CardTitle className="font-display text-base flex-1">
          WhatsApp Chat History
        </CardTitle>
        {messages && messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-smooth"
            onClick={handleClear}
            disabled={clearHistory.isPending}
            data-ocid="clear-history-btn"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </Button>
        )}
      </CardHeader>
      <Separator />
      <CardContent className="p-0 flex-1">
        {isLoading ? (
          <div className="px-4 py-4 flex flex-col gap-4">
            <div className="flex justify-start">
              <Skeleton className="h-10 w-48 rounded-2xl bg-muted" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-10 w-40 rounded-2xl bg-muted" />
            </div>
            <div className="flex justify-start">
              <Skeleton className="h-14 w-56 rounded-2xl bg-muted" />
            </div>
          </div>
        ) : !messages || messages.length === 0 ? (
          <div
            className="px-4 py-10 text-center flex flex-col items-center gap-2"
            data-ocid="chat-history-empty"
          >
            <SiWhatsapp className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground font-medium">
              💬 No messages yet.
            </p>
            <p className="text-xs text-muted-foreground/60 max-w-[220px]">
              Send a message to +14155238886 on WhatsApp to get started!
            </p>
          </div>
        ) : (
          <div className="px-4 py-4 flex flex-col gap-3 max-h-96 overflow-y-auto">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} msg={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BotStatusCard({ sandboxNumber }: { sandboxNumber: string }) {
  const { data: config, isLoading } = useGetTwilioConfig();
  const isConfigured = !!config?.accountSid;
  const webhookUrl = "https://<canister-id>.ic0.app/whatsapp-webhook";

  return (
    <Card
      className={`bg-card border ${isConfigured ? "border-green-500/30" : "border-border"}`}
      data-ocid="bot-status-card"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <SiWhatsapp className="w-4 h-4 text-accent shrink-0" />
          <CardTitle className="font-display text-base flex-1">
            Bot Status
          </CardTitle>
          {isLoading ? (
            <Skeleton className="h-5 w-20 rounded-full bg-muted" />
          ) : isConfigured ? (
            <Badge className="bg-green-500/15 text-green-500 border-green-500/30 text-xs gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Active
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-muted-foreground text-xs gap-1 border-muted-foreground/30"
            >
              <Circle className="w-3 h-3" />
              Not configured
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-xs">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground">Sandbox number</span>
          <code className="font-mono text-foreground bg-muted/40 px-2 py-1 rounded text-xs">
            {isLoading
              ? "…"
              : config?.sandboxNumber || sandboxNumber || "+14155238886"}
          </code>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground">Webhook URL</span>
          <code className="font-mono text-foreground bg-muted/40 px-2 py-1 rounded text-xs break-all">
            {webhookUrl}
          </code>
        </div>
      </CardContent>
    </Card>
  );
}

function TwilioConfigForm() {
  const { data: config } = useGetTwilioConfig();
  const setConfig = useSetTwilioConfig();

  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [sandboxNumber, setSandboxNumber] = useState("");

  useEffect(() => {
    if (config) {
      setAccountSid(config.accountSid || "");
      setSandboxNumber(config.sandboxNumber || "");
    }
  }, [config]);

  const handleSave = async () => {
    if (!accountSid.trim() || !authToken.trim() || !sandboxNumber.trim()) {
      toast.error("All fields are required");
      return;
    }
    try {
      await setConfig.mutateAsync({ accountSid, authToken, sandboxNumber });
      toast.success("Twilio configuration saved!", {
        description: "Your WhatsApp bot is now active.",
      });
      setAuthToken("");
    } catch {
      toast.error("Failed to save configuration");
    }
  };

  return (
    <Card
      className="bg-card border border-accent/20"
      data-ocid="twilio-config-form"
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-display text-base">
          <Bot className="w-4 h-4 text-primary" />
          Twilio Configuration
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Connect your Twilio account to enable WhatsApp messaging.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="twilio-sid" className="text-xs text-muted-foreground">
            Account SID
          </Label>
          <Input
            id="twilio-sid"
            placeholder="AC..."
            value={accountSid}
            onChange={(e) => setAccountSid(e.target.value)}
            className="font-mono text-xs bg-muted/40 border-input"
            data-ocid="twilio-account-sid-input"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="twilio-token"
            className="text-xs text-muted-foreground"
          >
            Auth Token
          </Label>
          <Input
            id="twilio-token"
            type="password"
            placeholder="Enter auth token"
            value={authToken}
            onChange={(e) => setAuthToken(e.target.value)}
            className="font-mono text-xs bg-muted/40 border-input"
            data-ocid="twilio-auth-token-input"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="twilio-number"
            className="text-xs text-muted-foreground"
          >
            Sandbox WhatsApp Number
          </Label>
          <Input
            id="twilio-number"
            placeholder="+14155238886"
            value={sandboxNumber}
            onChange={(e) => setSandboxNumber(e.target.value)}
            className="font-mono text-xs bg-muted/40 border-input"
            data-ocid="twilio-sandbox-number-input"
          />
        </div>
        <Button
          onClick={handleSave}
          disabled={setConfig.isPending}
          className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90 transition-smooth"
          data-ocid="twilio-save-config-btn"
        >
          <Save className="w-4 h-4" />
          {setConfig.isPending ? "Saving…" : "Save Configuration"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function BotCommands() {
  return (
    <div className="min-h-full bg-background">
      {/* Hero Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0">
              <SiWhatsapp className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="font-display font-bold text-2xl">
                  WhatsApp Bot Commands
                </h1>
                <Badge className="bg-accent/15 text-accent border-accent/30 text-xs">
                  Live
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm max-w-xl">
                Control MihonBot directly from WhatsApp. Send commands to get
                updates, add titles, and receive new chapter alerts — no app
                required.
              </p>
              <div className="mt-4">
                <a
                  href="https://wa.me/14155238886?text=%2Fwatchlist"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-ocid="chat-on-whatsapp-btn"
                >
                  <Button
                    className="gap-2 bg-green-500 text-white hover:bg-green-600 border-0 shadow-subtle transition-smooth"
                    size="default"
                  >
                    <SiWhatsapp className="w-4 h-4" />
                    Chat on WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Chat History + Command Reference + Natural Language */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* WhatsApp Chat History */}
          <ChatHistoryPanel />

          {/* Command Reference Table */}
          <Card
            className="bg-card border-border"
            data-ocid="bot-commands-table"
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Terminal className="w-5 h-5 text-accent" />
                Command Reference
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {BOT_COMMANDS.map((cmd) => {
                  const style = CATEGORY_STYLES[cmd.category];
                  return (
                    <div
                      key={cmd.syntax}
                      className="px-6 py-4 hover:bg-muted/30 transition-smooth"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <code className="font-mono text-sm font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">
                          {cmd.syntax}
                        </code>
                        <Badge
                          variant="outline"
                          className={`text-xs ${style.badge}`}
                        >
                          {style.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground mb-2">
                        {cmd.description}
                      </p>
                      <div className="flex items-start gap-1.5 bg-muted/40 rounded-md px-3 py-2">
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground font-mono">
                          {cmd.example}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Natural Language Section */}
          <Card
            className="bg-card border-border"
            data-ocid="bot-natural-language"
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Zap className="w-5 h-5 text-primary" />
                Natural Language Queries
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                You can also message the bot in plain text — it understands your
                intent.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {NATURAL_LANGUAGE_EXAMPLES.map((ex) => (
                  <div
                    key={ex.input}
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-medium truncate">
                        "{ex.input}"
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-muted-foreground text-xs">→</span>
                      <code className="font-mono text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        {ex.maps}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Status + Twilio Config */}
        <div className="flex flex-col gap-6">
          <BotStatusCard sandboxNumber="+14155238886" />
          <TwilioConfigForm />
        </div>
      </div>
    </div>
  );
}
