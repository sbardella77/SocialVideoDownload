import { useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import HeroInput from "@/components/HeroInput";
import { PlatformGrid } from "@/components/PlatformCard";
import DownloadResult from "@/components/DownloadResult";
import FAQSection from "@/components/FAQSection";
import HowToSection from "@/components/HowToSection";
import AdPlaceholder from "@/components/AdPlaceholder";
import SEO from "@/components/SEO";
import { seoConfig } from "@/components/seoConfig";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleDownload = useCallback(async (url) => {
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
    <div className="min-h-screen" data-testid="home-page">
      <SEO {...seoConfig.home} />
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2 text-foreground">
              Download Videos from
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
              <span className="gradient-text">Any Platform</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              The fastest, free video downloader for YouTube, Instagram, TikTok, X, and Facebook. No signup required.
            </p>
          </div>

          {/* Main Input */}
          <div className="mb-8">
            <HeroInput
              onSubmit={handleDownload}
              loading={loading}
              placeholder="Paste video URL from YouTube, Instagram, TikTok, Twitter, or Facebook..."
            />
          </div>

          {/* Result */}
          {result && (
            <div className="mt-8">
              <DownloadResult result={result} />
            </div>
          )}

          {/* Supported Platforms Badge */}
          <div className="flex flex-wrap justify-center gap-4 mt-8 text-sm text-muted-foreground">
            <span>Supported:</span>
            <span className="text-foreground font-medium">YouTube</span>
            <span className="text-foreground font-medium">Instagram</span>
            <span className="text-foreground font-medium">TikTok</span>
            <span className="text-foreground font-medium">X</span>
            <span className="text-foreground font-medium">Facebook</span>
          </div>
        </div>
      </section>

      {/* Ad Banner */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <AdPlaceholder size="leaderboard" />
        </div>
      </section>

      {/* Platforms Section */}
      <section className="py-16 md:py-24" data-testid="platforms-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Supported Platforms
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Download videos, reels, stories, and more from all major social media platforms
            </p>
          </div>
          <PlatformGrid />
        </div>
      </section>

      {/* How To Section */}
      <section className="py-16 md:py-24 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <HowToSection platform="general" />
        </div>
      </section>

      {/* Ad + FAQ Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-3">
              <FAQSection platform="general" />
            </div>
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <AdPlaceholder size="rectangle" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="py-16 md:py-24 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              The Best Free Video Downloader Online
            </h2>
            <div className="prose prose-invert prose-lg max-w-none text-muted-foreground">
              <p className="mb-4">
                SaveFlex is your go-to solution for downloading videos from social media platforms. Whether you want to save a YouTube tutorial, download an Instagram Reel, grab a viral TikTok, save a Twitter video, or download Facebook content - we've got you covered.
              </p>
              <p className="mb-4">
                Our service is completely free, requires no registration, and works on any device. We prioritize your privacy by not storing any personal data or download history. Simply paste your link, choose your quality, and download.
              </p>
              <p>
                SaveFlex supports multiple quality options including HD and Full HD downloads when available. For TikTok videos, we even offer watermark-free downloads for a cleaner viewing experience.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
