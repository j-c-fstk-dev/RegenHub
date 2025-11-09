"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useWizard } from "./wizard-context";
import { Progress } from "@/components/ui/progress";

interface WizardLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  onNext: () => void;
  onBack?: () => void;
  isNextDisabled?: boolean;
  isBackDisabled?: boolean;
}

const TOTAL_STEPS = 6;

export const WizardLayout = ({
  title,
  description,
  children,
  onNext,
  onBack,
  isNextDisabled = false,
  isBackDisabled = false,
}: WizardLayoutProps) => {
  const { step } = useWizard();
  const progressPercentage = (step / TOTAL_STEPS) * 100;

  return (
    <Card>
      <CardHeader>
        <Progress value={progressPercentage} className="mb-4" />
        <CardTitle className="font-headline text-2xl">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
      <CardFooter className="flex justify-between">
        {onBack ? (
          <Button variant="outline" onClick={onBack} disabled={isBackDisabled}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        ) : <div />}
        <Button onClick={onNext} disabled={isNextDisabled}>
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
