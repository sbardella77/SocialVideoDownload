import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqsFor } from "@/seo/siteData.mjs";

export const FAQSection = ({ platform = "general" }) => {
  const faqs = faqsFor(platform);

  return (
    <section className="w-full" data-testid="faq-section">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">
        Frequently Asked Questions
      </h2>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq) => (
          <AccordionItem key={faq.question} value={faq.question} className="faq-item">
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
