
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Link, MapPin, Users, Calendar, Camera, HeartHandshake } from 'lucide-react';
import Image from 'next/image';

const conceptLinks = [
  { icon: Users, text: 'An Organization, Collective, or Group' },
  { icon: MapPin, text: 'A Project with a clear goal' },
  { icon: Camera, text: 'Verifiable Evidence (photos, videos, docs)' },
  { icon: HeartHandshake, text: 'A clear Regenerative Impact' },
];

const Concept = () => {
  const conceptImage = PlaceHolderImages.find((img) => img.id === 'concept-image');

  return (
    <section className="bg-secondary py-16 lg:py-24">
      <div className="container grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-6">
          <h2 className="font-headline text-3xl font-bold text-primary md:text-4xl">
            What Is a Verified Action?
          </h2>
          <p className="text-lg text-muted-foreground">
            A verified action is a declaration of real-world work, validated by our hybrid AI + human review process. It’s not just a claim — it’s a credible piece of impact data.
          </p>
          <p className="text-lg text-muted-foreground">
            In RegenImpactHub, every submitted action is linked to:
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
