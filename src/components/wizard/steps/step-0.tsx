"use client";

import { Card, CardDescription, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, User, ArrowRight } from "lucide-react";
import { useWizard } from "../wizard-context";

const Step0 = () => {
  const { setStep, updateDraft, draft } = useWizard();

  const handleSelection = (isOrg: boolean) => {
    // Here you could update the draft if needed, e.g., setting a flag
    // For now, we just proceed to the next step
    if (isOrg) {
        // User chose to register as an org, go to org/project creation
        setStep(1); 
    } else {
        // User chose to register as an individual. 
        // We'll assign a placeholder orgId/projectId to satisfy data model,
        // which can be interpreted downstream as a personal action.
        if (draft?.createdBy) {
            updateDraft({ 
                orgId: `user-org-${draft.createdBy}`, 
                projectId: `user-project-${draft.createdBy}` 
            });
        }
        setStep(2); // Skip org/project creation and go directly to action details
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Welcome to the Action Registry</CardTitle>
        <CardDescription>
          This wizard guides you through registering a regenerative action. First, tell us how you're acting.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6">
        <div 
            className="p-6 border rounded-lg hover:bg-secondary hover:border-primary transition-all cursor-pointer flex flex-col items-center text-center"
            onClick={() => handleSelection(true)}
        >
            <Users className="h-10 w-10 text-primary mb-4"/>
            <h3 className="font-semibold text-lg">As a Group or Organization</h3>
            <p className="text-sm text-muted-foreground mt-2">
                Register an action on behalf of a collective, company, or any formal/informal group. You will create or select your organization and project first.
            </p>
        </div>

        <div 
            className="p-6 border rounded-lg hover:bg-secondary hover:border-primary transition-all cursor-pointer flex flex-col items-center text-center"
            onClick={() => handleSelection(false)}
        >
            <User className="h-10 w-10 text-primary mb-4"/>
            <h3 className="font-semibold text-lg">As an Individual</h3>
            <p className="text-sm text-muted-foreground mt-2">
                Register a personal action. Your action will be associated directly with your individual profile.
            </p>
        </div>
      </CardContent>
      <CardFooter>
          <p className="text-xs text-muted-foreground">
              By proceeding, you agree to our Terms of Service and acknowledge that your submitted data for verified actions will be made public.
          </p>
      </CardFooter>
    </Card>
  );
};

export default Step0;
