
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AboutPage = () => {
  return (
    <div className="container py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-12 text-center">
          <h1 className="font-headline text-4xl font-bold text-primary md:text-5xl">
            About Regen Impact
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Understanding the core philosophy behind Regen Impact.
          </p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">The Concept: What Is a Regenerative Action?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-lg text-foreground/80">
            <p>
              An action is a declaration of real-world regenerative work. It’s not just what you did — it’s the proof of your commitment to the living world. Each action is linked to an organization, a project, a location, a time, and verifiable evidence (photos, videos, documents).
            </p>
            <p>
              In Regen Impact, actions are not just logged — they are validated and given collective meaning. It's a shift from isolated efforts to a connected, visible ecosystem of positive impact, building credibility for grassroots organizations.
            </p>
            <p>
              This project is built on principles from movements like ReFi (Regenerative Finance) and the broader goals of Web3 to create transparent, decentralized, and user-owned systems. We aim to do this without the jargon, making it accessible for everyone.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AboutPage;
