"use client";

import React from "react";
import { useWizard } from "./wizard-context";
import { useUser } from "@/firebase";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Step1 from "./steps/step-1";
import Step2 from "./steps/step-2";
import Step3 from "./steps/step-3";
import Step4 from "./steps/step-4";
// etc.

export function Wizard() {
  const { step, isLoading: isWizardLoading } = useWizard();
  const { user, isUserLoading } = useUser();

  if (isWizardLoading || isUserLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Log In</CardTitle>
          <CardDescription>
            To register an action, you first need an account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Please log in or sign up to continue. Your actions will be linked to
            your profile.
          </p>
          <Button asChild className="w-full">
            <Link href="/login?redirect=/register">Log In or Sign Up</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1 />;
      case 2:
        return <Step2 />;
      case 3:
        return <Step3 />;
      case 4:
        return <Step4 />;
      default:
        return <Step1 />;
    }
  };

  return <div>{renderStep()}</div>;
}
