import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Link, MapPin, Users, Calendar, Camera, HeartHandshake } from 'lucide-react';
import Image from 'next/image';

const conceptLinks = [
  { icon: Users, text: 'A person, group, or school' },
  { icon: MapPin, text: 'A location' },
  { icon: Calendar, text: 'A time' },
  { icon: Camera, text: 'A proof (photos, video, testimony)' },
  { icon: HeartHandshake, text: 'A cause (reforestation, cleanup, education, etc.)' },
];

const Concept = () => {
  const conceptImage = PlaceHolderImages.find((img) => img.id === 'concept-image');

  return (
    <section className="bg-secondary py-16 lg:py-24">
      <div className="container grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-6">
          <h2 className="font-headline text-3xl font-bold text-primary md:text-4xl">
            What Is a Regenerative Intent?
          </h2>
          <p className="text-lg text-muted-foreground">
            An intent is a declaration of ecological action. It’s not just what you did — it’s what you meant to do for the living world.
          </p>
          <p className="text-lg text-muted-foreground">
            In Regen Hub, intents are not just published — they are invited into collective meaning. Each intent can be linked to:
          </p>
          <ul className="space-y-3">
            {conceptLinks.map((item) => (
              <li key={item.text} className="flex items-center gap-3">
                <item.icon className="h-5 w-5 text-primary" />
                <span className="font-medium">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
        {conceptImage && (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <Image
                src={conceptImage.imageUrl}
                alt={conceptImage.description}
                width={800}
                height={600}
                className="h-full w-full object-cover"
                data-ai-hint={conceptImage.imageHint}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
};

export default Concept;
