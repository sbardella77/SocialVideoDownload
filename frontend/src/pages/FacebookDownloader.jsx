import { useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import HeroInput from "@/components/HeroInput";
import DownloadResult from "@/components/DownloadResult";
import FAQSection from "@/components/FAQSection";
import HowToSection from "@/components/HowToSection";
import AdPlaceholder from "@/components/AdPlaceholder";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function FacebookDownloader() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleDownload = useCallback(async (url) => {
    if (!url.includes("facebook.com") && !url.includes("fb.watch") && !url.includes("fb.com")) {
      toast.error("Please enter a valid Facebook URL");
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
    <div className="min-h-screen" data-testid="facebook-page">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/10 text-blue-400 text-sm font-medium mb-6">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook Downloader
            </div>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-foreground">
              Download Facebook
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
              <span className="text-blue-500">Videos & Reels</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Save Facebook videos and Reels in HD and SD quality. Free, fast, and no Facebook login required.
            </p>
          </div>

          <div className="mb-8">
            <HeroInput
              onSubmit={handleDownload}
              loading={loading}
              placeholder="Paste Facebook video or Reel URL here..."
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
          <HowToSection platform="facebook" />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-3">
              <FAQSection platform="facebook" />
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
              Free Facebook Video Downloader Online
            </h2>
            <div className="prose prose-invert prose-lg max-w-none text-muted-foreground">
              <p className="mb-4">
                SaveFlex lets you download Facebook videos and Reels with ease. Save videos from public Facebook posts, pages, and groups in HD or SD quality.
              </p>
              <p className="mb-4">
                Our Facebook video downloader works with all public video content. Simply copy the video URL from Facebook, paste it above, and choose your preferred quality to download.
              </p>
              <p>
                Perfect for saving memorable videos, funny clips, news content, or any public Facebook video for offline viewing.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
