'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
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
import { Check, X, Eye, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  useFirestore,
  useCollection,
  useUser,
  useMemoFirebase,
} from '@/firebase';
import {
  collection,
  doc,
  updateDoc,
  Timestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import Image from 'next/image';
import { updateDocumentNonBlocking } from '@/firebase';

type RegenerativeIntent = {
  id: string;
  actionName: string;
  responsibleName: string;
  submissionDate: Timestamp;
  status: 'pending' | 'verified' | 'rejected';
  actionType: string;
  actionDate: string;
  location: string;
  numberOfParticipants: number;
  shortDescription: string;
  mediaUrls: string[];
  socialMediaLinks: string[];
  projectName?: string;
  customTag?: string;
  email: string;
};

const statusStyles = {
  pending: 'default',
  verified: 'secondary',
  rejected: 'destructive',
};

const AdminPage = () => {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const intentsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(
            collection(firestore, 'regenerative_intents'),
            orderBy('submissionDate', 'desc')
          )
        : null,
    [firestore]
  );
  const {
    data: submissions,
    isLoading: isSubmissionsLoading,
    error,
  } = useCollection<RegenerativeIntent>(intentsQuery);
  const [selectedSubmission, setSelectedSubmission] =
    useState<RegenerativeIntent | null>(null);

  const handleUpdateStatus = (
    intentId: string,
    status: 'verified' | 'rejected'
  ) => {
    if (!firestore) return;
    const intentRef = doc(firestore, 'regenerative_intents', intentId);
    updateDocumentNonBlocking(intentRef, { status });
  };

  if (isUserLoading || isSubmissionsLoading) {
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
              <p className="ml-7 text-sm">{error.message}</p>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action Name</TableHead>
                <TableHead>Submitter</TableHead>
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
                      {submission.actionName}
                    </TableCell>
                    <TableCell>{submission.responsibleName}</TableCell>
                    <TableCell>
                      {submission.submissionDate.toDate().toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          statusStyles[
                            submission.status as keyof typeof statusStyles
                          ] as any
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
                          onClick={() => setSelectedSubmission(submission)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {submission.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                handleUpdateStatus(submission.id, 'verified')
                              }
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() =>
                                handleUpdateStatus(submission.id, 'rejected')
                              }
                            >
                              <X className="h-4 w-4" />
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

      {selectedSubmission && (
        <Dialog
          open={!!selectedSubmission}
          onOpenChange={(isOpen) => !isOpen && setSelectedSubmission(null)}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">
                {selectedSubmission.actionName}
              </DialogTitle>
              <DialogDescription>
                Submitted by {selectedSubmission.responsibleName} (
                {selectedSubmission.email}) on{' '}
                {selectedSubmission.submissionDate
                  .toDate()
                  .toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>
            <div className="grid max-h-[70vh] grid-cols-1 gap-6 overflow-y-auto p-1 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="font-semibold">Submission Details</h3>
                <p>
                  <strong>Action Type:</strong> {selectedSubmission.actionType}
                </p>
                <p>
                  <strong>Action Date:</strong>{' '}
                  {new Date(selectedSubmission.actionDate).toLocaleDateString()}
                </p>
                <p>
                  <strong>Location:</strong> {selectedSubmission.location}
                </p>
                <p>
                  <strong>Participants:</strong>{' '}
                  {selectedSubmission.numberOfParticipants}
                </p>
                <p>
                  <strong>Project:</strong>{' '}
                  {selectedSubmission.projectName || 'N/A'}
                </p>
                <p>
                  <strong>Tag:</strong> {selectedSubmission.customTag || 'N/A'}
                </p>
                <h3 className="font-semibold">Description</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedSubmission.shortDescription}
                </p>
                {selectedSubmission.socialMediaLinks &&
                  selectedSubmission.socialMediaLinks.length > 0 && (
                    <div>
                      <h3 className="font-semibold">Social Media</h3>
                      <a
                        href={selectedSubmission.socialMediaLinks[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View Post
                      </a>
                    </div>
                  )}
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold">Media</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedSubmission.mediaUrls &&
                  selectedSubmission.mediaUrls.length > 0 ? (
                    selectedSubmission.mediaUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square">
                        {url.includes('video') ? (
                          <video
                            src={url}
                            controls
                            className="h-full w-full rounded-md object-cover"
                          />
                        ) : (
                          <Image
                            src={url}
                            alt={`Submission media ${index + 1}`}
                            fill
                            className="rounded-md object-cover"
                          />
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No media submitted.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <CardFooter className="flex justify-end gap-2 pt-6">
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </CardFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminPage;
