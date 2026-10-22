// Post-build step: write one static HTML file per route so that crawlers
// which do not run JavaScript (most AI answer engines, social previews)
// and the first paint for everyone see the right title, canonical,
// JSON-LD and page copy. React replaces the #root content when it mounts.
//
// Also writes 404.html (served by Vercel with a real 404 status) and
// sitemap.xml.

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SITE_URL,
  OG_IMAGE,
  navLinks,
  pages,
  pageH1,
  faqsFor,
  howToSteps,
  buildJsonLd,
} from "../src/seo/siteData.mjs";

const buildDir = join(dirname(fileURLToPath(import.meta.url)), "..", "build");
const template = readFileSync(join(buildDir, "index.html"), "utf8");

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// JSON inside <script> only needs "<" escaped to be safe.
const jsonForScript = (data) => JSON.stringify(data).replace(/</g, "\\u003c");

const stripHeadTags = (html) =>
  html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name="(description|robots)"[^>]*>/gi, "")
    .replace(/<meta\s+(property|name)="(og:(title|description|url|image)|twitter:(title|description|image))"[^>]*>/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>/gi, "");

const headFor = ({ title, description, url, noindex, jsonLd }) => {
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="robots" content="${noindex ? "noindex, follow" : "index, follow, max-image-preview:large"}">`,
  ];
  if (description) tags.push(`<meta name="description" content="${esc(description)}">`);
  if (url) {
    tags.push(
      `<link rel="canonical" href="${url}">`,
      `<meta property="og:title" content="${esc(title)}">`,
      `<meta property="og:description" content="${esc(description)}">`,
      `<meta property="og:url" content="${url}">`,
      `<meta property="og:image" content="${OG_IMAGE}">`,
      `<meta name="twitter:title" content="${esc(title)}">`,
      `<meta name="twitter:description" content="${esc(description)}">`,
      `<meta name="twitter:image" content="${OG_IMAGE}">`
    );
  }
  (jsonLd || []).forEach(({ id, data }) => {
    tags.push(`<script type="application/ld+json" id="${id}">${jsonForScript(data)}</script>`);
  });
  return tags.join("");
};

const nav = () =>
  `<header class="border-b border-border/60"><nav class="max-w-7xl mx-auto px-4 py-4 flex flex-wrap gap-4 items-center text-sm">` +
  `<a href="/" class="font-bold text-lg mr-4">SaveFlex</a>` +
  navLinks.map((l) => `<a href="${l.href}" class="text-muted-foreground">${esc(l.label)} Downloader</a>`).join("") +
  `</nav></header>`;

const pageBody = (key) => {
  const page = pages[key];
  const steps = howToSteps(page.platform);
  const faqs = faqsFor(page.platform);
  return (
    nav() +
    `<main class="max-w-3xl mx-auto px-4 py-16">` +
    `<h1 class="text-4xl font-bold mb-4">${esc(pageH1(page))}</h1>` +
    `<p class="text-lg text-muted-foreground mb-12">${esc(page.intro)}</p>` +
    `<h2 class="text-2xl font-bold mb-4">How to download ${esc(page.platform === "general" ? "social media" : page.label.replace(" Downloader", ""))} videos</h2>` +
    `<ol class="mb-12">${steps.map((s) => `<li class="mb-2"><strong>${esc(s.title)}.</strong> ${esc(s.description)}</li>`).join("")}</ol>` +
    `<h2 class="text-2xl font-bold mb-4">${esc(page.about.heading)}</h2>` +
    page.about.paragraphs.map((p) => `<p class="text-muted-foreground mb-4">${esc(p)}</p>`).join("") +
    `<h3 class="font-semibold mt-8 mb-4">SaveFlex at a glance</h3>` +
    `<dl class="mb-12 text-sm">${page.facts.map(([k, v]) => `<div class="flex gap-4 py-1"><dt class="w-32 shrink-0 font-medium">${esc(k)}</dt><dd class="text-muted-foreground">${esc(v)}</dd></div>`).join("")}</dl>` +
    `<h2 class="text-2xl font-bold mb-4">Frequently Asked Questions</h2>` +
    faqs.map((f) => `<h3 class="font-medium mt-4">${esc(f.question)}</h3><p class="text-muted-foreground">${esc(f.answer)}</p>`).join("") +
    `</main>`
  );
};

const render = ({ head, body }) =>
  stripHeadTags(template)
    .replace("</head>", `${head}</head>`)
    .replace(/<div id="root"><\/div>/, `<div id="root">${body}</div>`);

const write = (relPath, html) => {
  writeFileSync(join(buildDir, relPath), html);
  console.log(`prerender: ${relPath}`);
};

for (const [key, page] of Object.entries(pages)) {
  const url = key === "home" ? `${SITE_URL}/` : `${SITE_URL}${page.path}`;
  const html = render({
    head: headFor({ title: page.title, description: page.description, url, jsonLd: buildJsonLd(key) }),
    body: pageBody(key),
  });
  // With cleanUrls in vercel.json, /tiktok-downloader serves tiktok-downloader.html.
  write(key === "home" ? "index.html" : `${page.path.slice(1)}.html`, html);
}

write(
  "404.html",
  render({
    head: headFor({ title: "Page not found | SaveFlex", noindex: true }),
    body: "",
  })
);

const today = new Date().toISOString().slice(0, 10);
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  Object.entries(pages)
    .map(([key, page]) => {
      const loc = key === "home" ? `${SITE_URL}/` : `${SITE_URL}${page.path}`;
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`;
    })
    .join("\n") +
  `\n</urlset>\n`;
write("sitemap.xml", sitemap);
