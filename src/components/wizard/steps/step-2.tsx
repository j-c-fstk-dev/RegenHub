"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback } from "react";
import { ActionTypeSelector } from '@/components/wizard/ActionTypeSelector';
import { useWizard, ActionDraft } from "../wizard-context";
import { WizardLayout } from "../WizardLayout";

const actionFormSchema = z.object({
  title: z.string().min(5, { message: 'Action name must be at least 5 characters.' }),
});

type ActionFormValues = z.infer<typeof actionFormSchema>;


const Step2 = () => {
    const { toast } = useToast();
    const { setStep, updateDraft, draft, draftId } = useWizard();

    const [selectedActionType, setSelectedActionType] = useState<Partial<ActionDraft> | null>(null);

    const form = useForm<ActionFormValues>({
        resolver: zodResolver(actionFormSchema),
        defaultValues: { title: draft?.title || '' },
    });
    
     useEffect(() => {
        if (draft) {
            form.setValue('title', draft.title || '');
            if(draft.actionTypeId && draft.actionTypeName && draft.baseScore && draft.domain) {
                setSelectedActionType({
                    actionTypeId: draft.actionTypeId,
                    actionTypeName: draft.actionTypeName,
                    baseScore: draft.baseScore,
                    domain: draft.domain,
                });
            }
        }
    }, [draft, form]);


    const onSubmit = (values: ActionFormValues) => {
        if (!selectedActionType) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select an action type.' });
            return;
        }
        updateDraft({
            ...values,
            ...selectedActionType
        });
        setStep(3);
    }
    
    // Determine the previous step based on whether an orgId was set
    const handleBack = () => {
        if (draft?.orgId?.startsWith('user-org-')) {
            setStep(0); // Go back to welcome screen if it's an individual action
        } else {
            setStep(1); // Go back to project selection if it's an org action
        }
    }

    return (
        <WizardLayout
            title="Step 2: Identification"
            description="Tell us about the action you performed. Start by selecting the most relevant category and giving it a title."
            onNext={form.handleSubmit(onSubmit)}
            onBack={handleBack}
            isNextDisabled={!form.formState.isValid || !selectedActionType}
        >
            <Form {...form}>
                <form className="space-y-8">
                    {draftId && (
                      <ActionTypeSelector
                        actionId={draftId}
                        onSelect={(v) => setSelectedActionType({
                            actionTypeId: v.id,
                            actionTypeName: v.name,
                            baseScore: v.baseScore,
                            domain: v.domain
                        })}
                        initialValue={draft}
                      />
                    )}

                    <FormField control={form.control} name="title" render={({ field }) => (
                      <FormItem><FormLabel>Name of the action</FormLabel><FormControl><Input placeholder="e.g., Community Tree Planting Day" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </form>
            </Form>
        </WizardLayout>
    );
};

export default Step2;
