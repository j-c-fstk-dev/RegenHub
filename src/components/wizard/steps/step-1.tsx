"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback } from "react";
import { Loader2, FolderPlus, Building } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser, useFirestore, FirestorePermissionError, errorEmitter } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OrganizationForm } from '@/components/organization-form';
import { ProjectForm } from '@/components/project-form';
import { ActionTypeSelector } from '@/components/wizard/ActionTypeSelector';
import { useWizard } from "../wizard-context";
import { WizardLayout } from "../WizardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionDraft } from "../wizard-context";

const actionFormSchema = z.object({
  projectId: z.string().nonempty({ message: "Please select a project." }),
  title: z.string().min(5, { message: 'Action name must be at least 5 characters.' }),
  // The actionTypeId will be handled by the custom selector now.
});

type ActionFormValues = z.infer<typeof actionFormSchema>;

type Project = { id: string; title: string; };
type Organization = { id: string; name: string; slug: string; bio: string; };

const Step1 = () => {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const { setStep, updateDraft, draft, draftId } = useWizard();

    const [organization, setOrganization] = useState<Organization | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [currentSubStep, setCurrentSubStep] = useState('loading'); // loading, create_org, create_project, form
    const [selectedActionType, setSelectedActionType] = useState<Partial<ActionDraft> | null>(null);

    const form = useForm<ActionFormValues>({
        resolver: zodResolver(actionFormSchema),
        defaultValues: { projectId: draft?.projectId || '', title: draft?.title || '' },
    });

    const fetchUserOrgsAndProjects = useCallback(async () => {
      if (!user || !firestore) {
        return;
      }
      
      setCurrentSubStep('loading');
      const orgsQuery = query(collection(firestore, 'organizations'), where('createdBy', '==', user.uid));
      
      try {
          const orgSnapshot = await getDocs(orgsQuery);

          if (!orgSnapshot.empty) {
              const orgDoc = orgSnapshot.docs[0];
              const orgData = { id: orgDoc.id, ...orgDoc.data() } as Organization;
              setOrganization(orgData);
              updateDraft({ orgId: orgData.id });

              const projectsQuery = query(collection(firestore, 'projects'), where('orgId', '==', orgData.id));
              const projectsSnapshot = await getDocs(projectsQuery);
              const fetchedProjects = projectsSnapshot.docs.map(p => ({ id: p.id, title: p.data().title as string }));
              setProjects(fetchedProjects);

              if (fetchedProjects.length === 0) {
                  setCurrentSubStep('create_project');
              } else {
                  setCurrentSubStep('form');
              }
          } else {
              setOrganization(null);
              setProjects([]);
              setCurrentSubStep('create_org');
          }
      } catch (error: any) {
          const permissionError = new FirestorePermissionError({
              path: `organizations where createdBy == ${user.uid}`,
              operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
          setCurrentSubStep('error');
      }
    }, [user, firestore, updateDraft]);

    useEffect(() => {
        if (user && firestore) {
            fetchUserOrgsAndProjects();
        }
    }, [user, firestore, fetchUserOrgsAndProjects]);
    
     useEffect(() => {
        if (draft) {
            form.setValue('projectId', draft.projectId || '');
            form.setValue('title', draft.title || '');
            if(draft.actionTypeId && draft.actionTypeName && draft.baseScore && draft.domain) {
                setSelectedActionType({
                    actionTypeId: draft.actionTypeId,
                    actionTypeName: draft.actionTypeName,
                    baseScore: draft.baseScore,
                    domain: draft.domain,
                });
            }
        }
    }, [draft, form]);


    const handleOrgCreated = (newOrg: Organization) => {
        setOrganization(newOrg);
        setCurrentSubStep('create_project');
    };

    const handleProjectCreated = (newProject: Project) => {
        setProjects(prev => [...prev, newProject]);
        setCurrentSubStep('form');
    };

    const onSubmit = (values: ActionFormValues) => {
        if (!selectedActionType) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select an action type.' });
            return;
        }
        updateDraft({
            ...values,
            ...selectedActionType
        });
        setStep(2);
    }
    
    if (currentSubStep === 'loading' || isUserLoading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }
    
    if (currentSubStep === 'error') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-destructive">Permission Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Could not load your organization data due to a permissions issue. Please check the security rules for the 'organizations' collection.</p>
                </CardContent>
            </Card>
        );
    }

    if (currentSubStep === 'create_org') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl flex items-center gap-2"><Building /> Create an Organization</CardTitle>
                    <CardDescription>First, you need an organization. Actions are submitted on behalf of a collective, group, or company.</CardDescription>
                </CardHeader>
                <CardContent>{user && <OrganizationForm userId={user.uid} onOrgCreated={handleOrgCreated} />}</CardContent>
            </Card>
        );
    }

    if (currentSubStep === 'create_project') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl flex items-center gap-2"><FolderPlus /> Create a Project</CardTitle>
                    <CardDescription>Great! Now, let's create the first project for {organization?.name}. Actions belong to projects.</CardDescription>
                </CardHeader>
                <CardContent>{user && organization && <ProjectForm userId={user.uid} orgId={organization.id} onProjectCreated={handleProjectCreated} />}</CardContent>
            </Card>
        );
    }
    
    // Main form
    return (
        <WizardLayout
            title="Step 1: Identification"
            description="Tell us about the action you performed. Start by selecting the most relevant category."
            onNext={form.handleSubmit(onSubmit)}
            isNextDisabled={!form.formState.isValid || !selectedActionType}
        >
            <Form {...form}>
                <form className="space-y-8">
                    <FormField
                      control={form.control} name="projectId" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={projects.length === 0}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select the project this action belongs to" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {projects.map(p => (<SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>))}
                            </SelectContent>
                          </Select>
                          <FormDescription>You can create more projects in your <Link href="/admin/organization" className="underline">organization dashboard</Link>.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {draftId && (
                      <ActionTypeSelector
                        actionId={draftId}
                        onSelect={(v) => setSelectedActionType({
                            actionTypeId: v.id,
                            actionTypeName: v.name,
                            baseScore: v.baseScore,
                            domain: v.domain
                        })}
                        initialValue={draft}
                      />
                    )}

                    <FormField control={form.control} name="title" render={({ field }) => (
                      <FormItem><FormLabel>Name of the action</FormLabel><FormControl><Input placeholder="e.g., Community Tree Planting Day" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </form>
            </Form>
        </WizardLayout>
    );
};

export default Step1;
