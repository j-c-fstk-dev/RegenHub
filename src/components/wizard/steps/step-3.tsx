"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormDescription,
} from "@/components/ui/form";
import { useWizard } from "../wizard-context";
import { WizardLayout } from "../WizardLayout";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LocationInput } from "@/components/location-input";

const step3Schema = z.object({
  location: z.string().optional(),
});

type Step3FormValues = z.infer<typeof step3Schema>;

const Step3 = () => {
    const { setStep, updateDraft, draft } = useWizard();
    
    const form = useForm<Step3FormValues>({
        resolver: zodResolver(step3Schema),
        defaultValues: {
            location: draft?.location && draft.location !== 'Digital/Online' ? draft.location : '',
        },
    });
    
    const isDigital = form.watch('location') === 'Digital/Online';

    const handleSwitchChange = (checked: boolean) => {
        if (checked) {
            form.setValue('location', 'Digital/Online');
        } else {
            form.setValue('location', '');
        }
    };
    
    const handleLocationSelect = (locationName: string) => {
        form.setValue('location', locationName, { shouldValidate: true });
    };

    const onSubmit = (values: Step3FormValues) => {
        if (!isDigital && !values.location) {
             form.setError('location', { message: 'Location is required for physical actions.' });
             return;
        }
        updateDraft(values);
        setStep(4);
    }

    const handleBack = () => {
        updateDraft(form.getValues());
        setStep(2);
    }

    return (
        <WizardLayout
            title="Step 3: Location"
            description="Where did your action take place? If it was online, just let us know."
            onNext={form.handleSubmit(onSubmit)}
            onBack={handleBack}
        >
            <Form {...form}>
                <form className="space-y-8">
                     <div className="flex items-center space-x-2">
                        <Switch
                            id="digital-action"
                            checked={isDigital}
                            onCheckedChange={handleSwitchChange}
                        />
                        <Label htmlFor="digital-action">This is a digital/online action (no physical location)</Label>
                    </div>

                    {!isDigital && (
                        <div>
                           <LocationInput 
                                onSelectLocation={handleLocationSelect} 
                                initialValue={draft?.location}
                           />
                           <FormDescription className="mt-2">
                                Start typing to search for a city, state, or address.
                           </FormDescription>
                           {form.formState.errors.location && (
                                <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.location.message}</p>
                           )}
                        </div>
                    )}
                </form>
            </Form>
        </WizardLayout>
    );
};

export default Step3;
