
'use client';

import React, { useState, useEffect } from 'react';
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
import { Check, Loader2, AlertCircle, Sparkles, User, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { approveAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Action = {
  id: string;
  actorId: string;
  title: string;
  description: string;
  status: 'pending' | 'review_ready' | 'review_failed' | 'verified' | 'rejected';
  createdAt: { _seconds: number; _nanoseconds: number; };
  aiVerification?: {
    trustScore: number;
    reasoning: string;
  };
};

const statusStyles: { [key: string]: { variant: "default" | "secondary" | "destructive" | "outline", text: string } } = {
  pending: { variant: 'outline', text: 'Pending AI' },
  review_ready: { variant: 'default', text: 'Review Ready' },
  review_failed: { variant: 'destructive', text: 'AI Review Failed' },
  verified: { variant: 'secondary', text: 'Verified' },
  rejected: { variant: 'destructive', text: 'Rejected' },
};


const AdminPage = () => {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [submissions, setSubmissions] = useState<Action[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Action | null>(null);
  const [impactScore, setImpactScore] = useState<number | string>('');

  useEffect(() => {
    // In a real app, you would fetch all submissions from a secure admin endpoint
    const fetchSubmissions = async () => {
       try {
        // This should be an admin-only API endpoint that can query all statuses
        const response = await fetch('/api/wall?all=true'); // A real API would secure this
        if(!response.ok) throw new Error("Failed to fetch submissions");
        let data = await response.json();
        
        // Sort by status to bring actionable items to the top
        data.sort((a: Action, b: Action) => {
          const order = ['review_ready', 'pending', 'review_failed', 'verified', 'rejected'];
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
    if(user) {
        fetchSubmissions();
    }
  }, [user]);

  const handleApprove = async () => {
    if (!selectedSubmission || typeof impactScore !== 'number') {
      toast({ variant: 'destructive', title: 'Error', description: 'Impact score is required and must be a number.' });
      return;
    }
    
    const result = await approveAction(selectedSubmission.actorId, selectedSubmission.id, impactScore);
    if (result.success) {
      toast({ title: 'Success', description: 'Action approved successfully.' });
      setSubmissions(submissions.map(s => s.id === selectedSubmission.id ? { ...s, status: 'verified' } : s));
      setSelectedSubmission(null);
      setImpactScore('');
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };
  
  if (isUserLoading || (user && isLoading)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="container py-12">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold text-primary">
          Admin Panel
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Review and approve intent submissions.
        </p>
      </header>

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
                <TableHead>AI Trust</TableHead>
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
                      {submission.aiVerification?.trustScore !== undefined ? (
                        <div className="flex items-center gap-1">
                            <Sparkles className="h-4 w-4 text-accent"/>
                            <span>{submission.aiVerification.trustScore}%</span>
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
                       {submission.status === 'review_ready' && (
                          <Dialog onOpenChange={(open) => !open && setSelectedSubmission(null)}>
                            <DialogTrigger asChild>
                              <Button onClick={() => setSelectedSubmission(submission)}>
                                <Check className="mr-2 h-4 w-4" /> Review
                              </Button>
                            </DialogTrigger>
                          </Dialog>
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
                    No submissions to review.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedSubmission && (
        <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">{selectedSubmission.title}</DialogTitle>
                    <DialogDescription>Review the details of the submission and the AI's analysis before approving.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5"/>Submission Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <p><strong className="text-muted-foreground">Description:</strong> {selectedSubmission.description}</p>
                        </CardContent>
                    </Card>
                     <Card className="bg-accent/10 border-accent/50">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent"/>AI Verification</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                           <div className="flex items-baseline gap-2">
                             <strong className="text-muted-foreground">Trust Score:</strong>
                             <span className="font-bold text-xl text-accent">{selectedSubmission.aiVerification?.trustScore ?? 'N/A'}%</span>
                           </div>
                            <p><strong className="text-muted-foreground">Reasoning:</strong> {selectedSubmission.aiVerification?.reasoning ?? 'N/A'}</p>
                        </CardContent>
                    </Card>
                </div>
                 <div className="space-y-4">
                    <Label htmlFor="impact-score" className="font-bold text-lg">Assign Impact Score (0-100)</Label>
                    <Input 
                        id="impact-score" 
                        type="number" 
                        min="0" 
                        max="100" 
                        value={impactScore}
                        onChange={(e) => setImpactScore(parseInt(e.target.value, 10))}
                        placeholder="e.g., 85"
                        className="max-w-xs"
                    />
                    <p className="text-xs text-muted-foreground">Assign a score based on the action's real-world impact, relevance, and regenerative value.</p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setSelectedSubmission(null)}>Cancel</Button>
                    <Button onClick={handleApprove} disabled={typeof impactScore !== 'number' || impactScore < 0 || impactScore > 100}>
                        <Check className="mr-2 h-4 w-4" />Approve Action
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

    </div>
  );
};

export default AdminPage;
