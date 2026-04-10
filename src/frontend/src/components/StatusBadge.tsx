import { ContentType, ReadingStatus } from "../types";

const STATUS_CONFIG: Record<
  ReadingStatus,
  { label: string; className: string }
> = {
  [ReadingStatus.reading]: {
    label: "Reading",
    className: "bg-accent/20 text-accent border-accent/30",
  },
  [ReadingStatus.completed]: {
    label: "Completed",
    className: "bg-chart-3/20 text-chart-3 border-chart-3/30",
  },
  [ReadingStatus.dropped]: {
    label: "Dropped",
    className: "bg-destructive/20 text-destructive border-destructive/30",
  },
  [ReadingStatus.planToRead]: {
    label: "Plan to Read",
    className: "bg-muted text-muted-foreground border-border",
  },
};

const CONTENT_CONFIG: Record<ContentType, string> = {
  [ContentType.manga]: "bg-primary/15 text-primary border-primary/25",
  [ContentType.manhwa]: "bg-accent/15 text-accent border-accent/25",
  [ContentType.comics]: "bg-chart-3/15 text-chart-3 border-chart-3/25",
};

export function StatusBadge({ status }: { status: ReadingStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export function ContentTypeBadge({ type }: { type: ContentType }) {
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${CONTENT_CONFIG[type]}`}
    >
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
}

export function ChapterBadge({
  current,
  total,
}: {
  current: number | bigint;
  total?: number;
}) {
  const cur = typeof current === "bigint" ? Number(current) : current;
  return (
    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
      Ch. {cur}
      {total ? ` / ${total}` : ""}
    </span>
  );
}
