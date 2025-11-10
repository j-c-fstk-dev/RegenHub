
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { BrainCircuit, CheckCircle } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';

const LeapCta = () => {
    const leapImage = PlaceHolderImages.find((img) => img.id === 'leap-section-image');

    return (
        <section className="bg-background py-16 lg:py-24">
            <div className="container">
                 <div className="grid md:grid-cols-2 gap-12 items-center">
                    {leapImage && (
                        <Card className="overflow-hidden">
                            <CardContent className="p-0">
                            <Image
                                src={leapImage.imageUrl}
                                alt={leapImage.description}
                                width={800}
                                height={600}
                                className="h-full w-full object-cover"
                                data-ai-hint={leapImage.imageHint}
                            />
                            </CardContent>
                        </Card>
                    )}
                     <div className="space-y-6">
                        <div className="inline-block rounded-full bg-primary/10 p-3 mb-4">
                           <BrainCircuit className="h-7 w-7 text-primary"/>
                        </div>
                        <h2 className="font-headline text-3xl font-bold text-primary md:text-4xl">
                            LEAP for SMEs
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Our LEAP Assessment tool, adapted from the TNFD framework, helps small and medium-sized enterprises understand their relationship with nature.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-primary" />
                                <span>Evaluate your nature-related dependencies and impacts.</span>
                            </li>
                             <li className="flex items-start gap-3">
                                <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-primary" />
                                <span>Identify material risks and opportunities for your business.</span>
                            </li>
                             <li className="flex items-start gap-3">
                                <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-primary" />
                                <span>Generate an AI-assisted diagnostic report to share with stakeholders.</span>
                            </li>
                        </ul>
                        <Button asChild size="lg" variant="secondary">
                           <Link href="/leap">Learn More & Start Assessment</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LeapCta;
