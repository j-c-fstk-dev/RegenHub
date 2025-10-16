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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState, useTransition } from 'react';
import { Loader2, Check, ChevronsUpDown, Sprout, HandHeart, MessageCircle, GraduationCap, Users, Home, Euro, Recycle, Globe, BrainCircuit, Heart, FlaskConical, CircleUserRound, Star, Waves } from 'lucide-react';
import { useFirestore, useStorage } from '@/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { runAiVerification } from '@/app/register/actions';
import { AIAssistedIntentVerificationInput } from '@/ai/flows/ai-assisted-intent-verification';
import { cn } from '@/lib/utils';

const actionCategories = [
    { category: "Personal", action: "Regenerative Self-Care", icon: HandHeart },
    { category: "Interpersonal", action: "Listening and Mutual Support Circles", icon: MessageCircle },
    { category: "Interpersonal", action: "Mediation and Nonviolent Communication", icon: MessageCircle },
    { category: "Personal", action: "Experiential Learning Journeys", icon: HandHeart },
    { category: "Social", action: "Participatory Governance", icon: Users },
    { category: "Social", action: "Local Community Projects", icon: Home },
    { category: "Social", action: "Community Care Networks", icon: Users },
    { category: "Economic", action: "Regenerative Businesses", icon: Euro },
    { category: "Economic", action: "Local Currencies and Solidarity Exchanges", icon: Euro },
    { category: "Economic", action: "Collaborative Regenerative Financing", icon: Euro },
    { category: "Economic", action: "Ethical Value Chains", icon: Euro },
    { category: "Ecological", action: "Ecosystem Restoration", icon: Sprout },
    { category: "Ecological", action: "Community Gardens", icon: Sprout },
    { category: "Ecological", action: "Circular Composting and Recycling", icon: Recycle },
    { category: "Ecological", action: "Biodiversity Monitoring", icon: Waves },
    { category: "Educational", action: "Environmental and Ecological Education", icon: GraduationCap },
    { category: "Cultural", action: "Regenerative Art and Expression", icon: Heart },
    { category: "Cultural/Spiritual", action: "Seasonal Rituals and Celebrations", icon: Star },
    { category: "Cultural", action: "Rescue of Ancestral Knowledge", icon: Heart },
    { category: "Technological", action: "Open Impact Tools", icon: BrainCircuit },
    { category: "Technological", action: "Proof-of-Impact (Living Validation)", icon: BrainCircuit },
    { category: "Technological", action: "Interoperability of Regenerative Data", icon: BrainCircuit },
    { category: "Ecological/Social", action: "Climate Adaptation Plans", icon: Globe },
    { category: "Leadership", action: "Training of Regenerative Leaders", icon: CircleUserRound },
];

const formSchema = z.object({
  actionName: z.string().min(5, { message: 'Action name must be at least 5 characters.' }),
  actionType: z.string({ required_error: 'Please select or create an action type.' }),
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
  customActionType: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function RegisterForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const firestore = useFirestore();
  const storage = useStorage();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [showCustomActionInput, setShowCustomActionInput] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      actionName: '',
      actionType: undefined,
      actionDate: '',
      location: '',
      numberOfParticipants: 1,
      shortDescription: '',
      socialMediaLinks: '',
      responsibleName: '',
      projectName: '',
      customTag: '',
      email: '',
      customActionType: '',
    },
  });

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

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      if (!firestore || !storage) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Database is not initialized. Please try again later.',
        });
        return;
      }

      try {
        const { media, ...formData } = values;

        let finalActionType = formData.actionType;
        if (formData.actionType === 'other' && formData.customActionType) {
          finalActionType = formData.customActionType;
        }

        toast({
          title: 'Processing...',
          description: 'Submitting your intent. Please wait.',
        });

        // 1. Create document without mediaUrls first
        const newIntentRef = collection(firestore, 'regenerative_intents');
        const docRef = await addDoc(newIntentRef, {
          ...formData,
          actionType: finalActionType,
          socialMediaLinks: formData.socialMediaLinks ? [formData.socialMediaLinks] : [],
          status: 'pending',
          submissionDate: serverTimestamp(),
          mediaUrls: [],
          certificateRequested: true,
          autoGeneratedTag: '',
        });

        const intentId = docRef.id;

        toast({
          title: 'Processing...',
          description: 'Uploading media files. This may take a moment.',
        });
        
        // 2. Upload media and get URLs
        const mediaFiles = Array.from(media);
        const mediaDataUris = await Promise.all(mediaFiles.map(fileToDataUri));
        const mediaUrls = await uploadMedia(mediaDataUris, intentId);

        // 3. Update the document with mediaUrls
        await updateDoc(docRef, { mediaUrls });

        // 4. Trigger AI verification (non-blocking)
        const aiInput: AIAssistedIntentVerificationInput = {
          actionName: formData.actionName,
          actionType: finalActionType,
          actionDescription: formData.shortDescription,
          location: formData.location,
          numberOfParticipants: formData.numberOfParticipants,
          photos: mediaDataUris,
          socialMediaLinks: formData.socialMediaLinks ? [formData.socialMediaLinks] : [],
        };

        runAiVerification(aiInput, intentId).then(response => {
          if (response.success) {
            console.log("AI Verification started for intent:", intentId);
          } else {
            console.error("AI Verification failed to start:", response.error);
          }
        });
        
        // 5. Show success and reset form
        toast({
          title: 'Intent Submitted!',
          description: 'Your action is now pending verification. Thank you!',
        });
        form.reset();
        setShowCustomActionInput(false);

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
                <FormItem className="flex flex-col">
                  <FormLabel>Type of action</FormLabel>
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? actionCategories.find(
                                (item) => item.action === field.value
                              )?.action
                            : "Select or type an action"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Search action or create new..."
                          onValueChange={(searchValue) => {
                              if (!actionCategories.some(item => item.action.toLowerCase() === searchValue.toLowerCase())) {
                                  form.setValue('actionType', searchValue);
                              }
                          }}
                        />
                        <CommandList>
                          <CommandEmpty>
                             <CommandItem
                                onSelect={() => {
                                  const currentValue = form.getValues('actionType');
                                  form.setValue('actionType', currentValue);
                                  setShowCustomActionInput(false);
                                  setPopoverOpen(false);
                                }}
                              >
                                Create: "{form.getValues('actionType')}"
                              </CommandItem>
                          </CommandEmpty>
                          <CommandGroup>
                            {actionCategories.map((item) => (
                              <CommandItem
                                value={item.action}
                                key={item.action}
                                onSelect={() => {
                                  form.setValue("actionType", item.action);
                                  setShowCustomActionInput(false);
                                  setPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    item.action === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <item.icon className="mr-2 h-4 w-4 text-muted-foreground"/>
                                {item.action}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {showCustomActionInput && (
              <FormField
                control={form.control}
                name="customActionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specify "Other" Action Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Describe the action type" {...field} />
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
