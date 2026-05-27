import { useEffect } from "react";

const SITE_URL = "https://saveflex.net";
const DEFAULT_OG_IMAGE = "https://saveflex.net/og-image.png";

/**
 * Updates (or creates) a <meta> tag by name or property.
 */
const setMetaTag = (attr, key, content) => {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

/**
 * Updates (or creates) the canonical <link> tag.
 */
const setCanonical = (href) => {
  if (!href) return;
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

/**
 * Inject (or replace) a JSON-LD script tag identified by id.
 */
const setJsonLd = (id, data) => {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    document.head.appendChild(el);
  }
  el.text = JSON.stringify(data);
};

/**
 * Remove a JSON-LD script (used on unmount to keep the head clean).
 */
const removeJsonLd = (id) => {
  const el = document.getElementById(id);
  if (el) el.remove();
};

export const SEO = ({
  title,
  description,
  path = "/",
  ogImage = DEFAULT_OG_IMAGE,
  faqs = [],
  breadcrumbs = [],
  schemas = [],
}) => {
  useEffect(() => {
    const url = `${SITE_URL}${path}`;

    // Title + meta
    if (title) document.title = title;
    setMetaTag("name", "description", description);
    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:url", url);
    setMetaTag("property", "og:type", "website");
    setMetaTag("property", "og:image", ogImage);
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", title);
    setMetaTag("name", "twitter:description", description);
    setMetaTag("name", "twitter:image", ogImage);
    setCanonical(url);

    // JSON-LD: FAQ
    const injectedIds = [];
    if (faqs && faqs.length > 0) {
      const faqLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.answer,
          },
        })),
      };
      setJsonLd("jsonld-faq", faqLd);
      injectedIds.push("jsonld-faq");
    }

    // JSON-LD: Breadcrumbs
    if (breadcrumbs && breadcrumbs.length > 0) {
      const breadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((b, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: b.name,
          item: `${SITE_URL}${b.path}`,
        })),
      };
      setJsonLd("jsonld-breadcrumb", breadcrumbLd);
      injectedIds.push("jsonld-breadcrumb");
    }

    // JSON-LD: custom schemas (SoftwareApplication, WebPage, etc.)
    (schemas || []).forEach((schema, i) => {
      const id = `jsonld-extra-${i}`;
      setJsonLd(id, schema);
      injectedIds.push(id);
    });

    return () => {
      injectedIds.forEach(removeJsonLd);
    };
  }, [title, description, path, ogImage, faqs, breadcrumbs, schemas]);

  return null;
};

export default SEO;
