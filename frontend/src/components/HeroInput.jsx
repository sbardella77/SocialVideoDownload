import { useState, useCallback, useRef } from "react";
import { Loader2, Clipboard, Download, Link2, X } from "lucide-react";
import { toast } from "sonner";
import { detectPlatform, PlatformChips } from "@/components/PlatformIcons";

const DEFAULT_HINT = "Works with public links. Paste one to get started.";

export const HeroInput = ({ onSubmit, loading, placeholder, showPlatforms = false }) => {
  const [url, setUrl] = useState("");
  const inputRef = useRef(null);
  const platform = detectPlatform(url);

  // Many mobile browsers (in-app browsers, some iOS/Android ones) block
  // clipboard reads. Instead of failing, focus the field so the user can
  // long-press and paste with the native menu.
  const fallbackToManualPaste = useCallback(() => {
    inputRef.current?.focus();
    toast.info("Long-press the field and tap Paste to insert your link.");
  }, []);

  const handlePaste = useCallback(async () => {
    if (!navigator.clipboard?.readText) {
      fallbackToManualPaste();
      return;
    }
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!text) {
        fallbackToManualPaste();
        return;
      }
      setUrl(text);
      toast.success("URL pasted from clipboard");
    } catch (err) {
      fallbackToManualPaste();
    }
  }, [fallbackToManualPaste]);

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

  let hint = DEFAULT_HINT;
  if (url.trim()) {
    hint = platform
      ? `${platform.name} link detected.`
      : "We don't recognize this link. Check that it's from a supported platform.";
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="hero-rise w-full max-w-2xl mx-auto" style={{ animationDelay: "0.15s" }} data-testid="hero-input-form">
        <label htmlFor="video-url" className="sr-only">Video link</label>
        <div className="hero-field flex flex-col gap-2 rounded-[28px] p-2 sm:flex-row sm:items-center sm:rounded-full">
          <div className="flex min-w-0 flex-1 items-center gap-2 pl-4 pr-1">
            <Link2 className="w-5 h-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              id="video-url"
              ref={inputRef}
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={placeholder || "Paste your video link here..."}
              disabled={loading}
              className="h-12 sm:h-14 min-w-0 flex-1 bg-transparent px-1 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-60"
              data-testid="url-input"
            />
            {url && (
              <button
                type="button"
                onClick={handleClear}
                disabled={loading}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Clear link"
                data-testid="clear-btn"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handlePaste}
              disabled={loading}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Paste from clipboard"
              data-testid="paste-btn"
            >
              <Clipboard className="w-4 h-4" />
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="hero-cta brand-gradient inline-flex h-12 sm:h-14 shrink-0 items-center justify-center gap-2 rounded-full px-7 sm:px-9 font-display text-base font-semibold text-white disabled:opacity-80"
            data-testid="download-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Download className="w-[18px] h-[18px]" strokeWidth={2.4} />
                <span>Download</span>
              </>
            )}
          </button>
        </div>
        <p className="mt-3 min-h-[20px] text-center text-[13px] text-muted-foreground" aria-live="polite" data-testid="url-hint">
          {hint}
        </p>
      </form>
      {showPlatforms && <PlatformChips activeId={platform?.id} />}
    </div>
  );
};

export default HeroInput;
