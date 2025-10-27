'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
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
import { Check, Eye, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { approveAction } from './actions';
import { useToast } from '@/hooks/use-toast';

type Action = {
  id: string;
  actorId: string;
  title: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: { _seconds: number; _nanoseconds: number; };
  // Add other fields from your Action entity as needed
};

const statusStyles = {
  pending: 'default',
  verified: 'secondary',
  rejected: 'destructive',
};

const AdminPage = () => {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [submissions, setSubmissions] = useState<Action[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, you would fetch submissions from your backend
    // For now, we'll use a placeholder.
    // Replace this with a fetch to an admin-only API endpoint.
    const fetchSubmissions = async () => {
       try {
        // This is a placeholder. You'd need an admin-specific API
        // to fetch all actions, including pending ones.
        const response = await fetch('/api/wall');
        if(!response.ok) throw new Error("Failed to fetch");
        let data = await response.json();
        // The wall only shows verified, so we will add some mock pending data
        const mockPending: Action[] = [
            { id: 'mock1', actorId: 'actor1', title: 'Mock Pending Action 1', status: 'pending', createdAt: { _seconds: Date.now() / 1000, _nanoseconds: 0 } },
            { id: 'mock2', actorId: 'actor2', title: 'Mock Pending Action 2', status: 'pending', createdAt: { _seconds: Date.now() / 1000, _nanoseconds: 0 } },
        ];
        // In a real implementation, your admin endpoint would return all necessary data
        setSubmissions([...data, ...mockPending]);
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

  const handleApprove = async (actorId: string, actionId: string) => {
    const result = await approveAction(actorId, actionId);
    if (result.success) {
      toast({ title: 'Success', description: 'Action approved successfully.' });
      // Refresh list
      setSubmissions(submissions.map(s => s.id === actionId ? { ...s, status: 'verified' } : s));
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
                <TableHead>Action Name</TableHead>
                <TableHead>Date</TableHead>
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
                      <Badge
                        variant={
                          statusStyles[submission.status as keyof typeof statusStyles] as any
                        }
                      >
                        {submission.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          // onClick={() => setSelectedSubmission(submission)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {submission.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                handleApprove(submission.actorId, submission.id)
                              }
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No submissions yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPage;
