'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { DownloadCloud, HardDrive, WifiOff, CheckCircle, Rocket, BookOpen, Fingerprint, Package, Lightbulb } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { generateKeypair, sha256Hex } from '@/lib/crypto';
import { useToast } from '@/hooks/use-toast';

const SEED_STEPS = [
    { title: "Welcome to RegenKernel", icon: Lightbulb },
    { title: "Understanding Proofs", icon: BookOpen },
    { title: "Create a Dummy Action", icon: Fingerprint },
    { title: "Export Your Proof", icon: Package },
    { title: "Ready to Go!", icon: Rocket },
];

const WelcomeStep = ({ onNext }: { onNext: () => void }) => (
    <Card>
        <CardHeader>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <HardDrive className="h-8 w-8" />
            </div>
            <CardTitle className="font-headline text-3xl">Welcome to RegenKernel</CardTitle>
            <CardDescription className="text-lg">Your sovereign, offline-first tool for capturing regenerative actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">Before you start, a quick, hands-on tutorial called the **Seed Protocol** will teach you how to create verifiable proofs, even without an internet connection.</p>
            <p className="font-semibold">This will take about 3 minutes.</p>
        </CardContent>
        <CardFooter className="flex justify-center">
            <Button onClick={onNext} size="lg">Start Seed Protocol</Button>
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
                <CardTitle className="font-headline text-2xl">Step 1: Understanding Digital Proofs</CardTitle>
                <CardDescription>RegenKernel creates a unique "fingerprint" (a hash) for your data to prove it hasn't been tampered with.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p>For example, the text <span className="font-mono bg-secondary p-1 rounded-md">"{originalText}"</span> always produces the exact same hash:</p>
                <div className="p-4 bg-muted rounded-md text-sm break-all font-mono">
                    {hash}
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

    const handleGenerateKeys = async () => {
        const generatedKeys = await generateKeypair();
        setKeys(generatedKeys);
        toast({ title: "Success!", description: "Your unique cryptographic keys have been generated and stored securely in your browser." });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Step 2: Create Your Keys</CardTitle>
                <CardDescription>To sign your actions, you need a unique set of cryptographic keys. They will be stored securely on this device.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <p>Your keys prove that you are the one who registered an action. Think of the private key as your pen, and the public key as the way others can verify your signature.</p>
                {keys ? (
                    <div className="p-4 border rounded-md bg-green-50 border-green-200">
                        <h4 className="font-semibold text-green-800 flex items-center gap-2"><CheckCircle /> Keys Generated!</h4>
                        <p className="text-xs text-green-700 mt-1">Your public key is now ready. The private key remains hidden and secure.</p>
                    </div>
                ) : (
                    <Button onClick={handleGenerateKeys}>Generate My Keys</Button>
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

const FinalStep = ({ onRestart }: { onRestart: () => void }) => (
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
             <Button asChild size="lg">
                <Link href="/register">Go to Main Action Registry</Link>
            </Button>
            <Button variant="link" onClick={onRestart}>Restart Tutorial</Button>
        </CardFooter>
    </Card>
);


const KernelPage = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [seedCompleted, setSeedCompleted] = useState(false);

    useEffect(() => {
        const completed = localStorage.getItem('seedCompleted') === 'true';
        setSeedCompleted(completed);
        if (completed) {
            setCurrentStep(SEED_STEPS.length - 1);
        }
    }, []);
    
    const handleNext = () => {
        if (currentStep < SEED_STEPS.length - 1) {
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
            if (nextStep === SEED_STEPS.length - 1) {
                localStorage.setItem('seedCompleted', 'true');
                setSeedCompleted(true);
            }
        }
    };
    
    const handleRestart = () => {
        localStorage.removeItem('seedCompleted');
        setSeedCompleted(false);
        setCurrentStep(0);
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0: return <WelcomeStep onNext={handleNext} />;
            case 1: return <ConceptStep onNext={handleNext} />;
            case 2: return <CreateStep onNext={handleNext} />;
            case 3: return <ExportStep onNext={handleNext} />;
            case 4: return <FinalStep onRestart={handleRestart} />;
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

export default KernelPage;
