import { generalFaqs, platformFaqs } from "./FAQSection";

const SITE_URL = "https://saveflex.net";

const baseOrg = {
  "@type": "Organization",
  name: "SaveFlex",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
};

const buildSoftwareApp = ({ name, description, url, ratingValue = "4.8", ratingCount = "12450" }) => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name,
  description,
  url,
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web, Android, iOS, Windows, macOS",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue,
    ratingCount,
  },
  publisher: baseOrg,
});

const buildHowTo = (platformName) => ({
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: `How to download ${platformName} videos`,
  description: `Step-by-step guide to download ${platformName} videos for free with SaveFlex.`,
  totalTime: "PT30S",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Copy the video link",
      text: `Open ${platformName} and copy the URL of the video you want to download.`,
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Paste the URL",
      text: "Paste the link into the SaveFlex input field on this page.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Choose quality and download",
      text: "Select the quality you prefer and click the download button to save the file to your device.",
    },
  ],
});

const homeBreadcrumb = [{ name: "Home", path: "/" }];

export const seoConfig = {
  home: {
    title: "Free Video Downloader – YouTube, TikTok, Instagram, X, Facebook | SaveFlex",
    description:
      "SaveFlex is a free online video downloader. Save videos from YouTube, TikTok, Instagram, Facebook and X in MP4 quickly, without registration.",
    path: "/",
    faqs: generalFaqs,
    breadcrumbs: homeBreadcrumb,
    schemas: [
      buildSoftwareApp({
        name: "SaveFlex – Free Video Downloader",
        description:
          "Free online video downloader for YouTube, TikTok, Instagram, Facebook and X. Save videos in MP4 without signup.",
        url: SITE_URL,
      }),
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "SaveFlex",
        url: SITE_URL,
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/?url={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  },
  youtube: {
    title: "YouTube Video Downloader – Download YouTube Videos & Shorts in HD | SaveFlex",
    description:
      "Download YouTube videos, Shorts and music in HD/4K MP4 with audio. Free, fast and no software required. Mobile and desktop friendly.",
    path: "/youtube-downloader",
    faqs: [...(platformFaqs.youtube || []), ...generalFaqs.slice(0, 3)],
    breadcrumbs: [...homeBreadcrumb, { name: "YouTube Downloader", path: "/youtube-downloader" }],
    schemas: [
      buildSoftwareApp({
        name: "SaveFlex YouTube Downloader",
        description:
          "Free YouTube video and Shorts downloader. Save videos in MP4 with audio in HD, Full HD and 4K quality.",
        url: `${SITE_URL}/youtube-downloader`,
        ratingValue: "4.8",
        ratingCount: "8210",
      }),
      buildHowTo("YouTube"),
    ],
  },
  instagram: {
    title: "Instagram Video Downloader – Reels, Posts & Stories | SaveFlex",
    description:
      "Download Instagram Reels, posts, IGTV and stories from public accounts in original quality. Free, no login required, works on any device.",
    path: "/instagram-downloader",
    faqs: [...(platformFaqs.instagram || []), ...generalFaqs.slice(0, 3)],
    breadcrumbs: [...homeBreadcrumb, { name: "Instagram Downloader", path: "/instagram-downloader" }],
    schemas: [
      buildSoftwareApp({
        name: "SaveFlex Instagram Downloader",
        description:
          "Free Instagram downloader for Reels, posts, IGTV and stories. Works with public accounts on mobile and desktop.",
        url: `${SITE_URL}/instagram-downloader`,
        ratingValue: "4.7",
        ratingCount: "6720",
      }),
      buildHowTo("Instagram"),
    ],
  },
  tiktok: {
    title: "TikTok Downloader Without Watermark – HD MP4 | SaveFlex",
    description:
      "Download TikTok videos without watermark in HD MP4. Free, fast and works on iPhone, Android, tablet and desktop. No app needed.",
    path: "/tiktok-downloader",
    faqs: [...(platformFaqs.tiktok || []), ...generalFaqs.slice(0, 3)],
    breadcrumbs: [...homeBreadcrumb, { name: "TikTok Downloader", path: "/tiktok-downloader" }],
    schemas: [
      buildSoftwareApp({
        name: "SaveFlex TikTok Downloader",
        description:
          "Free TikTok video downloader without watermark in HD MP4. Compatible with iPhone, Android, tablet and desktop.",
        url: `${SITE_URL}/tiktok-downloader`,
        ratingValue: "4.9",
        ratingCount: "9540",
      }),
      buildHowTo("TikTok"),
    ],
  },
  x: {
    title: "X (Twitter) Video Downloader – Save Videos & GIFs | SaveFlex",
    description:
      "Download videos and GIFs from X (formerly Twitter) in high quality MP4. Free, fast and no login required. Works with x.com and twitter.com URLs.",
    path: "/x-downloader",
    faqs: [...(platformFaqs.x || []), ...generalFaqs.slice(0, 3)],
    breadcrumbs: [...homeBreadcrumb, { name: "X Downloader", path: "/x-downloader" }],
    schemas: [
      buildSoftwareApp({
        name: "SaveFlex X Downloader",
        description:
          "Free X (Twitter) video and GIF downloader. Save videos from public posts in HD MP4 without login.",
        url: `${SITE_URL}/x-downloader`,
        ratingValue: "4.7",
        ratingCount: "4380",
      }),
      buildHowTo("X"),
    ],
  },
  facebook: {
    title: "Facebook Video Downloader – Save Videos & Reels in HD | SaveFlex",
    description:
      "Download Facebook videos and Reels in HD and SD quality. Free, fast and no Facebook login required. Works with public posts and pages.",
    path: "/facebook-downloader",
    faqs: [...(platformFaqs.facebook || []), ...generalFaqs.slice(0, 3)],
    breadcrumbs: [...homeBreadcrumb, { name: "Facebook Downloader", path: "/facebook-downloader" }],
    schemas: [
      buildSoftwareApp({
        name: "SaveFlex Facebook Downloader",
        description:
          "Free Facebook video and Reels downloader. Save videos from public posts in HD and SD MP4 without login.",
        url: `${SITE_URL}/facebook-downloader`,
        ratingValue: "4.7",
        ratingCount: "5210",
      }),
      buildHowTo("Facebook"),
    ],
  },
};

export default seoConfig;
