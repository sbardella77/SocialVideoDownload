/**
 * Ad Placeholder
 *
 * Ads are served via Monetag Multitag injected globally in `public/index.html`
 * (zone 10618740). Monetag handles popups, interstitials and push, so this
 * component only renders a sized container as a visual hint where a banner
 * unit could later live (when/if direct banner zones are wired up).
 */

const SIZES = {
  banner: "h-[90px] w-full",
  rectangle: "h-[250px] w-full max-w-[300px]",
  leaderboard: "h-[90px] w-full max-w-[728px]",
  "large-rectangle": "h-[280px] w-full max-w-[336px]",
  sidebar: "h-[600px] w-full max-w-[300px]",
};

export const AdPlaceholder = ({ size = "rectangle", className = "" }) => (
  <div
    className={`ad-placeholder ${SIZES[size] || SIZES.rectangle} ${className}`}
    data-testid="ad-placeholder"
  >
    <span className="opacity-50">Ad Space</span>
  </div>
);

export default AdPlaceholder;
