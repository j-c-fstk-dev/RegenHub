
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";
import { Trees, School, Trash2, Recycle, Mic, Waves } from "lucide-react";

const exampleActions = [
  {
    icon: Trees,
    text: "Planted 5 native trees in a city sidewalk.",
    image: PlaceHolderImages.find((img) => img.id === 'plant-trees'),
  },
  {
    icon: School,
    text: "Hosted an environmental workshop at a local school.",
    image: PlaceHolderImages.find((img) => img.id === 'workshop'),
  },
  {
    icon: Trash2,
    text: "Removed 30kg of trash from a local river.",
    image: PlaceHolderImages.find((img) => img.id === 'river-cleanup'),
  },
  {
    icon: Recycle,
    text: "Built a community compost system for 10 families.",
    image: undefined,
  },
  {
    icon: Mic,
    text: "Gave a talk on seed sovereignty at a rural gathering.",
    image: undefined,
  },
  {
    icon: Waves,
    text: "Cleaned a beach with friends — and shared the story online.",
    image: undefined,
  },
];

const Examples = () => {
  return (
    <section className="bg-secondary py-16 lg:py-24">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-headline text-3xl font-bold text-primary md:text-4xl">
            Examples of Actions You Can Submit
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From small personal efforts to large community projects, every regenerative action matters.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {exampleActions.map((intent) => (
            <Card key={intent.text} className="flex flex-col overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl">
              {intent.image && (
                <div className="relative h-48 w-full">
                  <Image
                    src={intent.image.imageUrl}
                    alt={intent.image.description}
                    fill
                    className="object-cover"
                    data-ai-hint={intent.image.imageHint}
                  />
                </div>
              )}
              <CardHeader className="flex-grow">
                <CardTitle className="flex items-start gap-3 text-base font-medium">
                  <intent.icon className="h-10 w-10 shrink-0 text-accent" />
                  <span>{intent.text}</span>
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Examples;
