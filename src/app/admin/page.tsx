'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Loader2, AlertCircle, Sparkles, Eye, ShieldCheck, FileText, Link as LinkIcon, MapPin, Building, FolderKanban } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AIAssistedIntentVerificationOutput } from '@/ai/schemas/ai-assisted-intent-verification';
import { collection, query, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { errorEmitter, FirestorePermissionError } from '@/firebase';

type Action = {
  id: string;
  title: string;
  description: string;
  status: 'submitted' | 'review_ready' | 'review_failed' | 'verified' | 'rejected';
  createdAt: { toDate: () => Date };
  aiVerification?: AIAssistedIntentVerificationOutput;
  orgId: string;
  projectId: string;
  location: string;
  category: string;
  mediaUrls: string[];
  isPublic?: boolean;
};

const statusStyles: { [key: string]: { variant: "default" | "secondary" | "destructive" | "outline", text: string } } = {
  submitted: { variant: 'outline', text: 'Pending AI' },
  review_ready: { variant: 'default', text: 'Review Ready' },
  review_failed: { variant: 'destructive', text: 'AI Failed' },
  verified: { variant: 'secondary', text: 'Verified' },
  rejected: { variant: 'destructive', text: 'Rejected' },
};


const VisibilityToggle = ({ actionId, isCurrentlyPublic }: { actionId: string, isCurrentlyPublic: boolean }) => {
  const [isPublic, setIsPublic] = useState(isCurrentlyPublic);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleToggle = async (checked: boolean) => {
    if (!firestore) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Firestore is not available.',
        });
        return;
    }
    
    startTransition(async () => {
      const originalState = isPublic;
      setIsPublic(checked); // Optimistic update

      try {
        const actionRef = doc(firestore, 'actions', actionId);
        await updateDoc(actionRef, { isPublic: checked });
        toast({
          title: 'Visibility Updated',
          description: `Action is now ${checked ? 'public' : 'hidden'}.`,
        });
      } catch (error) {
        setIsPublic(originalState); // Revert on failure
         const permissionError = new FirestorePermissionError({
            path: `actions/${actionId}`,
            operation: 'update',
            requestResourceData: { isPublic: checked },
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: 'Could not update action visibility.',
        });
      }
    });
  };

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id={`visibility-${actionId}`}
        checked={isPublic}
        onCheckedChange={handleToggle}
        disabled={isPending}
        aria-label="Toggle public visibility"
      />
      <Label htmlFor={`visibility-${actionId}`} className="text-xs text-muted-foreground">
        {isPending ? 'Updating...' : (isPublic ? 'Public' : 'Hidden')}
      </Label>
    </div>
  );
};


const AdminPage = () => {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();

  const [selectedSubmission, setSelectedSubmission] = useState<Action | null>(null);
  const [impactScore, setImpactScore] = useState<number | string>('');
  const [isApproving, setIsApproving] = useState(false);

  // Client-side data fetching
  const actionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'actions'));
  }, [firestore]);

  const { data: submissionsData, isLoading: isLoadingSubmissions, error: submissionsError } = useCollection<Action>(actionsQuery);
  
  const submissions = useMemo(() => {
    if (!submissionsData) return [];
    return submissionsData.sort((a, b) => {
      const order = ['review_ready', 'submitted', 'review_failed', 'verified', 'rejected'];
      const aDate = a.createdAt?.toDate()?.getTime() || 0;
      const bDate = b.createdAt?.toDate()?.getTime() || 0;
      
      const statusDiff = order.indexOf(a.status) - order.indexOf(b.status);
      if(statusDiff !== 0) return statusDiff;
      
      return bDate - aDate;
    });
  }, [submissionsData]);

  // Authorization check
  useEffect(() => {
    if (isUserLoading) return;

    if (!user) {
      router.push('/login?redirect=/admin');
      return;
    }
    
    // Allow access only for the specific admin user email
    if (user.email !== 'dev.jorge.c@gmail.com') {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to view this page.'
      });
      router.push('/dashboard');
      return;
    }
  }, [user, isUserLoading, router, toast]);
  
  const handleReviewClick = (submission: Action) => {
    setSelectedSubmission(submission);
    setImpactScore(submission.aiVerification?.finalScore || '');
  };

  const handleApprove = async () => {
    if (!selectedSubmission || typeof impactScore !== 'number' || !user || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Impact score, user, and Firestore instance are required.' });
      return;
    }

    setIsApproving(true);
    
    try {
        const actionRef = doc(firestore, 'actions', selectedSubmission.id);
        await updateDoc(actionRef, {
            status: 'verified',
            validationScore: impactScore,
            validatorId: user.uid,
            validatedAt: serverTimestamp(),
            isPublic: true, // Set to public by default on approval
        });
        toast({ title: 'Success', description: 'Action approved successfully.' });
        setSelectedSubmission(null);
        setImpactScore('');
    } catch(error) {
        const permissionError = new FirestorePermissionError({
            path: `actions/${selectedSubmission.id}`,
            operation: 'update',
            requestResourceData: { status: 'verified', validationScore: impactScore, isPublic: true },
        });
        errorEmitter.emit('permission-error', permissionError);
        console.error("Error approving action:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
        toast({ variant: 'destructive', title: 'Error', description: `Failed to approve action: ${errorMessage}` });
    } finally {
        setIsApproving(false);
    }
  };
  
  if (isUserLoading || (user && user.email !== 'dev.jorge.c@gmail.com')) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const renderFlags = (flags?: AIAssistedIntentVerificationOutput['flags']) => {
    if (!flags) return <p className="text-sm text-muted-foreground">No flags raised.</p>;
    const activeFlags = Object.entries(flags).filter(([, value]) => value);
    if (activeFlags.length === 0) return <p className="text-sm text-muted-foreground">No flags raised.</p>;
    return (
      <ul className="space-y-1 text-sm">
        {activeFlags.map(([key, value]) => (
          <li key={key} className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="font-semibold">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
          </li>
        ))}
      </ul>
    )
  };

  return (
    <div className="container py-12">
        <header className="mb-8">
            <h1 className="font-headline text-4xl font-bold text-primary flex items-center gap-3">
              <ShieldCheck />
              Admin Panel
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Review and validate submissions from the community.
            </p>
        </header>

        <Card>
            <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            </CardHeader>
            <CardContent>
            {submissionsError && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <h3 className="font-semibold">Error Loading Submissions</h3>
                </div>
                <p className="ml-7 text-sm">{submissionsError.message}</p>
                </div>
            )}
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Action Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>AI Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {!isLoadingSubmissions && submissions.length > 0 ? (
                    submissions.map((submission) => (
                    <TableRow key={submission.id}>
                        <TableCell className="font-medium">
                        {submission.title}
                        </TableCell>
                        <TableCell>
                        {submission.createdAt?.toDate().toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                        {submission.aiVerification?.finalScore !== undefined ? (
                            <div className="flex items-center gap-1">
                                <Sparkles className="h-4 w-4 text-accent"/>
                                <span className="font-bold">{submission.aiVerification.finalScore}</span>
                            </div>
                        ): (
                            <span className="text-muted-foreground">-</span>
                        )}
                        </TableCell>
                        <TableCell>
                        <Badge variant={statusStyles[submission.status]?.variant || 'default'}>
                            {statusStyles[submission.status]?.text || submission.status}
                        </Badge>
                        </TableCell>
                        <TableCell className="text-right flex items-center justify-end gap-4">
                        {(submission.status === 'review_ready' || submission.status === 'review_failed' || submission.status === 'submitted') && (
                            <Button onClick={() => handleReviewClick(submission)}>
                                <Check className="mr-2 h-4 w-4" /> Review
                            </Button>
                        )}
                        {submission.status === 'verified' && (
                           <>
                            <VisibilityToggle actionId={submission.id} isCurrentlyPublic={submission.isPublic ?? false} />
                             <Button asChild variant="outline" size="sm">
                                <Link href={`/action/${submission.id}`} target="_blank"><Eye className="mr-2 h-4 w-4"/> View</Link>
                            </Button>
                           </>
                        )}
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                    >
                        {isLoadingSubmissions ? <span className="flex items-center justify-center"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Loading submissions...</span> : 'No submissions to review.'}
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </CardContent>
        </Card>

      {selectedSubmission && (
        <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">{selectedSubmission.title}</DialogTitle>
                    <DialogDescription>Review the submission details and the AI's analysis before approving.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[60vh] overflow-y-auto pr-4">
                    
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><FileText /> Submission Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div>
                                <Label className="font-semibold text-muted-foreground">Description</Label>
                                <p>{selectedSubmission.description}</p>
                            </div>
                             <div>
                                <Label className="font-semibold text-muted-foreground flex items-center gap-1"><FolderKanban className="h-4 w-4"/> Category</Label>
                                <p>{selectedSubmission.category}</p>
                            </div>
                             <div>
                                <Label className="font-semibold text-muted-foreground flex items-center gap-1"><MapPin className="h-4 w-4"/> Location</Label>
                                <p>{selectedSubmission.location}</p>
                            </div>
                             <div>
                                <Label className="font-semibold text-muted-foreground flex items-center gap-1"><LinkIcon className="h-4 w-4"/> Evidence</Label>
                                {selectedSubmission.mediaUrls && selectedSubmission.mediaUrls.length > 0 ? (
                                   <ul className="list-disc pl-5 space-y-1">
                                       {selectedSubmission.mediaUrls.map((url, index) => url && <li key={index}><a href={url} target="_blank" rel="noopener noreferrer" className="underline break-all text-primary hover:text-primary/80">{url}</a></li>)}
                                   </ul>
                               ) : (
                                   <p className="text-muted-foreground">No evidence provided.</p>
                               )}
                            </div>
                             <div>
                                <Label className="font-semibold text-muted-foreground flex items-center gap-1"><Building className="h-4 w-4"/> Context</Label>
                                <p>Org ID: {selectedSubmission.orgId}</p>
                                <p>Project ID: {selectedSubmission.projectId}</p>
                            </div>
                        </CardContent>
                    </Card>

                     <Card className="bg-accent/10 border-accent/50">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent"/>AI Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                           <div className="flex items-baseline gap-2">
                             <strong className="text-muted-foreground">AI Recommendation:</strong>
                             <Badge variant={selectedSubmission.aiVerification?.recommendation === 'approve' ? 'default' : 'destructive'}>{selectedSubmission.aiVerification?.recommendation || 'N/A'}</Badge>
                           </div>
                           <p><strong className="text-muted-foreground">Summary:</strong> {selectedSubmission.aiVerification?.summary ?? 'N/A'}</p>
                           <div>
                             <strong className="text-muted-foreground">Flags:</strong>
                             {renderFlags(selectedSubmission.aiVerification?.flags)}
                           </div>
                            <p><strong className="text-muted-foreground">Notes:</strong> {selectedSubmission.aiVerification?.notes ?? 'N/A'}</p>
                        </CardContent>
                    </Card>
                    
                    {selectedSubmission.aiVerification?.subscores && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">AI Subscores</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {Object.entries(selectedSubmission.aiVerification.subscores).map(([key, value]) => (
                                    <div key={key} className="flex flex-col items-center p-2 rounded-md bg-secondary">
                                        <div className="text-2xl font-bold text-primary">{value}<span className="text-sm text-muted-foreground">/10</span></div>
                                        <div className="text-xs font-medium text-center capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                </div>
                 <div className="space-y-4 pt-4 border-t">
                    <Label htmlFor="impact-score" className="font-bold text-lg">Assign Final Impact Score (0-100)</Label>
                    <Input 
                        id="impact-score" 
                        type="number" 
                        min="0" 
                        max="100" 
                        value={impactScore}
                        onChange={(e) => setImpactScore(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                        placeholder={`AI Suggestion: ${selectedSubmission.aiVerification?.finalScore ?? 'N/A'}`}
                        className="max-w-xs"
                    />
                    <p className="text-xs text-muted-foreground">Assign a score based on the action's real-world impact, relevance, and regenerative value. The AI score is a suggestion.</p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setSelectedSubmission(null)}>Cancel</Button>
                    <Button onClick={handleApprove} disabled={isApproving || typeof impactScore !== 'number' || impactScore < 0 || impactScore > 100}>
                        {isApproving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Approve & Certify Action
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

    </div>
  );
};

export default AdminPage;
