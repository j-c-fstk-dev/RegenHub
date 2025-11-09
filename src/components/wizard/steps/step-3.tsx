"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useWizard } from "../wizard-context";
import { WizardLayout } from "../WizardLayout";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";


const step3Schema = z.object({
  dateOfAction: z.date({
    required_error: "Please select the date the action was performed.",
  }),
});

type Step3FormValues = z.infer<typeof step3Schema>;

const Step3 = () => {
    const { setStep, updateDraft, draft } = useWizard();

    const form = useForm<Step3FormValues>({
        resolver: zodResolver(step3Schema),
        defaultValues: {
            dateOfAction: draft?.dateOfAction ? new Date(draft.dateOfAction) : undefined,
        },
    });

    const onSubmit = (values: Step3FormValues) => {
        updateDraft({dateOfAction: values.dateOfAction.toISOString()});
        setStep(4);
    }

    const handleBack = () => {
        const currentValues = form.getValues();
        if (currentValues.dateOfAction) {
            updateDraft({dateOfAction: currentValues.dateOfAction.toISOString()});
        }
        setStep(2);
    }

    return (
        <WizardLayout
            title="Step 3: Date of Action"
            description="When did this regenerative action take place? This helps create a timeline of impact."
            onNext={form.handleSubmit(onSubmit)}
            onBack={handleBack}
            isNextDisabled={!form.formState.isValid}
        >
            <Form {...form}>
                <form className="space-y-8">
                     <FormField
                        control={form.control}
                        name="dateOfAction"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Date of Action</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[240px] pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                        date > new Date() || date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </form>
            </Form>
        </WizardLayout>
    );
};

export default Step3;
