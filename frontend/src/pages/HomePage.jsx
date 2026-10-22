import { useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import HeroInput from "@/components/HeroInput";
import { PlatformGrid } from "@/components/PlatformCard";
import DownloadResult from "@/components/DownloadResult";
import FAQSection from "@/components/FAQSection";
import HowToSection from "@/components/HowToSection";
import AdPlaceholder from "@/components/AdPlaceholder";
import DownloadHistory from "@/components/DownloadHistory";
import SEO from "@/components/SEO";
import AboutSection from "@/components/AboutSection";

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
        setResult({ ...response.data, source_url: url });
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
      <SEO page="home" />
      {/* Hero Section */}
      <section className="relative isolate pt-16 pb-20 sm:pt-24 md:pt-28 md:pb-28 overflow-hidden">
        {/* Background */}
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px] hero-grid" aria-hidden="true" />
        <div className="pointer-events-none absolute left-1/2 top-40 -z-10 h-[420px] w-[min(980px,140%)] -translate-x-1/2 hero-aurora" aria-hidden="true" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 max-w-4xl mx-auto">
            <p className="hero-rise inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 font-mono text-[11.5px] uppercase tracking-[0.14em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_theme(colors.emerald.400)]" />
              Free · No signup required
            </p>
            <h1 className="hero-rise mt-6 text-[40px] sm:text-6xl md:text-[76px] font-extrabold leading-[1.02] tracking-[-0.035em] text-balance" style={{ animationDelay: "0.05s" }}>
              Every video you love,<br className="hidden sm:block" />{" "}
              <span className="gradient-text">saved in one click.</span>
            </h1>
            <p className="hero-rise mt-5 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-[36rem] mx-auto" style={{ animationDelay: "0.1s" }}>
              The free video downloader for YouTube, TikTok, Instagram, Facebook and X. Paste a link and SaveFlex gets it ready to download in high quality.
            </p>
          </div>

          {/* Main Input */}
          <HeroInput
            onSubmit={handleDownload}
            loading={loading}
            placeholder="Paste your video link here..."
            showPlatforms
          />

          {/* Result */}
          {result && (
            <div className="mt-8">
              <DownloadResult result={result} />
            </div>
          )}

          {/* Download History */}
          <div className="mt-12">
            <DownloadHistory onReDownload={handleDownload} />
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
          <AboutSection page="home" />
        </div>
      </section>
    </div>
  );
}
