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
import { Textarea } from "@/components/ui/textarea";
import { useWizard } from "../wizard-context";
import { WizardLayout } from "../WizardLayout";

const step4Schema = z.object({
  description: z.string().min(20, { message: 'Please provide a more detailed description (at least 20 characters).' }).max(2000, { message: 'Description cannot exceed 2000 characters.'}),
});

type Step4FormValues = z.infer<typeof step4Schema>;

const Step4 = () => {
    const { setStep, updateDraft, draft } = useWizard();

    const form = useForm<Step4FormValues>({
        resolver: zodResolver(step4Schema),
        defaultValues: {
            description: draft?.description || '',
        },
    });

    const onSubmit = (values: Step4FormValues) => {
        updateDraft(values);
        setStep(5); // Go to next step
    }

    const handleBack = () => {
        // Save current values before going back
        updateDraft(form.getValues());
        setStep(3);
    }

    return (
        <WizardLayout
            title="Step 4: Description"
            description="Describe the action in detail. What did you do? What was the context? What were the results?"
            onNext={form.handleSubmit(onSubmit)}
            onBack={handleBack}
            isNextDisabled={!form.formState.isValid}
        >
            <Form {...form}>
                <form className="space-y-8">
                     <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Detailed Description</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Tell us the story of your action. For example: 'We organized a community effort to plant 50 native saplings in the degraded area of Park...'"
                                        className="min-h-[200px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                   The more details you provide, the easier it is for validators to understand your impact.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                </form>
            </Form>
        </WizardLayout>
    );
};

export default Step4;
