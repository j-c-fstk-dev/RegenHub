'use client';

import React, { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FirestorePermissionError, errorEmitter } from '@/firebase';


const projectFormSchema = z.object({
  title: z.string().min(3, 'Project title must be at least 3 characters.'),
  description: z.string().max(500, "Description should not exceed 500 characters.").optional(),
  impactCategory: z.string().nonempty({ message: "Please select a category."}),
  location: z.string().optional(),
});
type ProjectFormValues = z.infer<typeof projectFormSchema>;

type Project = { id: string; title: string; };

interface ProjectFormProps {
  userId: string;
  orgId: string;
  onProjectCreated: (project: Project) => void;
}

export function ProjectForm({ userId, orgId, onProjectCreated }: ProjectFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: { title: '', description: '', impactCategory: '', location: '' },
  });

  const onSubmit = (values: ProjectFormValues) => {
    if (!firestore) return;
    startTransition(() => {
      const projectData = {
          ...values,
          orgId: orgId,
          createdBy: userId,
          createdAt: serverTimestamp(),
      };
      const projectsRef = collection(firestore, 'projects');

      addDoc(projectsRef, projectData)
        .then(projectRef => {
          toast({ title: 'Success!', description: 'Your new project has been created.' });
          onProjectCreated({ id: projectRef.id, ...values });
        })
        .catch(e => {
            console.error(e);
            const permissionError = new FirestorePermissionError({
                path: 'projects',
                operation: 'create',
                requestResourceData: projectData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    });
  };

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Title</FormLabel>
                  <FormControl><Input placeholder="e.g., Reforestation in the Atlantic Forest" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="impactCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Impact Category</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Agroforestry">Agroforestry</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Waste Management">Waste Management</SelectItem>
                       <SelectItem value="Water">Water</SelectItem>
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
                  <FormLabel>Location</FormLabel>
                  <FormControl><Input placeholder="e.g., Recife, Brazil" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="Briefly describe this project's goals." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Project & Continue
            </Button>
        </form>
    </Form>
  );
}
