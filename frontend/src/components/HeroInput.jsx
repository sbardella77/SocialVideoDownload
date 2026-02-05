import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Clipboard, ArrowRight, X } from "lucide-react";
import { toast } from "sonner";

export const HeroInput = ({ onSubmit, loading, placeholder }) => {
  const [url, setUrl] = useState("");

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      toast.success("URL pasted from clipboard");
    } catch (err) {
      toast.error("Unable to access clipboard");
    }
  }, []);

  const handleClear = useCallback(() => {
    setUrl("");
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error("Please enter a video URL");
      return;
    }
    onSubmit(url.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto" data-testid="hero-input-form">
      <div className="relative flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={placeholder || "Paste your video link here..."}
            disabled={loading}
            className="hero-input w-full pr-20"
            data-testid="url-input"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {url && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClear}
                disabled={loading}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                data-testid="clear-btn"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handlePaste}
              disabled={loading}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              data-testid="paste-btn"
            >
              <Clipboard className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="h-12 sm:h-14 md:h-16 px-6 sm:px-8 rounded-full text-base font-semibold gap-2 bg-primary hover:bg-primary/90"
          data-testid="download-btn"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="hidden sm:inline">Processing...</span>
            </>
          ) : (
            <>
              <span>Download</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default HeroInput;
