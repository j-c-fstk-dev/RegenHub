
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Fingerprint } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';

const PassportCta = () => {
    // A placeholder image for the passport section could be added here
    // For now, we focus on the text content.

    return (
        <section className="bg-secondary py-16 lg:py-24">
            <div className="container">
                 <div className="grid md:grid-cols-2 gap-12 items-center">
                     <div className="space-y-6">
                        <div className="inline-block rounded-full bg-primary/10 p-3 mb-4">
                           <Fingerprint className="h-7 w-7 text-primary"/>
                        </div>
                        <h2 className="font-headline text-3xl font-bold text-primary md:text-4xl">
                            Introducing Regen Passport
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Your verified impact builds your on-chain identity. Regen Passport connects your real-world actions to the digital ecosystem, creating a new form of reputation based on contribution.
                        </p>
                        <p className="text-muted-foreground">
                            It’s a living record of your regenerative journey, recognized across Web3 communities, DAOs, and ReFi projects.
                        </p>
                        <Button asChild size="lg" variant="secondary">
                           <Link href="/regen-passport">Discover Your Regen Identity</Link>
                        </Button>
                    </div>
                    <div>
                         <Image
                            src="https://picsum.photos/seed/regen-passport/800/600"
                            alt="A conceptual image of a digital passport with nature elements"
                            width={800}
                            height={600}
                            className="h-full w-full object-cover rounded-lg shadow-md"
                            data-ai-hint="digital identity nature"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PassportCta;
