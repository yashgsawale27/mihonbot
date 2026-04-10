import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  RefreshCw,
  Settings as SettingsIcon,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SiWhatsapp } from "react-icons/si";
import { toast } from "sonner";
import {
  useNotificationPrefs,
  useSetNotificationPrefs,
} from "../hooks/useQueries";
import { NotificationFrequency } from "../types";
import type { NotificationPrefs } from "../types";

interface FreqOption {
  value: NotificationFrequency;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const FREQ_OPTIONS: FreqOption[] = [
  {
    value: NotificationFrequency.immediate,
    label: "Immediate",
    description: "Get notified the moment a new chapter drops.",
    icon: <Zap className="w-4 h-4" />,
  },
  {
    value: NotificationFrequency.daily,
    label: "Daily Digest",
    description: "One summary message per day with all new chapters.",
    icon: <Clock className="w-4 h-4" />,
  },
  {
    value: NotificationFrequency.weekly,
    label: "Weekly Recap",
    description: "Weekly roundup of new chapters every Monday.",
    icon: <RefreshCw className="w-4 h-4" />,
  },
];

const SETUP_STEPS = [
  "Enter your WhatsApp number and save settings.",
  "Copy your Webhook URL and configure it in your WhatsApp provider.",
  "Send /start to the MihonBot WhatsApp number.",
  "You'll receive a confirmation message within seconds.",
  "Use bot commands from WhatsApp to manage your watchlist.",
];

export default function Settings() {
  const { data: prefs, isLoading } = useNotificationPrefs();
  const setPrefs = useSetNotificationPrefs();

  const [form, setForm] = useState<NotificationPrefs>({
    enabled: true,
    whatsappNumber: "",
    webhookUrl: "",
    frequency: NotificationFrequency.immediate,
  });
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (prefs) {
      setForm(prefs);
      setIsDirty(false);
    }
  }, [prefs]);

  const update = <K extends keyof NotificationPrefs>(
    key: K,
    value: NotificationPrefs[K],
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      await setPrefs.mutateAsync(form);
      setIsDirty(false);
      toast.success("Settings saved!", {
        description: "Your notification preferences have been updated.",
      });
    } catch {
      toast.error("Failed to save settings. Please try again.");
    }
  };

  const handleReset = () => {
    if (prefs) {
      setForm(prefs);
      setIsDirty(false);
    }
  };

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-3xl mx-auto px-4 lg:px-6 py-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <SettingsIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl mb-1">Settings</h1>
              <p className="text-muted-foreground text-sm">
                Manage your WhatsApp notification preferences and bot
                configuration.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 lg:px-6 py-8 flex flex-col gap-6">
        {isLoading ? (
          <Card className="bg-card border-border">
            <CardContent className="p-6 flex flex-col gap-5">
              {["sk1", "sk2", "sk3", "sk4"].map((k) => (
                <div key={k} className="flex flex-col gap-2">
                  <Skeleton className="h-3 w-28 bg-muted" />
                  <Skeleton className="h-9 w-full bg-muted" />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Master Toggle */}
            <Card
              className="bg-card border-border"
              data-ocid="settings-notifications-card"
            >
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 font-display text-base">
                  {form.enabled ? (
                    <Bell className="w-4 h-4 text-accent" />
                  ) : (
                    <BellOff className="w-4 h-4 text-muted-foreground" />
                  )}
                  Notifications
                  <Badge
                    className={`ml-auto text-xs ${
                      form.enabled
                        ? "bg-accent/15 text-accent border-accent/30"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {form.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      WhatsApp Notifications
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Receive new chapter alerts and bot responses on WhatsApp
                    </p>
                  </div>
                  <Switch
                    checked={form.enabled}
                    onCheckedChange={(v) => update("enabled", v)}
                    data-ocid="settings-notifications-toggle"
                  />
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp Config */}
            <Card
              className="bg-card border border-accent/20"
              data-ocid="settings-whatsapp-card"
            >
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 font-display text-base">
                  <SiWhatsapp className="w-4 h-4 text-accent" />
                  WhatsApp Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="settings-phone"
                    className="text-sm font-medium"
                  >
                    WhatsApp Number
                  </Label>
                  <div className="relative">
                    <Input
                      id="settings-phone"
                      placeholder="+1 555 000 0000"
                      value={form.whatsappNumber}
                      onChange={(e) => update("whatsappNumber", e.target.value)}
                      className="font-mono bg-muted/40 border-input pr-10"
                      data-ocid="settings-whatsapp-input"
                    />
                    {form.whatsappNumber && (
                      <CheckCircle2 className="w-4 h-4 text-accent absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Include country code, e.g. +1 for US/Canada
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="settings-webhook"
                    className="text-sm font-medium"
                  >
                    Webhook URL
                  </Label>
                  <Input
                    id="settings-webhook"
                    placeholder="https://api.example.com/webhook/whatsapp"
                    value={form.webhookUrl}
                    onChange={(e) => update("webhookUrl", e.target.value)}
                    className="font-mono text-xs bg-muted/40 border-input"
                    data-ocid="settings-webhook-input"
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    The endpoint MihonBot calls to deliver your WhatsApp
                    messages
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Frequency Selector */}
            <Card
              className="bg-card border-border"
              data-ocid="settings-frequency-card"
            >
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 font-display text-base">
                  <Clock className="w-4 h-4 text-primary" />
                  Notification Frequency
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  How often would you like to receive chapter update alerts?
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {FREQ_OPTIONS.map((opt) => {
                    const active = form.frequency === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update("frequency", opt.value)}
                        className={`flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-smooth ${
                          active
                            ? "border-primary/50 bg-primary/10 ring-1 ring-primary/30"
                            : "border-border bg-muted/20 hover:bg-muted/40"
                        }`}
                        data-ocid={`settings-freq-${opt.value}`}
                      >
                        <div
                          className={
                            active ? "text-primary" : "text-muted-foreground"
                          }
                        >
                          {opt.icon}
                        </div>
                        <div>
                          <p
                            className={`text-sm font-semibold ${active ? "text-primary" : "text-foreground"}`}
                          >
                            {opt.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {opt.description}
                          </p>
                        </div>
                        {active && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary self-end mt-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Setup Instructions */}
            <Card
              className="bg-card border-border"
              data-ocid="settings-setup-card"
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-display text-base">
                  <SiWhatsapp className="w-4 h-4 text-accent" />
                  How to Connect WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-accent/8 border border-accent/20 rounded-xl p-4">
                  <ol className="flex flex-col gap-2.5">
                    {SETUP_STEPS.map((step, i) => (
                      <li key={step} className="flex items-start gap-3 text-sm">
                        <span className="w-5 h-5 rounded-full bg-accent/20 text-accent font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-muted-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* Save / Reset Bar */}
            <div
              className={`flex items-center justify-between gap-3 p-4 rounded-xl border transition-smooth ${
                isDirty
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-muted/20"
              }`}
              data-ocid="settings-save-bar"
            >
              <p className="text-sm">
                {isDirty ? (
                  <span className="text-primary font-medium">
                    You have unsaved changes.
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    All settings are up to date.
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                {isDirty && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="text-muted-foreground hover:text-foreground"
                    data-ocid="settings-reset-btn"
                  >
                    Reset
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={!isDirty || setPrefs.isPending}
                  size="sm"
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth"
                  data-ocid="settings-save-btn"
                >
                  {setPrefs.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
