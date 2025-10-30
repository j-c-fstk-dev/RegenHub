import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { HandHeart, FilePenLine, ShieldCheck, GalleryVertical, Award, FileOutput } from "lucide-react";

const steps = [
    {
      icon: HandHeart,
      title: "1. Create Org & Project",
      description: "Set up your organization and define your first regenerative project."
    },
    {
      icon: FilePenLine,
      title: "2. Submit Action",
      description: "Perform the work and submit a report with evidence (media, links)."
    },
    {
      icon: ShieldCheck,
      title: "3. AI-Assisted Review",
      description: "Our AI pre-checks the data, and a human validator reviews it for approval."
    },
    {
      icon: Award,
      title: "4. Get Certified",
      description: "Approved actions receive a score and a digital impact certificate."
    },
    {
      icon: GalleryVertical,
      title: "5. Showcase Impact",
      description: "Your action appears on the public wall and your organization's profile."
    },
    {
      icon: FileOutput,
      title: "6. Build Trust",
      description: "Use your verified track record to gain credibility and support."
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
                    <CardTitle className="font-headline text-xl">{step.title}</CardTitle>
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
