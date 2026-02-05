import { useEffect, useRef } from "react";

/**
 * Google AdSense Ad Component
 * 
 * Ad Slots to create in AdSense Dashboard:
 * 1. Leaderboard (728x90) - for banner ads
 * 2. Rectangle (300x250) - for sidebar ads
 * 3. Responsive - auto-sizing ads
 */

export const AdSense = ({ 
  adSlot, 
  adFormat = "auto", 
  fullWidthResponsive = true,
  className = "" 
}) => {
  const adRef = useRef(null);
  const isAdLoaded = useRef(false);

  useEffect(() => {
    // Only load ad once
    if (isAdLoaded.current) return;
    
    try {
      if (typeof window !== "undefined" && window.adsbygoogle && adRef.current) {
        // Check if ad is already initialized
        if (!adRef.current.dataset.adsbygoogleStatus) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          isAdLoaded.current = true;
        }
      }
    } catch (error) {
      console.error("AdSense error:", error);
    }
  }, []);

  return (
    <div className={`ad-container ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-5255520995564923"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive.toString()}
      />
    </div>
  );
};

/**
 * Ad Placeholder - Shows while waiting for AdSense approval
 * or as fallback when ads don't load
 */
export const AdPlaceholder = ({ size = "rectangle", className = "", adSlot = "" }) => {
  const sizes = {
    banner: "h-[90px] w-full",
    rectangle: "h-[250px] w-full max-w-[300px]",
    leaderboard: "h-[90px] w-full max-w-[728px]",
    "large-rectangle": "h-[280px] w-full max-w-[336px]",
    sidebar: "h-[600px] w-full max-w-[300px]",
  };

  // If adSlot is provided, show real AdSense ad
  if (adSlot) {
    const formatMap = {
      banner: "horizontal",
      leaderboard: "horizontal",
      rectangle: "rectangle",
      "large-rectangle": "rectangle",
      sidebar: "vertical",
    };
    
    return (
      <div className={`${sizes[size] || sizes.rectangle} ${className}`}>
        <AdSense 
          adSlot={adSlot} 
          adFormat={formatMap[size] || "auto"}
          className="w-full h-full"
        />
      </div>
    );
  }

  // Show placeholder if no adSlot (for development/testing)
  return (
    <div
      className={`ad-placeholder ${sizes[size] || sizes.rectangle} ${className}`}
      data-testid="ad-placeholder"
    >
      <span className="opacity-50">Ad Space</span>
    </div>
  );
};

export default AdPlaceholder;
