import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, Trash2, RotateCw, X } from "lucide-react";
import { useDownloadHistory } from "@/hooks/useDownloadHistory";

// Relative-time thresholds (ms)
const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const MS_PER_WEEK = 7 * MS_PER_DAY;

const formatRelativeTime = (iso) => {
  if (!iso) return "";
  const ts = new Date(iso).getTime();
  const diff = Date.now() - ts;
  if (diff < MS_PER_MINUTE) return "just now";
  if (diff < MS_PER_HOUR) return `${Math.floor(diff / MS_PER_MINUTE)}m ago`;
  if (diff < MS_PER_DAY) return `${Math.floor(diff / MS_PER_HOUR)}h ago`;
  if (diff < MS_PER_WEEK) return `${Math.floor(diff / MS_PER_DAY)}d ago`;
  return new Date(iso).toLocaleDateString();
};

const platformColors = {
  youtube: "text-red-400 border-red-500/30 bg-red-500/10",
  instagram: "text-pink-400 border-pink-500/30 bg-pink-500/10",
  tiktok: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
  twitter: "text-zinc-300 border-zinc-500/30 bg-zinc-500/10",
  x: "text-zinc-300 border-zinc-500/30 bg-zinc-500/10",
  facebook: "text-blue-400 border-blue-500/30 bg-blue-500/10",
};

export const DownloadHistory = ({ onReDownload }) => {
  const { history, removeItem, clearAll } = useDownloadHistory();

  if (!history || history.length === 0) return null;

  return (
    <section
      className="w-full max-w-3xl mx-auto"
      data-testid="download-history-section"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Recent downloads</h2>
          <Badge variant="outline" className="text-xs">
            {history.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="text-muted-foreground hover:text-destructive"
          data-testid="clear-history-btn"
        >
          <Trash2 className="w-4 h-4 mr-1.5" />
          Clear all
        </Button>
      </div>

      <div className="space-y-2" data-testid="download-history-list">
        {history.map((item) => (
          <Card
            key={item.url}
            className="p-3 flex items-center gap-3 bg-card/40 border-border/50 hover:border-primary/30 transition-colors"
            data-testid="history-item"
          >
            {item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt=""
                loading="lazy"
                className="w-16 h-16 rounded-md object-cover flex-shrink-0 bg-muted"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                <History className="w-5 h-5 text-muted-foreground" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm line-clamp-1">{item.title}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span
                  className={`px-1.5 py-0.5 rounded border capitalize ${
                    platformColors[item.platform] || "border-border"
                  }`}
                >
                  {item.platform}
                </span>
                <span>{formatRelativeTime(item.downloadedAt)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {onReDownload && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onReDownload(item.url)}
                  title="Download again"
                  data-testid="redownload-btn"
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(item.url)}
                title="Remove from history"
                className="text-muted-foreground hover:text-destructive"
                data-testid="remove-history-item-btn"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default DownloadHistory;
