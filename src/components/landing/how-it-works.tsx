import { HandHeart, FilePenLine, ShieldCheck, GalleryVertical, Award,FileOutput } from "lucide-react";

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

        <div className="relative mt-16">
          <div className="absolute left-1/2 top-4 hidden h-full w-px -translate-x-1/2 bg-border md:block" aria-hidden="true" />

          <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
            {steps.map((step, index) => (
              <div key={step.title} className={`flex items-start gap-6 ${index % 2 !== 0 ? 'md:flex-row-reverse md:text-right' : 'text-left'}`}>
                <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                    <step.icon className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-xl font-bold font-headline">{index + 1}. {step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
