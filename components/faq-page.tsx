import { PageHero } from "@/components/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const faqs = [
  {
    question: "What is PoGo-Bonfire?",
    answer:
      "PoGo-Bonfire is a community-driven directory designed to help Pokémon GO players connect outside the game. It helps you find a way to contact a forever friend to coordinate Lucky Trades, organize Remote Raids, or just find friend codes to grind XP together.",
  },
  {
    question: "Is this app really free? Will there be ads?",
    answer:
      "Yes! PoGo-Bonfire is 100% free and completely ad-free. It was built by a fellow player for the community and is designed to stay that way.",
  },
  {
    question:
      "I just registered! Why isn't my IGN showing up in the search yet?",
    answer:
      "To keep the app lightning-fast and free for everyone, our system fetches new data in batches. It can take up to 12 hours for your newly registered IGN to appear in the global search. Check back a bit later!",
  },
  {
    question: "I made a typo or want to change my profile. How do I update it?",
    answer:
      "To prevent spam, profile updates are handled by our admin team. Search for your IGN, click 'Correct', and fill out the form in the app. It will generate an email draft for you. **Important:** If you are changing ownership or fixing a major error, please remember to manually attach a screenshot of your Pokémon GO profile to the email before sending it!",
  },
  {
    question:
      "Someone else registered my In-Game Name (IGN) as a joke. What do I do?",
    answer:
      "Don't panic, we can hand it back to you. Search for your IGN, click 'Report', and fill out the details. The app will open an email draft to our team. Please manually attach a screenshot of your Pokémon GO profile showing your IGN and buddy so we can verify you are the real owner and fix it.",
  },
  {
    question: "Why am I getting an error when trying to register?",
    answer:
      "Double-check that your IGN is between 3 and 15 characters and that you are using a valid link format for your chosen contact method (Reddit, Telegram, etc.). If everything looks right, you might have hit our anti-spam rate limit. Just wait about an hour and try again!",
  },
  {
    question: "Can I register multiple IGNs or alt accounts?",
    answer:
      "Currently, our system strictly enforces one registration per IGN to keep the directory clean and prevent duplicates.",
  },
  {
    question:
      "What happens if I search for someone and they aren't registered?",
    answer:
      "Add them to your Wishlist! You can click 'Notify me if they join' or add them directly on the Wishlist tab. Every time your app syncs with the global directory, it will automatically cross-check your Wishlist. If your friend registers in the future, they will pop up right there in your matches.",
  },
  {
    question: "Why did the registration form disappear from my home screen?",
    answer:
      "Once you successfully register your IGN on a device, the app remembers you and hides the form to keep your home screen clean. You'll now see your own player card with a '(YOU)' badge instead! If you need to register an alt account, you can do so from a different browser or device.",
  },
  {
    question: "Why isn't my preferred social media link accepted?",
    answer:
      "To keep the directory safe and consistent, we only support specific contact platforms (like Reddit, Telegram, X, ...etc) that are actively moderated. The app will auto-detect the platform when you paste your link. If your platform isn't supported yet, let us know and we might add it in the future if it is feasible!. Email us on " +
      process.env.NEXT_PUBLIC_ADMIN_EMAIL,
  },
  {
    question: "How do the tags work?",
    answer:
      "When registering, you can select up to 3 tags (like #SendGiftsEveryday or #WantForeverFriends) to let people know how you play. You can use these same tags on the Search page to filter the directory and find exactly the type of players you are looking for.",
  },
];
export function FaqPage() {
  return (
    <>
      <PageHero
        badge="FAQs"
        description={`Check the below Question/Answers. If you still have any questions drop an email to us on ${process.env.NEXT_PUBLIC_ADMIN_EMAIL}. We will try to get back to you at the earliest`}
        title="Frequently asked questions."
      />

      <section className="grid gap-4">
        {faqs.map((item) => (
          <Card className="border-white/70 bg-white/82" key={item.question}>
            <CardHeader>
              <CardTitle>{item.question}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {item.answer}
            </CardContent>
          </Card>
        ))}
      </section>
    </>
  );
}
