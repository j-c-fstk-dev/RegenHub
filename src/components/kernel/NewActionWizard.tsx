
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveActionLocally } from '@/lib/localStore';

interface NewActionWizardProps {
  onDone: () => void;
  onBack: () => void;
}

export function NewActionWizard({ onDone, onBack }: NewActionWizardProps) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(data: any) {
    setIsSaving(true);
    try {
      const payload = {
        title: data.title,
        description: data.description,
        actionType: 'other', // Placeholder
        // Add other fields as the wizard grows
      };
      await saveActionLocally(payload);
      toast({ title: "Action Saved Locally!", description: "Your action has been securely saved on this device." });
      onDone();
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ variant: 'destructive', title: "Save Failed", description: message });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="container py-12">
        <div className="max-w-2xl mx-auto">
            <Card>
                 <form onSubmit={handleSubmit(onSubmit)}>
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl">Register New Action (Offline)</CardTitle>
                        <CardDescription>Fill in the details for the action you performed. This will be saved locally on your device.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Action Title</Label>
                            <Input id="title" placeholder="e.g., Community compost setup" {...register('title', { required: 'Title is required.' })} />
                            {errors.title && <p className="text-sm text-destructive">{errors.title.message as string}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" placeholder="Describe what happened, who was involved, and what the outcome was." {...register('description')} className="min-h-[120px]" />
                        </div>
                        {/* More fields for location, media, metrics will go here in future steps */}
                    </CardContent>
                    <CardFooter className="flex justify-between">
                         <Button type="button" variant="outline" onClick={onBack}>
                            <ArrowLeft className="mr-2 h-4 w-4"/> Back to Kernel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Save Action Locally
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    </div>
  );
}

    