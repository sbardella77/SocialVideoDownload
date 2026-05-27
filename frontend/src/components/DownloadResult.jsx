import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, CheckCircle, Image, Film, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useDownloadHistory } from "@/hooks/useDownloadHistory";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Byte size constants
const BYTES_PER_KB = 1024;
const BYTES_PER_MB = 1024 * 1024;
const BYTES_PER_GB = 1024 * 1024 * 1024;
const VIEWS_PER_K = 1000;
const VIEWS_PER_M = 1_000_000;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;
const MAX_OPTIONS_VISIBLE = 6;
const MAX_FILENAME_LENGTH = 50;
const MOBILE_UA_RE = /iPhone|iPad|iPod|Android/i;

// ---------- pure helpers (no React) ----------

const generateFilename = (title, format) => {
  const safeName = (title || "video")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, MAX_FILENAME_LENGTH);
  const ext = format?.includes("audio") ? "mp3" : "mp4";
  return `${safeName}.${ext}`;
};

const formatDuration = (seconds) => {
  if (!seconds) return null;
  const hrs = Math.floor(seconds / SECONDS_PER_HOUR);
  const mins = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const secs = seconds % SECONDS_PER_MINUTE;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatViews = (views) => {
  if (!views) return null;
  if (views >= VIEWS_PER_M) return `${(views / VIEWS_PER_M).toFixed(1)}M views`;
  if (views >= VIEWS_PER_K) return `${(views / VIEWS_PER_K).toFixed(1)}K views`;
  return `${views} views`;
};

const formatSize = (bytes) => {
  if (!bytes) return null;
  const size = parseInt(bytes, 10);
  if (Number.isNaN(size)) return null;
  if (size >= BYTES_PER_GB) return `${(size / BYTES_PER_GB).toFixed(1)} GB`;
  if (size >= BYTES_PER_MB) return `${(size / BYTES_PER_MB).toFixed(1)} MB`;
  if (size >= BYTES_PER_KB) return `${(size / BYTES_PER_KB).toFixed(1)} KB`;
  return `${size} B`;
};

const trackUmamiDownload = (data) => {
  try {
    if (typeof window !== "undefined" && window.umami?.track) {
      window.umami.track("download", data);
    }
  } catch (err) {
    // Analytics is best-effort; log in dev, never block download.
    if (process.env.NODE_ENV !== "production") {
      console.warn("Umami track failed:", err);
    }
  }
};

const triggerBrowserDownload = (proxyUrl, filename) => {
  const link = document.createElement("a");
  link.href = proxyUrl;
  link.download = filename;
  const isMobile = MOBILE_UA_RE.test(navigator.userAgent);
  if (isMobile) link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return isMobile;
};

// ---------- small sub-components ----------

const FormatIcon = ({ format }) => {
  if (format?.includes("image")) {
    return <Image className="w-4 h-4 text-muted-foreground" />;
  }
  // both video and audio currently use Film icon
  return <Film className="w-4 h-4 text-muted-foreground" />;
};

const VideoMetadataPanel = ({ metadata, platform }) => (
  <div className="flex flex-col md:flex-row gap-6">
    {metadata?.thumbnail_url && (
      <div className="w-full md:w-48 flex-shrink-0">
        <div className="relative rounded-xl overflow-hidden aspect-video bg-muted">
          <img
            src={metadata.thumbnail_url}
            alt={metadata.title || "Video thumbnail"}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>
      </div>
    )}
    <div className="flex-1 min-w-0">
      <h3 className="font-bold text-lg mb-2 line-clamp-2" data-testid="video-title">
        {metadata?.title || "Untitled"}
      </h3>
      {metadata?.author && (
        <p className="text-sm text-muted-foreground mb-3">
          by <span className="font-medium text-foreground">{metadata.author}</span>
        </p>
      )}
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        {metadata?.duration && (
          <span className="flex items-center gap-1">
            <Film className="w-4 h-4" />
            {formatDuration(metadata.duration)}
          </span>
        )}
        {metadata?.view_count && <span>{formatViews(metadata.view_count)}</span>}
        <span className="capitalize text-xs opacity-70">{platform}</span>
      </div>
    </div>
  </div>
);

const DownloadOptionButton = ({ option, index, onClick }) => (
  <Button
    variant="outline"
    className="justify-between h-auto py-3 px-4 hover:bg-primary/5 hover:border-primary/50 group"
    onClick={onClick}
    data-testid={`download-option-${index}`}
  >
    <span className="flex items-center gap-2">
      <FormatIcon format={option.format} />
      <span className="font-medium text-left">{option.quality}</span>
    </span>
    <span className="flex items-center gap-2 text-muted-foreground group-hover:text-primary">
      {option.size && <span className="text-xs">{formatSize(option.size)}</span>}
      <Download className="w-4 h-4" />
    </span>
  </Button>
);

// ---------- main component ----------

export const DownloadResult = ({ result }) => {
  const { addItem } = useDownloadHistory();

  if (!result || !result.success) return null;

  const { metadata, download_options, platform, source_url } = result;

  const handleDownload = (url, quality, format) => {
    const filename = generateFilename(metadata?.title, format);

    if (source_url) {
      addItem({
        url: source_url,
        platform,
        title: metadata?.title,
        thumbnail: metadata?.thumbnail_url,
        author: metadata?.author,
      });
    }

    trackUmamiDownload({ platform, quality, format });

    const proxyUrl = `${API_URL}/api/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
    const isMobile = triggerBrowserDownload(proxyUrl, filename);

    if (isMobile) {
      toast.success(`Downloading: ${quality}`, {
        description: "Check your downloads folder",
        icon: <Smartphone className="w-4 h-4" />,
      });
    } else {
      toast.success(`Starting download: ${quality}`);
    }
  };

  const bestOption = download_options?.[0];

  return (
    <Card
      className="download-result w-full max-w-3xl mx-auto border-primary/20 bg-card/50 backdrop-blur-sm"
      data-testid="download-result"
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="font-semibold text-green-500">Ready to Download</span>
          <Badge variant="outline" className="ml-auto capitalize">
            {platform}
          </Badge>
        </div>

        <VideoMetadataPanel metadata={metadata} platform={platform} />

        {download_options && download_options.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              Download Options
            </h4>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              data-testid="download-options"
            >
              {download_options
                .slice(0, MAX_OPTIONS_VISIBLE)
                .map((option, index) => (
                  <DownloadOptionButton
                    key={`${option.quality}-${option.url}`}
                    option={option}
                    index={index}
                    onClick={() => handleDownload(option.url, option.quality, option.format)}
                  />
                ))}
            </div>
          </div>
        )}

        {bestOption?.url && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <Button
              className="w-full gap-2 bg-primary hover:bg-primary/90"
              size="lg"
              onClick={() => handleDownload(bestOption.url, bestOption.quality, bestOption.format)}
              data-testid="download-best-btn"
            >
              <Download className="w-5 h-5" />
              Download {bestOption.quality.includes("Audio") ? "Best Audio" : "Best Quality"}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Works on mobile, tablet & desktop
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DownloadResult;
