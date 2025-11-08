"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import { useWizard } from "../wizard-context";
import { WizardLayout } from "../WizardLayout";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";

const step5Schema = z.object({
  mediaUrls: z.array(z.object({
    url: z.string().url({ message: "Please enter a valid URL." }).or(z.literal('')),
  })).optional(),
});

type Step5FormValues = z.infer<typeof step5Schema>;

const Step5 = () => {
    const { setStep, updateDraft, draft } = useWizard();

    const form = useForm<Step5FormValues>({
        resolver: zodResolver(step5Schema),
        defaultValues: {
            mediaUrls: draft?.mediaUrls && draft.mediaUrls.length > 0 ? draft.mediaUrls : [{ url: '' }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "mediaUrls",
    });

    const onSubmit = (values: Step5FormValues) => {
        const filteredUrls = values.mediaUrls?.filter(item => item.url.trim() !== '');
        updateDraft({ mediaUrls: filteredUrls });
        setStep(6);
    }

    const handleBack = () => {
        updateDraft(form.getValues());
        setStep(4);
    }

    return (
        <WizardLayout
            title="Step 5: Evidence"
            description="Add links to photos, videos, articles, or any other proof of your action. More evidence helps in verification."
            onNext={form.handleSubmit(onSubmit)}
            onBack={handleBack}
        >
            <Form {...form}>
                <form className="space-y-6">
                    <div>
                        {fields.map((field, index) => (
                           <FormField
                                key={field.id}
                                control={form.control}
                                name={`mediaUrls.${index}.url`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className={index !== 0 ? "sr-only" : ""}>Evidence URL</FormLabel>
                                        <div className="flex items-center gap-2">
                                            <FormControl>
                                                <Input {...field} placeholder="https://example.com/photo.jpg" />
                                            </FormControl>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length < 1}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ))}
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ url: "" })}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add another link
                    </Button>
                     <FormDescription>
                        For now, only public URLs are supported. You can use services like Imgur, Google Drive, or a blog post.
                    </FormDescription>
                </form>
            </Form>
        </WizardLayout>
    );
};

export default Step5;
