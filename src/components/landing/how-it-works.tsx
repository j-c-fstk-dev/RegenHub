import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { HandHeart, FilePenLine, ShieldCheck, GalleryVertical, Award, FileOutput } from "lucide-react";

const steps = [
    {
      icon: HandHeart,
      title: "Act",
      description: "Do something regenerative in the real world."
    },
    {
      icon: FilePenLine,
      title: "Submit",
      description: "Fill out a short form with info, media, and an optional tag."
    },
    {
      icon: ShieldCheck,
      title: "Verify",
      description: "Our curators or your community confirms the action."
    },
    {
      icon: GalleryVertical,
      title: "Show",
      description: "The intent appears on the Public Impact Wall."
    },
    {
      icon: Award,
      title: "Own",
      description: "You get a digital certificate and your own impact dashboard."
    },
    {
      icon: FileOutput,
      title: "Use",
      description: "Export your data. Inspire others. Build a track record."
    }
  ];
  

const HowItWorks = () => {
  return (
    <section className="py-16 lg:py-24">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-headline text-3xl font-bold text-primary md:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A simple, transparent process to turn your actions into verifiable impact.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={step.title} className="text-center">
                <CardHeader>
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <step.icon className="h-7 w-7" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                    <CardTitle className="font-headline text-xl">{index + 1}. {step.title}</CardTitle>
                    <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
