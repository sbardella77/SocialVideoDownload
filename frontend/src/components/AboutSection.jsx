import { pages } from "@/seo/siteData.mjs";

// Crawlable page copy plus a short "at a glance" fact list. The same text
// is written into the static HTML by scripts/prerender.mjs.
export const AboutSection = ({ page: key }) => {
  const { about, facts } = pages[key];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-12" data-testid="about-section">
      <div className="lg:col-span-3">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">{about.heading}</h2>
        <div className="prose prose-invert prose-lg max-w-none text-muted-foreground">
          {about.paragraphs.map((p, i) => (
            <p key={i} className={i < about.paragraphs.length - 1 ? "mb-4" : undefined}>
              {p}
            </p>
          ))}
        </div>
      </div>
      <div className="lg:col-span-2">
        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
          SaveFlex at a glance
        </h3>
        <dl className="rounded-2xl border border-border/50 bg-secondary/30 divide-y divide-border/50 text-sm">
          {facts.map(([label, value]) => (
            <div key={label} className="flex gap-4 px-4 py-3">
              <dt className="w-32 shrink-0 font-medium text-foreground">{label}</dt>
              <dd className="text-muted-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};

export default AboutSection;
