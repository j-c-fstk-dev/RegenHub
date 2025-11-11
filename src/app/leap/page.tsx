'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Locate, Scale, CheckSquare, LineChart, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, FirestorePermissionError, errorEmitter } from "@/firebase";
import { addDoc, collection, serverTimestamp, query, where, getDocs } from "firebase/firestore";

const LoggedOutCTA = () => (
    <div className="mt-8 text-center bg-secondary p-8 rounded-lg">
        <h3 className="font-headline text-2xl font-bold text-primary">Get Started with Your Nature Assessment</h3>
        <p className="mt-2 text-muted-foreground max-w-xl mx-auto">Log in or create an account to use the LEAP tool and generate your first Nature Intelligence Report.</p>
        <Button asChild size="lg" className="mt-6">
            <Link href="/login?redirect=/leap">Log In or Sign Up</Link>
        </Button>
    </div>
)

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
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [isPending, startTransition] = useTransition();

    const handleStartAssessment = () => {
        if (!user || !firestore) {
            toast({ variant: 'destructive', title: 'Access Denied', description: 'You need to be logged in to start an assessment.'});
            router.push('/login?redirect=/leap');
            return;
        }

        startTransition(async () => {
            try {
                // 1. Find user's organization
                const orgsQuery = query(collection(firestore, 'organizations'), where('createdBy', '==', user.uid));
                const orgSnapshot = await getDocs(orgsQuery);

                if (orgSnapshot.empty) {
                    toast({ 
                        variant: 'destructive', 
                        title: 'Organization Not Found', 
                        description: 'You must create an organization before starting a LEAP assessment.'
                    });
                    router.push('/admin/organization');
                    return;
                }
                const orgId = orgSnapshot.docs[0].id;

                // 2. Create the new assessment document
                const assessmentData = {
                  orgId: orgId,
                  stage: 'L',
                  locale: 'en',
                  createdBy: user.uid, // Track who created it
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                };
                const assessmentRef = await addDoc(collection(firestore, 'leapAssessments'), assessmentData);

                toast({ title: 'Assessment Started!', description: 'You have been redirected to the first step.' });
                router.push(`/leap/assessment/${assessmentRef.id}/l`);
            } catch (error) {
                console.error('Error starting LEAP assessment:', error);
                 const permissionError = new FirestorePermissionError({
                    path: `leapAssessments`,
                    operation: 'create',
                });
                errorEmitter.emit('permission-error', permissionError);
                const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
                toast({ variant: 'destructive', title: 'Error', description: `Failed to start assessment: ${errorMessage}` });
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
                 {isUserLoading ? (
                    <div className="mt-8">
                        <Loader2 className="h-6 w-6 mx-auto animate-spin" />
                    </div>
                 ) : user ? (
                    <Button size="lg" className="mt-8" onClick={handleStartAssessment} disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Start LEAP Assessment'}
                    </Button>
                 ) : (
                    <LoggedOutCTA />
                 )}
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
                     <Button asChild size="lg" variant="outline" className="mt-6">
                        <Link href="/work-in-progress"><FileText className="mr-2 h-4 w-4"/> View Sample Report</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default LeapPage;
