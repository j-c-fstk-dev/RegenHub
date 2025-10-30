
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';

const problemItems = [
  'Regeneration is happening — but it’s often invisible.',
  'Grassroots initiatives lack formal recognition for their work.',
  'Difficulty in proving and tracking small-scale regenerative impact.',
  'Lack of accessible tools for transparent, decentralized validation.',
];

const solutionItems = [
  'A public, verifiable registry of regenerative actions.',
  'A trust-building system with AI-assisted human validation.',
  'Digital certificates for each approved action.',
  'Public profiles for organizations to showcase their track record.',
  'A simple way for projects to demonstrate their impact to funders.',
  'An open platform to connect the global regenerative movement.',
];

const Intro = () => {
  return (
    <section className="py-16 lg:py-24">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-headline text-3xl font-bold text-primary md:text-4xl">
            Making Local Impact Visible
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Regen Impact addresses a profound challenge: countless positive environmental actions go unseen and unrecorded. We provide the tools to change that, turning isolated efforts into a visible, collective force for global regeneration.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:gap-12">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                <XCircle className="h-6 w-6 text-destructive" />
                The Problem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {problemItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-destructive/50" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                <CheckCircle className="h-6 w-6 text-primary" />
                The Solution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {solutionItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-4 w-4 shrink-0 text-primary" />
                    <span className="font-medium text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Intro;
