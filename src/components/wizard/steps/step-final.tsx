"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PartyPopper } from "lucide-react";
import Link from "next/link";
import { useWizard } from "../wizard-context";

const StepFinal = () => {
    const { startNewWizard } = useWizard();

    return (
        <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                    <PartyPopper className="h-8 w-8" />
                </div>
                <CardTitle className="font-headline text-3xl">Action Submitted!</CardTitle>
                <CardDescription>
                    Congratulations! Your regenerative action has been successfully registered and is now in the validation queue.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Our AI assistant will perform an initial review, followed by a final check from a human validator. You can track the status in your admin dashboard. Approved actions will appear on the public Impact Wall.</p>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-center gap-4">
                <Button asChild>
                    <Link href="/admin">Go to Dashboard</Link>
                </Button>
                <Button variant="outline" onClick={startNewWizard}>
                    Submit Another Action
                </Button>
            </CardFooter>
        </Card>
    );
};

export default StepFinal;
