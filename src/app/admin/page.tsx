'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
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
import { Check, Loader2, AlertCircle, Sparkles, User, Info, FileText, Wallet, Building, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { approveAction, updateUserWallet } from './actions';
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
import { BrowserProvider, Eip1193Provider } from 'ethers';
import { doc } from 'firebase/firestore';
import Link from 'next/link';

type Action = {
  id: string;
  title: string;
  description: string;
  status: 'submitted' | 'review_ready' | 'review_failed' | 'verified' | 'rejected';
  createdAt: { _seconds: number; _nanoseconds: number; };
  aiVerification?: AIAssistedIntentVerificationOutput;
};

// Define a type for the Ethereum window object
interface WindowWithEthereum extends Window {
    ethereum?: Eip1193Provider;
}

const WalletConnector = ({ userProfile, userId }: { userProfile: any, userId: string }) => {
    const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const savedAddress = userProfile?.walletAddress;

    const connectWallet = async () => {
        const localWindow = window as WindowWithEthereum;
        if (localWindow.ethereum) {
            try {
                const provider = new BrowserProvider(localWindow.ethereum);
                const signer = await provider.getSigner();
                const address = await signer.getAddress();
                setConnectedAddress(address);
                setError(null);
            } catch (err) {
                console.error("Failed to connect wallet:", err);
                setError("Failed to connect wallet. Please make sure MetaMask is unlocked.");
            }
        } else {
            setError("MetaMask is not installed. Please install it to connect your wallet.");
        }
    };
    
    const handleSaveWallet = async () => {
        if (!connectedAddress || !userId) return;
        setIsSaving(true);
        const result = await updateUserWallet(userId, connectedAddress);
        if (result.success) {
            toast({ title: 'Success', description: 'Wallet address updated successfully.' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setIsSaving(false);
    };

    const isAddressUnsaved = connectedAddress && (connectedAddress !== savedAddress);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5"/> Web3 Wallet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {savedAddress && (
                    <div>
                        <p className="text-sm font-medium">Saved Address:</p>
                        <p className="text-xs text-muted-foreground break-all">{savedAddress}</p>
                    </div>
                )}
                {connectedAddress && connectedAddress !== savedAddress && (
                     <div>
                        <p className="text-sm font-medium">Connected Address:</p>
                        <p className="text-xs text-muted-foreground break-all">{connectedAddress}</p>
                    </div>
                )}

                {!connectedAddress && !savedAddress && (
                     <p className="text-sm text-muted-foreground">Connect your wallet to manage your on-chain identity.</p>
                )}

                <div className="flex flex-col gap-2">
                    <Button onClick={connectWallet} disabled={!!connectedAddress}>
                        {connectedAddress || savedAddress ? 'Connect Different Wallet' : 'Connect Wallet'}
                    </Button>

                    {isAddressUnsaved && (
                        <Button onClick={handleSaveWallet} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save to Profile
                        </Button>
                    )}
                </div>

                {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            </CardContent>
        </Card>
    );
};


const statusStyles: { [key: string]: { variant: "default" | "secondary" | "destructive" | "outline", text: string } } = {
  submitted: { variant: 'outline', text: 'Pending AI' },
  review_ready: { variant: 'default', text: 'Review Ready' },
  review_failed: { variant: 'destructive', text: 'AI Failed' },
  verified: { variant: 'secondary', text: 'Verified' },
  rejected: { variant: 'destructive', text: 'Rejected' },
};

const AdminPage = () => {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();

  const [submissions, setSubmissions] = useState<Action[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Action | null>(null);
  const [impactScore, setImpactScore] = useState<number | string>('');

  const userDocRef = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

  // Authorization check
  useEffect(() => {
    if (isUserLoading) return; // Wait until user object is available

    if (!user) {
      router.push('/login?redirect=/admin');
      return;
    }
    
    // Check if the user's email is the admin email
    if (user.email !== 'dev.jorge.c@gmail.com') {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to view this page.'
      });
      router.push('/dashboard'); // Redirect non-admins to their dashboard
      return;
    }
    
    // If user is an admin, proceed to fetch data
    const fetchSubmissions = async () => {
       try {
        const response = await fetch('/api/wall?all=true'); 
        if(!response.ok) throw new Error("Failed to fetch submissions");
        let data = await response.json();
        
        data.sort((a: Action, b: Action) => {
          const order = ['review_ready', 'submitted', 'review_failed', 'verified', 'rejected'];
          return order.indexOf(a.status) - order.indexOf(b.status);
        });

        setSubmissions(data);
      } catch (e) {
        setError('Could not load submissions.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSubmissions();

  }, [user, isUserLoading, router, toast]);
  
  const handleReviewClick = (submission: Action) => {
    setSelectedSubmission(submission);
    // Pre-fill score if AI provided one, otherwise empty
    setImpactScore(submission.aiVerification?.finalScore || '');
  };

  const handleApprove = async () => {
    if (!selectedSubmission || typeof impactScore !== 'number' || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Impact score is required and must be a number.' });
      return;
    }
    
    const result = await approveAction(selectedSubmission.id, impactScore, user.uid);
    if (result.success) {
      toast({ title: 'Success', description: 'Action approved successfully.' });
      setSubmissions(submissions.map(s => s.id === selectedSubmission.id ? { ...s, status: 'verified' } : s));
      setSelectedSubmission(null);
      setImpactScore('');
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };
  
  if (isUserLoading || isLoading || (user && user.email !== 'dev.jorge.c@gmail.com')) {
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
            <h1 className="font-headline text-4xl font-bold text-primary">
            Admin Panel
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
            Review submissions and manage your regenerative identity.
            </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-3">
            <main className="lg:col-span-2">
                <Card>
                    <CardHeader>
                    <CardTitle>Recent Submissions</CardTitle>
                    </CardHeader>
                    <CardContent>
                    {error && (
                        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            <h3 className="font-semibold">Error Loading Submissions</h3>
                        </div>
                        <p className="ml-7 text-sm">{error}</p>
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
                        {submissions && submissions.length > 0 ? (
                            submissions.map((submission) => (
                            <TableRow key={submission.id}>
                                <TableCell className="font-medium">
                                {submission.title}
                                </TableCell>
                                <TableCell>
                                {new Date(submission.createdAt._seconds * 1000).toLocaleDateString()}
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
                                <TableCell className="text-right">
                                {(submission.status === 'review_ready' || submission.status === 'review_failed') && (
                                    <Button onClick={() => handleReviewClick(submission)}>
                                        <Check className="mr-2 h-4 w-4" /> Review
                                    </Button>
                                )}
                                {submission.status === 'verified' && (
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/action/${submission.id}`} target="_blank"><Eye className="mr-2 h-4 w-4"/> View</Link>
                                    </Button>
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
                                {isLoading ? 'Loading submissions...' : 'No submissions to review.'}
                            </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
            </main>
            <aside className="space-y-8 lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5"/> My Organization</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">Manage your organization's profile and projects.</p>
                        <Button asChild className="w-full">
                            <Link href="/admin/organization">Manage Organization</Link>
                        </Button>
                    </CardContent>
                </Card>

                {user && userProfile && <WalletConnector userProfile={userProfile} userId={user.uid} />}
            </aside>
        </div>


      {selectedSubmission && (
        <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">{selectedSubmission.title}</DialogTitle>
                    <DialogDescription>Review the submission details and the AI's analysis before approving.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[60vh] overflow-y-auto pr-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5"/>Submission Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div>
                                <Label className="font-semibold text-muted-foreground">Description</Label>
                                <p>{selectedSubmission.description}</p>
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
                        <Card className="md:col-span-2">
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
                    <Button onClick={handleApprove} disabled={typeof impactScore !== 'number' || impactScore < 0 || impactScore > 100}>
                        <Check className="mr-2 h-4 w-4" />Approve & Certify Action
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

    </div>
  );
};

export default AdminPage;

    