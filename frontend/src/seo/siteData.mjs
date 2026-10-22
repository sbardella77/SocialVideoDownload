// Single source of truth for page metadata, FAQs and crawlable copy.
// Plain ESM with no JSX so that both the React app and the build-time
// prerender script (scripts/prerender.mjs) can import it.

export const SITE_URL = "https://saveflex.net";
export const SITE_NAME = "SaveFlex";
export const OG_IMAGE = `${SITE_URL}/og-image.png`;
export const LOGO = `${SITE_URL}/logo-512.png`;

export const navLinks = [
  { href: "/instagram-downloader", label: "Instagram" },
  { href: "/tiktok-downloader", label: "TikTok" },
  { href: "/youtube-downloader", label: "YouTube" },
  { href: "/x-downloader", label: "X" },
  { href: "/facebook-downloader", label: "Facebook" },
];

export const generalFaqs = [
  {
    question: "Is SaveFlex free to use?",
    answer:
      "Yes, SaveFlex is completely free to use. We support our service through non-intrusive advertising. There are no hidden fees or premium subscriptions required.",
  },
  {
    question: "Do I need to create an account?",
    answer:
      "No, SaveFlex is completely anonymous. You don't need to create an account, sign up, or provide any personal information. Just paste your link and download.",
  },
  {
    question: "Is it legal to download videos?",
    answer:
      "SaveFlex is a tool for personal use only. Downloading content you own or have permission to download is generally legal. However, downloading copyrighted content without permission may violate laws and platform terms of service. Users are responsible for ensuring compliance.",
  },
  {
    question: "What video quality can I download?",
    answer:
      "SaveFlex provides the highest quality available for each video. This typically includes HD (720p), Full HD (1080p), and sometimes 4K options depending on the original upload quality.",
  },
  {
    question: "Why isn't my download working?",
    answer:
      "If a download isn't working, the content might be private, deleted, or region-restricted. Try refreshing the page and pasting the link again. If the problem persists, the content may not be accessible.",
  },
  {
    question: "How many videos can I download?",
    answer:
      "There's no strict limit on downloads, but we have rate limiting in place to prevent abuse (approximately 30 requests per minute). This ensures fair access for all users.",
  },
];

const xFaqs = [
  {
    question: "How do I download X videos?",
    answer:
      "Click the share button on an X post containing a video, select 'Copy link to post', and paste it into SaveFlex.",
  },
  {
    question: "Can I download GIFs from X?",
    answer: "Yes! SaveFlex supports downloading both videos and GIFs from X posts.",
  },
  {
    question: "Does SaveFlex work with twitter.com links?",
    answer:
      "Yes. SaveFlex accepts both x.com and twitter.com post links, so old Twitter links work the same way as new X links.",
  },
];

export const platformFaqs = {
  youtube: [
    {
      question: "How do I download YouTube videos?",
      answer:
        "Simply copy the YouTube video URL from your browser or app, paste it into the SaveFlex input field, and click Download. You'll see available quality options to choose from.",
    },
    {
      question: "Can I download YouTube Shorts?",
      answer:
        "Yes! SaveFlex fully supports YouTube Shorts. Just paste the Shorts URL and download like any other video.",
    },
    {
      question: "Can I download YouTube playlists?",
      answer:
        "Currently, SaveFlex downloads individual videos. For playlists, you'll need to download each video separately.",
    },
  ],
  instagram: [
    {
      question: "How do I download Instagram Reels?",
      answer:
        "Open the Reel on Instagram, tap the three dots menu, select 'Link', copy it, then paste it into SaveFlex to download.",
    },
    {
      question: "Can I download Instagram Stories?",
      answer:
        "SaveFlex supports downloading public Instagram Stories when you have the direct story link. Private accounts' stories cannot be downloaded.",
    },
    {
      question: "Why can't I download some Instagram content?",
      answer:
        "Private accounts' content cannot be downloaded. Make sure the account is public and the content hasn't been deleted.",
    },
  ],
  tiktok: [
    {
      question: "Can I download TikTok videos without watermark?",
      answer:
        "Yes! SaveFlex provides watermark-free downloads for TikTok videos whenever possible, giving you clean videos for personal use.",
    },
    {
      question: "How do I get a TikTok video link?",
      answer:
        "Open the TikTok video, tap 'Share', then 'Copy Link'. Paste this link into SaveFlex to download.",
    },
  ],
  x: xFaqs,
  twitter: xFaqs,
  facebook: [
    {
      question: "How do I download Facebook videos?",
      answer:
        "Click the three dots on a Facebook video post, select 'Copy link', and paste it into SaveFlex. Make sure the video is from a public post.",
    },
    {
      question: "Why can't I download Facebook videos?",
      answer:
        "Facebook videos from private profiles or groups cannot be downloaded. Only public content is accessible.",
    },
  ],
};

export const faqsFor = (platform) =>
  platform === "general"
    ? generalFaqs
    : [...(platformFaqs[platform] || []), ...generalFaqs.slice(0, 3)];

const platformNames = {
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
  twitter: "X",
  facebook: "Facebook",
  general: "social media",
};

export const howToSteps = (platform = "general") => [
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

// Short, quotable facts. Search engines and AI assistants lift answers
// from lists like this, so keep every line literally true.
const baseFacts = [
  ["Price", "Free, supported by ads"],
  ["Account", "Not required, no login or signup"],
  ["Software", "None, works in the browser"],
  ["Devices", "iPhone, Android, Windows, macOS and Linux"],
  ["Content", "Public posts only, private content is not accessible"],
];

export const pages = {
  home: {
    path: "/",
    platform: "general",
    title: "SaveFlex – Free Video Downloader for YouTube, TikTok & More",
    description:
      "SaveFlex is a free online video downloader. Save videos from YouTube, TikTok, Instagram, Facebook and X as MP4 in seconds, with no signup and no app.",
    h1: "Every video you love, saved in one click.",
    intro:
      "The free video downloader for YouTube, TikTok, Instagram, Facebook and X. Paste a link and SaveFlex gets it ready to download in high quality.",
    about: {
      heading: "The Best Free Video Downloader Online",
      paragraphs: [
        "SaveFlex is your go-to solution for downloading videos from social media platforms. Whether you want to save a YouTube tutorial, download an Instagram Reel, grab a viral TikTok, save a Twitter video, or download Facebook content - we've got you covered.",
        "Our service is completely free, requires no registration, and works on any device. We prioritize your privacy by not storing any personal data or download history. Simply paste your link, choose your quality, and download.",
        "SaveFlex supports multiple quality options including HD and Full HD downloads when available. For TikTok videos, we even offer watermark-free downloads for a cleaner viewing experience.",
      ],
    },
    facts: [
      ["What it is", "A free web-based video downloader"],
      ["Supported sites", "YouTube, TikTok, Instagram, Facebook and X (Twitter)"],
      ["Output", "MP4 video, in the qualities the source offers (up to 4K)"],
      ...baseFacts,
    ],
  },
  youtube: {
    path: "/youtube-downloader",
    platform: "youtube",
    label: "YouTube Downloader",
    title: "YouTube Downloader – Save Videos & Shorts in HD | SaveFlex",
    description:
      "Download YouTube videos and Shorts online as MP4 in HD, Full HD or 4K when available. Free, fast, no signup and no software. Works on mobile and desktop.",
    h1Lead: "Download YouTube Videos",
    h1Accent: "in HD Quality",
    intro:
      "Save YouTube videos, shorts, and music in multiple quality options. Free, fast, and no software needed.",
    about: {
      heading: "Free YouTube Video Downloader Online",
      paragraphs: [
        "SaveFlex provides the easiest way to download YouTube videos online. Support for all video formats including MP4, with quality options from 360p to 4K when available.",
        "Our YouTube downloader works with regular videos, YouTube Shorts, and live stream recordings. Simply paste the video URL and choose your preferred quality to start downloading.",
        "Perfect for saving tutorials, music videos, documentaries, or any YouTube content for offline viewing. No registration or software installation required.",
      ],
    },
    facts: [
      ["Supports", "YouTube videos, Shorts and recorded live streams"],
      ["Output", "MP4, from 360p up to 4K when the upload has it"],
      ["Playlists", "One video at a time"],
      ...baseFacts,
    ],
  },
  instagram: {
    path: "/instagram-downloader",
    platform: "instagram",
    label: "Instagram Downloader",
    title: "Instagram Downloader – Save Reels, Videos & Stories | SaveFlex",
    description:
      "Download Instagram Reels, video posts and Stories from public accounts in original quality. Free, no login, works on iPhone, Android and desktop.",
    h1Lead: "Download Instagram",
    h1Accent: "Reels & Videos",
    intro:
      "Save Instagram Reels, posts, stories, and IGTV videos in high quality. Free, fast, and no login required.",
    about: {
      heading: "Best Free Instagram Video Downloader",
      paragraphs: [
        "SaveFlex's Instagram Downloader lets you save Instagram content with ease. Download Instagram Reels, regular video posts, IGTV videos, and carousel posts in their original quality.",
        "Our tool supports all types of Instagram content from public accounts. Simply copy the Instagram URL, paste it above, and download your content in seconds. No app installation or login required.",
        "Whether you're saving travel inspiration, workout videos, cooking tutorials, or memorable moments shared by friends and creators, SaveFlex makes it simple and free.",
      ],
    },
    facts: [
      ["Supports", "Reels, video posts, IGTV and Stories from public accounts"],
      ["Output", "MP4 in the original upload quality"],
      ...baseFacts,
    ],
  },
  tiktok: {
    path: "/tiktok-downloader",
    platform: "tiktok",
    label: "TikTok Downloader",
    title: "TikTok Downloader Without Watermark – HD MP4 | SaveFlex",
    description:
      "Download TikTok videos without watermark in HD MP4. Free, fast and works on iPhone, Android, tablet and desktop. No app and no login needed.",
    h1Lead: "Download TikTok Videos",
    h1Accent: "Without Watermark",
    intro:
      "Save TikTok videos in HD quality without the watermark. Fast, free, and works on any device.",
    about: {
      heading: "Best TikTok Video Downloader Without Watermark",
      paragraphs: [
        "SaveFlex offers the best TikTok downloader that removes the watermark automatically. Download your favorite TikTok videos in high quality without the distracting TikTok logo.",
        "Our TikTok saver works with all TikTok content - regular videos, duets, stitches, and viral trends. Just paste the TikTok link and get a clean, watermark-free video in seconds.",
        "Perfect for content creators, social media managers, or anyone who wants to save TikTok videos for offline viewing without the watermark overlay.",
      ],
    },
    facts: [
      ["Supports", "TikTok videos, duets and stitches"],
      ["Watermark", "Removed whenever the source allows it"],
      ["Output", "HD MP4"],
      ...baseFacts,
    ],
  },
  x: {
    path: "/x-downloader",
    platform: "x",
    label: "X Downloader",
    title: "Twitter (X) Video Downloader Online – Free MP4 | SaveFlex",
    description:
      "Download videos and GIFs from X (Twitter) online. Paste any x.com or twitter.com link and save the video as HD MP4. Free, fast and no login required.",
    h1Lead: "Download X",
    h1Accent: "Videos & GIFs",
    intro:
      "Save videos and GIFs from X in high quality. Fast, free, and works with any public post.",
    about: {
      heading: "Best X Video Downloader Online",
      paragraphs: [
        "SaveFlex makes it easy to download videos and GIFs from X (formerly Twitter). Save viral videos, news clips, sports highlights, and more from any public post.",
        "Our X video downloader supports multiple quality options when available, letting you choose between different bitrates for the best balance of quality and file size.",
        "Works with both x.com and twitter.com URLs. Just paste the post link containing the video or GIF you want to save and download instantly.",
      ],
    },
    facts: [
      ["Supports", "Videos and GIFs from public X (Twitter) posts"],
      ["Links", "x.com and twitter.com"],
      ["Output", "MP4 in the bitrates X provides"],
      ...baseFacts,
    ],
  },
  facebook: {
    path: "/facebook-downloader",
    platform: "facebook",
    label: "Facebook Downloader",
    title: "Facebook Video Downloader – Reels & Videos in HD | SaveFlex",
    description:
      "Download Facebook videos and Reels in HD or SD quality. Free, fast and no Facebook login required. Works with public posts and pages.",
    h1Lead: "Download Facebook",
    h1Accent: "Videos & Reels",
    intro:
      "Save Facebook videos and Reels in HD and SD quality. Free, fast, and no Facebook login required.",
    about: {
      heading: "Free Facebook Video Downloader Online",
      paragraphs: [
        "SaveFlex lets you download Facebook videos and Reels with ease. Save videos from public Facebook posts, pages, and groups in HD or SD quality.",
        "Our Facebook video downloader works with all public video content. Simply copy the video URL from Facebook, paste it above, and choose your preferred quality to download.",
        "Perfect for saving memorable videos, funny clips, news content, or any public Facebook video for offline viewing.",
      ],
    },
    facts: [
      ["Supports", "Videos and Reels from public posts and pages"],
      ["Output", "MP4 in HD or SD"],
      ...baseFacts,
    ],
  },
};

export const pageH1 = (page) => page.h1 || `${page.h1Lead} ${page.h1Accent}`;

const organization = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: LOGO,
};

const website = {
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  alternateName: ["Save Flex", "saveflex.net"],
  url: `${SITE_URL}/`,
  inLanguage: "en",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

/**
 * JSON-LD blocks for a page, as [{ id, data }]. The ids are shared by the
 * prerendered HTML and the runtime <SEO> component so client-side
 * navigation replaces the blocks instead of duplicating them.
 */
export const buildJsonLd = (key) => {
  const page = pages[key];
  const url = `${SITE_URL}${page.path}`;
  const isHome = key === "home";
  const appName = isHome ? `${SITE_NAME} Video Downloader` : `${SITE_NAME} ${page.label}`;

  const graph = [
    organization,
    website,
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: page.title,
      description: page.description,
      inLanguage: "en",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${url}#app` },
      primaryImageOfPage: OG_IMAGE,
    },
    {
      "@type": "WebApplication",
      "@id": `${url}#app`,
      name: appName,
      url,
      description: page.description,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Any (web browser)",
      browserRequirements: "Requires JavaScript",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ];

  if (!isHome) {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: page.label, item: url },
      ],
    });
    graph.push({
      "@type": "HowTo",
      name: `How to download ${platformNames[page.platform]} videos`,
      totalTime: "PT30S",
      step: howToSteps(page.platform).map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.title,
        text: s.description,
      })),
    });
  }

  return [
    { id: "jsonld-graph", data: { "@context": "https://schema.org", "@graph": graph } },
    {
      id: "jsonld-faq",
      data: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqsFor(page.platform).map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
    },
  ];
};
