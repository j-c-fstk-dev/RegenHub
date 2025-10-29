'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from '@/firebase';


const formSchema = z.object({
  // For simplicity, we are not asking the user to select an org/project in the form yet.
  // We will associate this with a default/first project of the user in the API.
  title: z.string().min(5, { message: 'Action name must be at least 5 characters.' }),
  description: z.string().min(20, { message: 'Description must be at least 20 characters.' }).max(500),
  category: z.string().nonempty({ message: "Please select a category."}),
  location: z.string().optional(),
  proofs: z.string().url({ message: 'Please enter a valid URL for your proof.' }).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

export function RegisterForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      location: '',
      proofs: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to submit an action.' });
        return;
    }

    startTransition(async () => {
      const proofsArray = values.proofs ? [{ type: 'link', url: values.proofs }] : [];
      const payload = {
        // Mocking orgId and projectId for now. In a real app, this would come from user's context.
        orgId: "mock-org-id",
        projectId: "mock-project-id",
        intentId: "mock-intent-id",
        ...values,
        mediaUrls: proofsArray.map(p => p.url),
      };

      try {
        const response = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'An unknown error occurred.');
        }

        toast({
          title: 'Intent Submitted!',
          description: 'Your action is now pending verification. Thank you!',
        });
        form.reset();

      } catch (error) {
        console.error("Submission error:", error);
        toast({
          variant: 'destructive',
          title: 'Submission Failed',
          description: error instanceof Error ? error.message : 'Please try again.',
        });
      }
    });
  }

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold font-headline">About the Action</h3>
               <FormField
                control={form.control}
                name="title"
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
                name="description"
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
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Ecological">Ecological</SelectItem>
                          <SelectItem value="Social">Social</SelectItem>
                          <SelectItem value="Educational">Educational</SelectItem>
                           <SelectItem value="Cultural">Cultural</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (City, Country)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Recife, Brazil" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
             <div className="space-y-4">
                <h3 className="text-lg font-semibold font-headline">Proof</h3>
                <FormField
                control={form.control}
                name="proofs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proof of Action (Link)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/photo-or-video-of-action" {...field} />
                    </FormControl>
                    <FormDescription>Link to a photo, video, blog post, or social media post.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
             </div>


            <Button type="submit" className="w-full" disabled={isPending || !user}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {user ? 'Submit Intent' : 'Please log in to submit'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
