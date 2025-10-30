'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Locate, Scale, CheckSquare, LineChart, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase";

const leapSteps = [
    {
        icon: Locate,
        title: "L - Locate",
        description: "Map where your business interacts with nature, from its operations to the supply chain."
    },
    {
        icon: Scale,
        title: "E - Evaluate",
        description: "Evaluate your dependencies (what nature provides) and your impacts (the effects of your business)."
    },
    {
        icon: LineChart,
        title: "A - Assess",
        description: "Identify material risks (operational, regulatory) and opportunities (efficiency, new markets)."
    },
    {
        icon: CheckSquare,
        title: "P - Prepare",
        description: "Prepare to respond by setting a prioritized action plan with goals, deadlines, and owners."
    }
];

const LeapPage = () => {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useUser();
    const [isPending, startTransition] = useTransition();

    const handleStartAssessment = () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Access Denied', description: 'You need to be logged in to start an assessment.'});
            router.push('/login?redirect=/leap');
            return;
        }

        startTransition(async () => {
            try {
                const token = await user.getIdToken();
                if (!token) {
                     toast({ variant: 'destructive', title: 'Access Denied', description: 'Invalid session. Please log in again.' });
                     router.push('/login?redirect=/leap');
                     return;
                }

                const response = await fetch('/api/leap/start', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const result = await response.json();

                if (result.success && result.assessmentId) {
                    toast({ title: 'Assessment Started!', description: 'You have been redirected to the first step.' });
                    router.push(`/leap/assessment/${result.assessmentId}/l`);
                } else {
                    toast({ variant: 'destructive', title: 'Error', description: result.error || 'Could not start the assessment.' });
                    if (result.error?.includes('expired') || result.error?.includes('Unauthorized') || result.error?.includes('organization')) {
                        router.push('/login?redirect=/leap');
                    }
                }
            } catch (error) {
                 toast({ variant: 'destructive', title: 'Network Error', description: 'Could not connect to the server. Please try again.' });
            }
        });
    };

    return (
        <div className="container py-12">
            <header className="mb-12 text-center">
                <div className="inline-block rounded-full bg-primary/10 p-4 mb-4">
                    <BrainCircuit className="h-10 w-10 text-primary"/>
                </div>
                <h1 className="font-headline text-4xl font-bold text-primary md:text-5xl">
                    LEAP Module for SMEs
                </h1>
                <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
                    A guided tool to transform how your company understands and responds to its impacts and dependencies on nature.
                </p>
                 <Button size="lg" className="mt-8" onClick={handleStartAssessment} disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Start LEAP Assessment'}
                </Button>
            </header>

            <div className="max-w-5xl mx-auto">
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">What is the LEAP Method?</CardTitle>
                        <CardDescription>
                            Adapted from the Taskforce on Nature-related Financial Disclosures (TNFD), LEAP is an assessment process that helps organizations identify and manage their environmental risks and opportunities.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                       {leapSteps.map(step => (
                           <div key={step.title} className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                               <div className="flex-shrink-0 text-accent">
                                   <step.icon className="h-8 w-8"/>
                               </div>
                               <div>
                                   <h3 className="font-semibold text-lg">{step.title}</h3>
                                   <p className="text-sm text-muted-foreground">{step.description}</p>
                               </div>
                           </div>
                       ))}
                    </CardContent>
                </Card>

                 <div className="mt-12 text-center">
                    <h3 className="font-headline text-2xl font-bold text-primary">Ready for the Next Step?</h3>
                    <p className="mt-2 text-muted-foreground">In less than 30 minutes, you can generate your first Nature Intelligence Report.</p>
                     <Button asChild size="lg" variant="outline" className="mt-6" disabled>
                        <Link href="#"><FileText className="mr-2 h-4 w-4"/> View Sample Report</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default LeapPage;
