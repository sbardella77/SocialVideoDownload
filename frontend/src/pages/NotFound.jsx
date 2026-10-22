import { Link } from "react-router-dom";
import SEO from "@/components/SEO";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center" data-testid="not-found-page">
      <SEO noindex title="Page not found | SaveFlex" />
      <div className="max-w-xl mx-auto px-4 text-center">
        <h1 className="text-4xl font-bold mb-4">Page not found</h1>
        <p className="text-muted-foreground mb-8">
          This page doesn't exist. Head back to the downloader to save your video.
        </p>
        <Link to="/" className="inline-flex rounded-full brand-gradient px-6 py-3 font-semibold text-white">
          Go to SaveFlex
        </Link>
      </div>
    </div>
  );
}
