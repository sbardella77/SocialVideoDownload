import { Zap, Shield, Smartphone, Globe } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Get your download links in seconds with our optimized infrastructure.",
  },
  {
    icon: Shield,
    title: "Safe & Secure",
    description: "No malware, no viruses. We never store your personal data.",
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    description: "Works perfectly on any device - phone, tablet, or desktop.",
  },
  {
    icon: Globe,
    title: "Multi-Platform",
    description: "Download from YouTube, Instagram, TikTok, Twitter, and Facebook.",
  },
];

export const HowToSection = ({ platform = "general" }) => {
  const platformNames = {
    youtube: "YouTube",
    instagram: "Instagram",
    tiktok: "TikTok",
    twitter: "Twitter/X",
    facebook: "Facebook",
    general: "social media",
  };

  const steps = [
    {
      step: "1",
      title: "Copy the Link",
      description: `Open ${platformNames[platform]} and copy the video URL from your browser or the share button.`,
    },
    {
      step: "2",
      title: "Paste the URL",
      description: "Paste the copied link into the input field above and click the Download button.",
    },
    {
      step: "3",
      title: "Choose Quality",
      description: "Select your preferred quality from the available options and start downloading.",
    },
  ];

  return (
    <section className="w-full" data-testid="how-to-section">
      {/* How to Download */}
      <div className="mb-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">
          How to Download {platformNames[platform]} Videos
        </h2>
        <p className="text-muted-foreground mb-8">
          Download videos in three simple steps
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative p-6 rounded-2xl bg-secondary/30 border border-border/50"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold mb-4">
                {step.step}
              </div>
              <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold mb-2">
          Why Choose SaveFlex?
        </h2>
        <p className="text-muted-foreground mb-8">
          The best free video downloader for all your needs
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors duration-300"
            >
              <feature.icon className="w-10 h-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowToSection;
