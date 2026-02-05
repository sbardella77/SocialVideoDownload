import { useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import HeroInput from "@/components/HeroInput";
import DownloadResult from "@/components/DownloadResult";
import FAQSection from "@/components/FAQSection";
import HowToSection from "@/components/HowToSection";
import AdPlaceholder from "@/components/AdPlaceholder";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function InstagramDownloader() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleDownload = useCallback(async (url) => {
    if (!url.includes("instagram.com") && !url.includes("instagr.am")) {
      toast.error("Please enter a valid Instagram URL");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post(`${API_URL}/api/download`, { url });
      if (response.data.success && response.data.download_options?.length > 0) {
        setResult(response.data);
        toast.success("Content found! Choose your download option.");
      } else {
        const errorMsg = response.data.error || response.data.message || "No download options available for this content.";
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
    <div className="min-h-screen" data-testid="instagram-page">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-pink-500/10 via-transparent to-transparent" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 text-pink-400 text-sm font-medium mb-6">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
              </svg>
              Instagram Downloader
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Download Instagram{" "}
              <span className="text-pink-400">Reels & Videos</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Save Instagram Reels, posts, stories, and IGTV videos in high quality. Free, fast, and no login required.
            </p>
          </div>

          <div className="mb-8">
            <HeroInput
              onSubmit={handleDownload}
              loading={loading}
              placeholder="Paste Instagram Reel, Post, or Story URL..."
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
          <HowToSection platform="instagram" />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-3">
              <FAQSection platform="instagram" />
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
              Best Free Instagram Video Downloader
            </h2>
            <div className="prose prose-invert prose-lg max-w-none text-muted-foreground">
              <p className="mb-4">
                SaveFlex's Instagram Downloader lets you save Instagram content with ease. Download Instagram Reels, regular video posts, IGTV videos, and carousel posts in their original quality.
              </p>
              <p className="mb-4">
                Our tool supports all types of Instagram content from public accounts. Simply copy the Instagram URL, paste it above, and download your content in seconds. No app installation or login required.
              </p>
              <p>
                Whether you're saving travel inspiration, workout videos, cooking tutorials, or memorable moments shared by friends and creators, SaveFlex makes it simple and free.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
