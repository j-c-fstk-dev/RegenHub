
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Lightbulb, BookOpen, Fingerprint, Package, Rocket, CheckCircle, ArrowRight } from "lucide-react";
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { generateKeypair, sha256Hex } from '@/lib/crypto';


const SEED_STEPS = [
    { title: "Welcome to RegenKernel", icon: Lightbulb },
    { title: "Understanding Proofs", icon: BookOpen },
    { title: "Create Your Keys", icon: Fingerprint },
    { title: "Export a Bundle (Simulation)", icon: Package },
    { title: "Ready to Go!", icon: Rocket },
];

const WelcomeStep = ({ onNext }: { onNext: () => void }) => (
    <Card>
        <CardHeader>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <Lightbulb className="h-8 w-8" />
            </div>
            <CardTitle className="font-headline text-3xl">Welcome to the Seed Protocol</CardTitle>
            <CardDescription className="text-lg">A quick, hands-on tutorial to prepare your device for sovereign, offline-first impact tracking.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">This will take about 2 minutes and will teach you how to create verifiable proofs for your actions.</p>
        </CardContent>
        <CardFooter className="flex justify-center">
            <Button onClick={onNext} size="lg">Start Seed Protocol <ArrowRight className="ml-2 h-4 w-4"/></Button>
        </CardFooter>
    </Card>
);

const ConceptStep = ({ onNext }: { onNext: () => void }) => {
    const [hash, setHash] = useState('');
    const originalText = "Regenerative Action";

    useEffect(() => {
        sha256Hex(originalText).then(setHash);
    }, [originalText]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Step 1: Understanding Digital Proofs (Hashes)</CardTitle>
                <CardDescription>RegenKernel creates a unique "fingerprint" (a hash) for your data to prove it hasn't been tampered with.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p>For example, the text <span className="font-mono bg-secondary p-1 rounded-md">"{originalText}"</span> always produces the exact same hash:</p>
                <div className="p-4 bg-muted rounded-md text-sm break-all font-mono">
                    {hash ? hash : <Loader2 className="h-4 w-4 animate-spin"/>}
                </div>
                <p>If even one character changes, the hash changes completely. This is how we ensure data integrity.</p>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button onClick={onNext}>Got it, Next</Button>
            </CardFooter>
        </Card>
    );
};

const CreateStep = ({ onNext }: { onNext: () => void }) => {
    const { toast } = useToast();
    const [keys, setKeys] = useState<{publicKeyBase64: string} | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateKeys = async () => {
        setIsLoading(true);
        try {
            const generatedKeys = await generateKeypair();
            setKeys(generatedKeys);
            toast({ title: "Success!", description: "Your unique cryptographic keys have been generated and stored securely in your browser." });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: "Error", description: "Could not generate keys." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Step 2: Create Your Keys</CardTitle>
                <CardDescription>To sign your actions, you need a unique set of cryptographic keys. They will be stored securely on this device only.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <p>Your keys prove that you are the one who registered an action. Think of the private key as your pen, and the public key as the way others can verify your signature.</p>
                {keys ? (
                    <div className="p-4 border rounded-md bg-green-50 border-green-200">
                        <h4 className="font-semibold text-green-800 flex items-center gap-2"><CheckCircle /> Keys Generated!</h4>
                        <p className="text-xs text-green-700 mt-1">Your public key is ready. The private key remains hidden and secure in your browser's storage.</p>
                    </div>
                ) : (
                    <Button onClick={handleGenerateKeys} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Generate My Keys
                    </Button>
                )}
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button onClick={onNext} disabled={!keys}>Next Step</Button>
            </CardFooter>
        </Card>
    );
};

const ExportStep = ({ onNext }: { onNext: () => void }) => (
     <Card>
        <CardHeader>
            <CardTitle className="font-headline text-2xl">Step 3: Export a Bundle</CardTitle>
            <CardDescription>Actions and their proofs are packaged into a "bundle" (a .zip file) that you can share or sync with RegenHub.</CardDescription>
        </CardHeader>
        <CardContent>
            <p>This bundle contains your action data and its cryptographic signature, making it a verifiable, portable piece of impact.</p>
            <Button className="mt-4" disabled>Simulate Export (Coming Soon)</Button>
        </CardContent>
        <CardFooter className="flex justify-end">
            <Button onClick={onNext}>Finish Tutorial</Button>
        </CardFooter>
    </Card>
);

const FinalStep = ({ onRestart, onComplete }: { onRestart: () => void, onComplete: () => void }) => (
    <Card className="text-center">
        <CardHeader>
             <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <Rocket className="h-8 w-8" />
            </div>
            <CardTitle className="font-headline text-3xl">Seed Protocol Complete!</CardTitle>
            <CardDescription className="text-lg">You're all set to start capturing regenerative impact.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">Your device is now prepared to create and sign actions offline. You can now proceed to the main Kernel interface.</p>
        </CardContent>
        <CardFooter className="flex-col gap-4">
             <Button onClick={onComplete} size="lg">
                Go to Kernel Dashboard
            </Button>
            <Button variant="link" onClick={onRestart}>Restart Tutorial</Button>
        </CardFooter>
    </Card>
);


export function SeedProtocolWizard({ onComplete }: { onComplete: () => void }) {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < SEED_STEPS.length - 1) {
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
        }
    };

     const handleComplete = () => {
        localStorage.setItem('seedCompleted', 'true');
        onComplete();
    };
    
    const handleRestart = () => {
        localStorage.removeItem('seedCompleted');
        setCurrentStep(0);
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0: return <WelcomeStep onNext={handleNext} />;
            case 1: return <ConceptStep onNext={handleNext} />;
            case 2: return <CreateStep onNext={handleNext} />;
            case 3: return <ExportStep onNext={handleNext} />;
            case 4: return <FinalStep onRestart={handleRestart} onComplete={handleComplete} />;
            default: return <WelcomeStep onNext={handleNext} />;
        }
    };

    const progress = (currentStep / (SEED_STEPS.length - 1)) * 100;

    return (
        <div className="container py-12">
            <div className="mx-auto max-w-2xl">
                {currentStep > 0 && currentStep < SEED_STEPS.length -1 && (
                    <div className="mb-8">
                         <div className="flex justify-between mb-2">
                           <span className="text-sm font-semibold text-primary">{SEED_STEPS[currentStep].title}</span>
                           <span className="text-sm text-muted-foreground">{currentStep} / {SEED_STEPS.length - 2}</span>
                        </div>
                        <Progress value={progress} />
                    </div>
                )}
                 {renderStep()}
            </div>
        </div>
    );
};

    