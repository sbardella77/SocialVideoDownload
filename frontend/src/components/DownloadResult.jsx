import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, CheckCircle, Image, Film, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useDownloadHistory } from "@/hooks/useDownloadHistory";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const DownloadResult = ({ result }) => {
  const { addItem } = useDownloadHistory();

  if (!result || !result.success) return null;

  const { metadata, download_options, platform, source_url } = result;

  // Generate safe filename from title
  const generateFilename = (title, format) => {
    const safeName = (title || "video")
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 50);
    const ext = format?.includes("audio") ? "mp3" : "mp4";
    return `${safeName}.${ext}`;
  };

  // Use proxy download for mobile compatibility
  const handleDownload = (url, quality, format) => {
    const filename = generateFilename(metadata?.title, format);

    // Persist to history (only when user actually triggers a download).
    if (source_url) {
      addItem({
        url: source_url,
        platform,
        title: metadata?.title,
        thumbnail: metadata?.thumbnail_url,
        author: metadata?.author,
      });
    }

    // Check if mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Use proxy endpoint for mobile - forces download
      const proxyUrl = `${API_URL}/api/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      
      // Create a temporary link and click it
      const link = document.createElement("a");
      link.href = proxyUrl;
      link.download = filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Downloading: ${quality}`, {
        description: "Check your downloads folder",
        icon: <Smartphone className="w-4 h-4" />
      });
    } else {
      // Desktop: use proxy for consistent behavior
      const proxyUrl = `${API_URL}/api/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      
      const link = document.createElement("a");
      link.href = proxyUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Starting download: ${quality}`);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return null;
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatViews = (views) => {
    if (!views) return null;
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
    return `${views} views`;
  };

  const formatSize = (bytes) => {
    if (!bytes) return null;
    const size = parseInt(bytes);
    if (isNaN(size)) return null;
    if (size >= 1073741824) return `${(size / 1073741824).toFixed(1)} GB`;
    if (size >= 1048576) return `${(size / 1048576).toFixed(1)} MB`;
    if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${size} B`;
  };

  return (
    <Card className="download-result w-full max-w-3xl mx-auto border-primary/20 bg-card/50 backdrop-blur-sm" data-testid="download-result">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="font-semibold text-green-500">Ready to Download</span>
          <Badge variant="outline" className="ml-auto capitalize">
            {platform}
          </Badge>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Thumbnail */}
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

          {/* Info */}
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
              {metadata?.view_count && (
                <span>{formatViews(metadata.view_count)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Download Options */}
        {download_options && download_options.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              Download Options
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="download-options">
              {download_options.slice(0, 6).map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-between h-auto py-3 px-4 hover:bg-primary/5 hover:border-primary/50 group"
                  onClick={() => handleDownload(option.url, option.quality, option.format)}
                  data-testid={`download-option-${index}`}
                >
                  <span className="flex items-center gap-2">
                    {option.format?.includes("audio") ? (
                      <Film className="w-4 h-4 text-muted-foreground" />
                    ) : option.format?.includes("image") ? (
                      <Image className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Film className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="font-medium text-left">{option.quality}</span>
                  </span>
                  <span className="flex items-center gap-2 text-muted-foreground group-hover:text-primary">
                    {option.size && (
                      <span className="text-xs">
                        {formatSize(option.size)}
                      </span>
                    )}
                    <Download className="w-4 h-4" />
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Main Download Button */}
        {download_options && download_options[0]?.url && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <Button
              className="w-full gap-2 bg-primary hover:bg-primary/90"
              size="lg"
              onClick={() => handleDownload(download_options[0].url, download_options[0].quality, download_options[0].format)}
              data-testid="download-best-btn"
            >
              <Download className="w-5 h-5" />
              Download {download_options[0].quality.includes("Audio") ? "Best Audio" : "Best Quality"}
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
