import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const generalFaqs = [
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

const platformFaqs = {
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
  x: [
    {
      question: "How do I download X videos?",
      answer:
        "Click the share button on an X post containing a video, select 'Copy link to post', and paste it into SaveFlex.",
    },
    {
      question: "Can I download GIFs from X?",
      answer:
        "Yes! SaveFlex supports downloading both videos and GIFs from X posts.",
    },
  ],
  twitter: [
    {
      question: "How do I download X videos?",
      answer:
        "Click the share button on an X post containing a video, select 'Copy link to post', and paste it into SaveFlex.",
    },
    {
      question: "Can I download GIFs from X?",
      answer:
        "Yes! SaveFlex supports downloading both videos and GIFs from X posts.",
    },
  ],
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

export const FAQSection = ({ platform = "general" }) => {
  const faqs = platform === "general" ? generalFaqs : [...(platformFaqs[platform] || []), ...generalFaqs.slice(0, 3)];

  return (
    <section className="w-full" data-testid="faq-section">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">
        Frequently Asked Questions
      </h2>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`} className="faq-item">
            <AccordionTrigger className="text-left text-base font-medium py-4 hover:text-primary">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pb-4">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};

export default FAQSection;
