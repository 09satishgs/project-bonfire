import { PageHero } from "@/components/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const faqs = [
  {
    question: "How does PoGo-Bonfire find players so quickly?",
    answer:
      "The app syncs a public Google Sheet into IndexedDB, then all searches and filters run locally against in-memory Zustand state.",
  },
  {
    question: "Why does registration use the API route?",
    answer:
      "New submissions need validation, duplicate IGN checks, bot filtering, rate limiting, and a secure Google service account key, so writes stay server-side.",
  },
  {
    question: "What does the wishlist do?",
    answer:
      "If you search for an IGN that is missing, you can save it locally. After the next fresh sync, the app cross-checks your saved names and shows a match if that trainer joined.",
  },
  {
    question: "Can I correct or report a bad entry?",
    answer:
      "Yes. Every player card includes a prefilled mailto link so moderators can review corrections manually.",
  },
];

export function FaqPage() {
  return (
    <>
      <PageHero
        badge="FAQ route"
        description="A quick guide to the directory, the cache model, and how moderation and registrations work."
        title="Frequently asked questions."
      />

      <section className="grid gap-4">
        {faqs.map((item) => (
          <Card className="border-white/70 bg-white/82" key={item.question}>
            <CardHeader>
              <CardTitle>{item.question}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{item.answer}</CardContent>
          </Card>
        ))}
      </section>
    </>
  );
}
