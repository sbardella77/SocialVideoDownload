import { useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import HeroInput from "@/components/HeroInput";
import DownloadResult from "@/components/DownloadResult";
import FAQSection from "@/components/FAQSection";
import HowToSection from "@/components/HowToSection";
import AdPlaceholder from "@/components/AdPlaceholder";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function YouTubeDownloader() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleDownload = useCallback(async (url) => {
    if (!url.includes("youtube.com") && !url.includes("youtu.be")) {
      toast.error("Please enter a valid YouTube URL");
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
    <div className="min-h-screen" data-testid="youtube-page">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 via-transparent to-transparent" />
          <div className="absolute top-0 right-1/3 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-400 text-sm font-medium mb-6">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              YouTube Downloader
            </div>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-foreground">
              Download YouTube Videos
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
              <span className="text-red-400">in HD Quality</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Save YouTube videos, shorts, and music in multiple quality options. Free, fast, and no software needed.
            </p>
          </div>

          <div className="mb-8">
            <HeroInput
              onSubmit={handleDownload}
              loading={loading}
              placeholder="Paste YouTube video or Shorts URL here..."
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
          <HowToSection platform="youtube" />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-3">
              <FAQSection platform="youtube" />
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
              Free YouTube Video Downloader Online
            </h2>
            <div className="prose prose-invert prose-lg max-w-none text-muted-foreground">
              <p className="mb-4">
                SaveFlex provides the easiest way to download YouTube videos online. Support for all video formats including MP4, with quality options from 360p to 4K when available.
              </p>
              <p className="mb-4">
                Our YouTube downloader works with regular videos, YouTube Shorts, and live stream recordings. Simply paste the video URL and choose your preferred quality to start downloading.
              </p>
              <p>
                Perfect for saving tutorials, music videos, documentaries, or any YouTube content for offline viewing. No registration or software installation required.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
