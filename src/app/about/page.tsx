
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AboutPage = () => {
  return (
    <div className="container py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-12 text-center">
          <h1 className="font-headline text-4xl font-bold text-primary md:text-5xl">
            About Regen Hub
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Understanding the core philosophy behind Regen Hub.
          </p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">The Concept: What Is a Regenerative Intent?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-lg text-foreground/80">
            <p>
              An intent is a declaration of ecological action. It’s not just what you did — it’s what you meant to do for the living world. Each intent can be linked to a person, group, or school, a location, a time, a proof (photos, video, testimony), and a cause (reforestation, cleanup, education, mutual aid).
            </p>
            <p>
              In Regen Hub, intents are not just published — they are invited into collective meaning. It's a shift from isolated actions to a connected, visible ecosystem of positive impact.
            </p>
            <p>
              This project is built on principles from movements like Monthly Earth Day, ReFi (Regenerative Finance), and the broader goals of Web3 to create transparent, decentralized, and user-owned systems. We aim to do this without the jargon, making it accessible for everyone.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AboutPage;
