import { useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import HeroInput from "@/components/HeroInput";
import DownloadResult from "@/components/DownloadResult";
import FAQSection from "@/components/FAQSection";
import HowToSection from "@/components/HowToSection";
import AdPlaceholder from "@/components/AdPlaceholder";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function TikTokDownloader() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleDownload = useCallback(async (url) => {
    if (!url.includes("tiktok.com")) {
      toast.error("Please enter a valid TikTok URL");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post(`${API_URL}/api/download`, { url });
      if (response.data.success && response.data.download_options?.length > 0) {
        setResult(response.data);
        toast.success("Video found! Choose your download option.");
      } else {
        const errorMsg = response.data.error || response.data.message || "No download options available for this video.";
        toast.error(errorMsg);
        setResult(null);
      }
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to process the URL. Please try again.";
      toast.error(message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen" data-testid="tiktok-page">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 text-cyan-400 text-sm font-medium mb-6">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
              TikTok Downloader
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Download TikTok Videos{" "}
              <span className="text-cyan-400">Without Watermark</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Save TikTok videos in HD quality without the watermark. Fast, free, and works on any device.
            </p>
          </div>

          <div className="mb-8">
            <HeroInput
              onSubmit={handleDownload}
              loading={loading}
              placeholder="Paste TikTok video URL here..."
            />
          </div>

          {result && (
            <div className="mt-8">
              <DownloadResult result={result} />
            </div>
          )}
        </div>
      </section>

      {/* Ad Banner */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <AdPlaceholder size="leaderboard" />
        </div>
      </section>

      {/* How To Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <HowToSection platform="tiktok" />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-3">
              <FAQSection platform="tiktok" />
            </div>
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <AdPlaceholder size="rectangle" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Best TikTok Video Downloader Without Watermark
            </h2>
            <div className="prose prose-invert prose-lg max-w-none text-muted-foreground">
              <p className="mb-4">
                SaveFlex offers the best TikTok downloader that removes the watermark automatically. Download your favorite TikTok videos in high quality without the distracting TikTok logo.
              </p>
              <p className="mb-4">
                Our TikTok saver works with all TikTok content - regular videos, duets, stitches, and viral trends. Just paste the TikTok link and get a clean, watermark-free video in seconds.
              </p>
              <p>
                Perfect for content creators, social media managers, or anyone who wants to save TikTok videos for offline viewing without the watermark overlay.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
