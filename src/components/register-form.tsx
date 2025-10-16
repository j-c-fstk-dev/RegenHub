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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { useFirestore, useStorage } from '@/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { runAiVerification } from '@/app/register/actions';
import { AIAssistedIntentVerificationInput } from '@/ai/flows/ai-assisted-intent-verification';

const actionCategories = [
    { category: "Personal", action: "Regenerative Self-Care", description: "Practices that restore body, mind, and spirit in an integrated way." },
    { category: "Interpersonal", action: "Listening and Mutual Support Circles", description: "Regular meetings for sharing and collective empowerment." },
    { category: "Interpersonal", action: "Mediation and Nonviolent Communication", description: "Conscious dialogue and conflict resolution processes." },
    { category: "Personal", action: "Experiential Learning Journeys", description: "Transformative experiences focused on self-knowledge and reconnection." },
    { category: "Social", action: "Participatory Governance", description: "Horizontal and transparent community decision-making structures." },
    { category: "Social", action: "Local Community Projects", description: "Creation of gardens, solidarity kitchens, joint efforts, or ecovillages." },
    { category: "Social", action: "Community Care Networks", description: "Connection between people for mutual support and resilience." },
    { category: "Economic", action: "Regenerative Businesses", description: "Modeling of enterprises with positive social and ecological impact." },
    { category: "Economic", action: "Local Currencies and Solidarity Exchanges", description: "Decentralized and fair economic systems." },
    { category: "Economic", action: "Collaborative Regenerative Financing", description: "Mobilization of ethical and transparent resources for positive impact." },
    { category: "Economic", action: "Ethical Value Chains", description: "Transparency and traceability in production and consumption." },
    { category: "Ecological", action: "Ecosystem Restoration", description: "Reforestation, spring protection, soil recovery." },
    { category: "Ecological", action: "Community Gardens", description: "Regenerative cultivation for food security and environmental education." },
    { category: "Ecological", action: "Circular Composting and Recycling", description: "Management of organic waste and reuse of materials." },
    { category: "Ecological", action: "Biodiversity Monitoring", description: "Observation and recording of species and ecological dynamics." },
    { category: "Educational", action: "Environmental and Ecological Education", description: "Training and awareness for sustainability and regeneration." },
    { category: "Cultural", action: "Regenerative Art and Expression", description: "Artistic creations that inspire reconnection, beauty, and consciousness." },
    { category: "Cultural/Spiritual", action: "Seasonal Rituals and Celebrations", description: "Symbolic gatherings that honor the Earth's cycles." },
    { category: "Cultural", action: "Rescue of Ancestral Knowledge", description: "Preservation and transmission of traditional knowledge." },
    { category: "Technological", action: "Open Impact Tools", description: "Development of collaborative regenerative software and systems." },
    { category: "Technological", action: "Proof-of-Impact (Living Validation)", description: "Measurement and transparency of regenerative actions via open data." },
    { category: "Technological", action: "Interoperability of Regenerative Data", description: "Connection between platforms and impact ecosystems." },
    { category: "Ecological/Social", action: "Climate Adaptation Plans", description: "Local strategies for resilience and mitigation of climate change." },
    { category: "Leadership", action: "Training of Regenerative Leaders", description: "Training to lead ecological and social transition processes." },
    { category: "Other", action: "Other", description: "Any other regenerative action not listed above." }
];

const formSchema = z.object({
  actionName: z.string().min(5, { message: 'Action name must be at least 5 characters.' }),
  actionType: z.string({ required_error: 'Please select an action type.' }),
  otherActionTypeDescription: z.string().optional(),
  actionDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Please enter a valid date.' }),
  location: z.string().min(3, { message: 'Location is required.' }),
  numberOfParticipants: z.coerce.number().int().min(1, { message: 'At least one participant is required.' }),
  shortDescription: z.string().min(20, { message: 'Description must be at least 20 characters.' }).max(500),
  media: typeof window === 'undefined' ? z.any() : z.instanceof(FileList).refine(files => files.length > 0, 'At least one media file is required.'),
  socialMediaLinks: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  responsibleName: z.string().min(2, { message: 'Your name is required.' }),
  projectName: z.string().optional(),
  customTag: z.string().optional(),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
}).refine(data => {
    if (data.actionType === 'Other' && (!data.otherActionTypeDescription || data.otherActionTypeDescription.trim().length < 5)) {
        return false;
    }
    return true;
}, {
    message: 'Please provide a brief description for the "Other" action type (min. 5 characters).',
    path: ['otherActionTypeDescription'],
});

type FormValues = z.infer<typeof formSchema>;

export function RegisterForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const firestore = useFirestore();
  const storage = useStorage();


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      actionName: '',
      actionType: undefined,
      otherActionTypeDescription: '',
      actionDate: '',
      location: '',
      numberOfParticipants: 1,
      shortDescription: '',
      socialMediaLinks: '',
      responsibleName: '',
      projectName: '',
      customTag: '',
      email: '',
    },
  });

  const watchActionType = form.watch('actionType');

  const fileToDataUri = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to read file.'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

  async function uploadMedia(mediaDataUris: string[], intentId: string): Promise<string[]> {
    if (!storage) throw new Error("Firebase Storage not available.");
    const urls: string[] = [];
  
    for (let i = 0; i < mediaDataUris.length; i++) {
      const dataUri = mediaDataUris[i];
      const fileExtension = dataUri.substring(dataUri.indexOf('/') + 1, dataUri.indexOf(';'));
      const storageRef = ref(storage, `intents/${intentId}/media_${Date.now()}.${fileExtension}`);
      
      const base64Data = dataUri.split(',')[1];
      
      const snapshot = await uploadString(storageRef, base64Data, 'base64', {
        contentType: dataUri.substring(dataUri.indexOf(':') + 1, dataUri.indexOf(';')),
      });
      const downloadURL = await getDownloadURL(snapshot.ref);
      urls.push(downloadURL);
    }
  
    return urls;
  }

  async function onSubmit(values: FormValues) {
    if (!firestore) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Database is not initialized. Please try again later.',
        });
        return;
    }

    startTransition(async () => {
      try {
        const { media, ...formData } = values;
        
        // 1. Create document placeholder in Firestore
        const newIntentRef = collection(firestore, 'regenerative_intents');
        const docRef = await addDoc(newIntentRef, {
            ...formData,
            actionType: formData.actionType === 'Other' ? formData.otherActionTypeDescription : formData.actionType,
            socialMediaLinks: formData.socialMediaLinks ? [formData.socialMediaLinks] : [],
            status: 'pending',
            submissionDate: serverTimestamp(),
            mediaUrls: [], 
            certificateRequested: true,
            autoGeneratedTag: '',
        });
        const intentId = docRef.id;

        // 2. Convert media files and upload them
        const mediaFiles = Array.from(media);
        const mediaDataUris = await Promise.all(mediaFiles.map(fileToDataUri));
        const mediaUrls = await uploadMedia(mediaDataUris, intentId);

        // 3. Update the document with final media URLs
        await updateDoc(docRef, { mediaUrls });

        // 4. Trigger AI verification (non-blocking server action)
        const aiInput: AIAssistedIntentVerificationInput = {
          actionName: formData.actionName,
          actionType: formData.actionType,
          actionDescription: formData.shortDescription,
          location: formData.location,
          numberOfParticipants: formData.numberOfParticipants,
          photos: mediaDataUris,
          socialMediaLinks: formData.socialMediaLinks ? [formData.socialMediaLinks] : [],
        };

        // Don't await this, let it run in the background
        runAiVerification(aiInput, intentId).then(response => {
            if (response.success) {
                console.log("AI Verification started for intent:", intentId);
            } else {
                console.error("AI Verification failed to start:", response.error);
            }
        });

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
            description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
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
                      {actionCategories.map(({ category, action }) => (
                           <SelectItem key={action} value={action}>
                           {`[${category}] ${action}`}
                         </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {watchActionType === 'Other' && (
                 <FormField
                 control={form.control}
                 name="otherActionTypeDescription"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Describe your action</FormLabel>
                     <FormControl>
                       <Input placeholder="Briefly describe the action type" {...field} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
              name="shortDescription"
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
              name="media"
              render={({ field: { onChange, value, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Upload photos or videos</FormLabel>
                  <FormControl>
                    <Input type="file" multiple accept="image/*,video/*" {...fieldProps} onChange={e => onChange(e.target.files)} />
                  </FormControl>
                  <FormDescription>You can upload multiple images and videos.</FormDescription>
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
                    name="responsibleName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Jane Doe" {...field} value={field.value ?? ''} />
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
                            <Input placeholder="e.g., Green Thumbs Initiative" {...field} value={field.value ?? ''} />
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
                            <Input placeholder="my-project-tag" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormDescription>A unique tag to group all your actions. If left blank, one will be generated.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
              control={form.control}
              name="email"
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
