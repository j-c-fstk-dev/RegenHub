"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { submitIntent } from "@/app/register/actions";
import { useToast } from "@/hooks/use-toast";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  actionName: z.string().min(5, { message: "Action name must be at least 5 characters." }),
  actionType: z.string({ required_error: "Please select an action type." }),
  actionDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Please enter a valid date." }),
  location: z.string().min(3, { message: "Location is required." }),
  numberOfParticipants: z.coerce.number().int().min(1, { message: "At least one participant is required." }),
  actionDescription: z.string().min(20, { message: "Description must be at least 20 characters." }).max(500),
  photos: typeof window === 'undefined' ? z.any() : z.instanceof(FileList).refine(files => files.length > 0, 'At least one photo is required.'),
  socialMediaLinks: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  submitterName: z.string().min(2, { message: "Your name is required." }),
  projectName: z.string().optional(),
  customTag: z.string().optional(),
  contactEmail: z.string().email({ message: "Please enter a valid email address." }),
});

export function RegisterForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      actionName: "",
      location: "",
      numberOfParticipants: 1,
      actionDescription: "",
      socialMediaLinks: "",
      submitterName: "",
      projectName: "",
      customTag: "",
      contactEmail: "",
    },
  });

  const fileToDataUri = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if(event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error("Failed to read file."));
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        const photos = Array.from(values.photos);
        const photoDataUris = await Promise.all(photos.map(fileToDataUri));

        const result = await submitIntent({
          ...values,
          photos: photoDataUris,
          socialMediaLinks: values.socialMediaLinks ? [values.socialMediaLinks] : [],
        });
        
        if (result.success) {
            toast({
                title: "Intent Submitted!",
                description: "Your action is now pending verification. Thank you!",
            });
            form.reset();
        } else {
            toast({
                variant: "destructive",
                title: "Submission Failed",
                description: result.error || "An unknown error occurred.",
            });
        }
      } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to process your submission. Please try again.",
        });
      }
    });
  }

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="actionName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name of the action</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Community Tree Planting Day" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="actionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type of action</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an action type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="planting">Planting</SelectItem>
                      <SelectItem value="cleanup">Cleanup</SelectItem>
                      <SelectItem value="workshop">Workshop/Education</SelectItem>
                      <SelectItem value="composting">Composting</SelectItem>
                       <SelectItem value="mutual-aid">Mutual Aid</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FormField control={form.control} name="actionDate" render={({ field }) => (
                    <FormItem className="md:col-span-1">
                        <FormLabel>Date of action</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="numberOfParticipants" render={({ field }) => (
                    <FormItem className="md:col-span-1">
                        <FormLabel>Number of participants</FormLabel>
                        <FormControl><Input type="number" min="1" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
             <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (City, State/Country)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Central Park, New York" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="actionDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brief description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe what you did and the outcome." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="photos"
              render={({ field: { onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Upload photos (proof of action)</FormLabel>
                  <FormControl>
                    <Input type="file" multiple accept="image/*" {...fieldProps} onChange={e => onChange(e.target.files)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="socialMediaLinks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link to social media post (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://instagram.com/p/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="space-y-4">
                <h3 className="text-lg font-semibold font-headline">Identification</h3>
                 <FormField
                    control={form.control}
                    name="submitterName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Jane Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="projectName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Project or Collective Name (optional)</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Green Thumbs Initiative" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="customTag"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Custom Tag (optional)</FormLabel>
                        <FormControl>
                            <Input placeholder="my-project-tag" {...field} />
                        </FormControl>
                        <FormDescription>A unique tag to group all your actions. If left blank, one will be generated.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                   <FormDescription>For verification questions and to send your certificate.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Intent
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
