export const AdPlaceholder = ({ size = "rectangle", className = "" }) => {
  const sizes = {
    banner: "h-[90px] w-full",
    rectangle: "h-[250px] w-full max-w-[300px]",
    leaderboard: "h-[90px] w-full max-w-[728px]",
    "large-rectangle": "h-[280px] w-full max-w-[336px]",
    sidebar: "h-[600px] w-full max-w-[300px]",
  };

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
