import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import Link from 'next/link';

const Hero = () => {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-background');

  return (
    <section className="relative h-[60vh] min-h-[400px] w-full">
      {heroImage && (
        <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          fill
          className="object-cover"
          data-ai-hint={heroImage.imageHint}
          priority
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white">
        <div className="container max-w-4xl space-y-6">
          <h1 className="font-headline text-4xl font-bold leading-tight drop-shadow-md md:text-6xl">
            Where Regenerative Action Becomes Verifiable Impact.
          </h1>
          <p className="text-lg text-primary-foreground/90 drop-shadow-sm md:text-xl">
            RegenIntentOS is an open hub for tracking, validating, and celebrating real-world
            environmental intentions — by anyone, anywhere.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/register">Submit Your Intent</Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/impact">Explore the Public Impact Wall</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
