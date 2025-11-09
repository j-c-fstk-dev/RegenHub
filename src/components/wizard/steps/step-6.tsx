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
import { Button } from "@/components/ui/button";
import { useWizard } from "../wizard-context";
import { WizardLayout } from "../WizardLayout";
import { Link as LinkIcon, PlusCircle, Trash2, Loader2, Upload } from "lucide-react";
import { useStorage, useUser } from "@/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";


const step6Schema = z.object({
  mediaUrls: z.array(z.object({
    url: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  })),
});

type Step6FormValues = z.infer<typeof step6Schema>;

const Step6 = () => {
    const { setStep, updateDraft, draft } = useWizard();
    const { user } = useUser();
    const storage = useStorage();
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);

    const form = useForm<Step6FormValues>({
        resolver: zodResolver(step6Schema),
        defaultValues: {
            mediaUrls: draft?.mediaUrls?.length ? draft.mediaUrls.map(u => ({ url: typeof u === 'string' ? u : u.url })) : [{ url: "" }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "mediaUrls",
    });

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !storage || !user?.uid) return;

        setIsUploading(true);
        try {
            const filePath = `actions/${user.uid}/${draft?.id || 'draft'}/${Date.now()}-${file.name}`;
            const storageRef = ref(storage, filePath);
            const uploadResult = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(uploadResult.ref);
            
            const emptyFieldIndex = fields.findIndex(field => !field.url);
            if (emptyFieldIndex !== -1) {
                form.setValue(`mediaUrls.${emptyFieldIndex}.url`, downloadURL, { shouldValidate: true });
            } else {
                append({ url: downloadURL });
            }

            toast({ title: "Success", description: "File uploaded successfully." });
        } catch (error) {
            console.error("File upload error:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: "destructive", title: "Upload Failed", description: errorMessage });
        } finally {
            setIsUploading(false); // Ensure loader stops
        }
    };


    const onSubmit = (values: Step6FormValues) => {
        const filteredUrls = values.mediaUrls?.filter(item => item.url && item.url.trim() !== '') || [];
        updateDraft({ mediaUrls: filteredUrls });
        setStep(7);
    }
    
    const handleBack = () => {
        updateDraft(form.getValues());
        setStep(5);
    }

    return (
        <WizardLayout
            title="Step 6: Evidence"
            description="Add links to photos, videos, or documents that prove your action. You can also upload files directly."
            onNext={form.handleSubmit(onSubmit)}
            onBack={handleBack}
        >
            <Form {...form}>
                <form className="space-y-6">
                    <div className="space-y-4">
                        {fields.map((field, index) => (
                             <FormField
                                key={field.id}
                                control={form.control}
                                name={`mediaUrls.${index}.url`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="sr-only">Evidence URL {index + 1}</FormLabel>
                                        <div className="flex items-center gap-2">
                                            <LinkIcon className="h-4 w-4 text-muted-foreground" />
                                            <FormControl>
                                                <Input {...field} placeholder="https://example.com/photo.jpg" />
                                            </FormControl>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                                <Trash2 className="h-4 w-4 text-destructive"/>
                                            </Button>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ))}
                    </div>
                     <div className="flex items-center gap-4">
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ url: '' })}>
                            <PlusCircle className="mr-2 h-4 w-4"/> Add Another Link
                        </Button>
                         <div className="relative">
                            <Button type="button" variant="secondary" size="sm" disabled={isUploading}>
                                {isUploading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                ) : (
                                    <Upload className="mr-2 h-4 w-4"/>
                                )}
                                Upload File
                            </Button>
                            <Input 
                                type="file" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileUpload}
                                accept="image/*,video/*,application/pdf"
                                disabled={isUploading}
                            />
                        </div>
                     </div>
                     <FormDescription>
                        Provide links to public media or upload your files. Good evidence is key for quick validation.
                    </FormDescription>
                </form>
            </Form>
        </WizardLayout>
    );
};

export default Step6;
