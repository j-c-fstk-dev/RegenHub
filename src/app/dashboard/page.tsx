'use client';

import React, { useEffect, useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, DocumentData, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Building, Activity, Edit, ExternalLink, Wallet, BrainCircuit, ChevronRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { BrowserProvider, Eip1193Provider } from 'ethers';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError, errorEmitter } from '@/firebase';


// Helper for status styling
const statusStyles: { [key: string]: { variant: "default" | "secondary" | "destructive" | "outline", text: string } } = {
  submitted: { variant: 'outline', text: 'Submitted' },
  review_ready: { variant: 'default', text: 'Ready for Review' },
  review_failed: { variant: 'destructive', text: 'AI Failed' },
  verified: { variant: 'secondary', text: 'Verified' },
  rejected: { variant: 'destructive', text: 'Rejected' },
};

const leapStageLabels: { [key: string]: string } = {
    L: 'Step 1: Locate',
    E: 'Step 2: Evaluate',
    A: 'Step 3: Assess',
    P: 'Step 4: Prepare',
    done: 'Completed'
}
const leapStageSlugs: { [key: string]: string } = {
    L: 'l', E: 'e', A: 'a', P: 'p', done: 'plan',
}

// Define a type for the Ethereum window object
interface WindowWithEthereum extends Window {
    ethereum?: Eip1193Provider;
}

type LeapAssessment = {
    id: string;
    stage: string;
    createdAt: { toDate: () => Date };
}

const WalletConnector = ({ userProfile, userId }: { userProfile: any, userId: string }) => {
    const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isVerifyingPoh, startPohVerification] = useTransition();
    const [isVerifyingGitcoin, startGitcoinVerification] = useTransition();
    const { toast } = useToast();
    const firestore = useFirestore();

    const [pohStatus, setPohStatus] = useState<'verified' | 'unverified' | 'unknown'>(userProfile?.pohStatus || 'unknown');
    const [gitcoinScore, setGitcoinScore] = useState<number | null>(userProfile?.gitcoinScore ?? null);

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
        if (!connectedAddress || !userId || !firestore) return;
        setIsSaving(true);
         try {
            const userRef = doc(firestore, 'users', userId);
            await updateDoc(userRef, { walletAddress: connectedAddress, pohStatus: 'unknown', gitcoinScore: null });
            toast({ title: 'Success', description: 'Wallet address updated successfully.' });
            setPohStatus('unknown');
            setGitcoinScore(null);
            setConnectedAddress(null); // Clear connected address after saving
        } catch (e: any) {
            const permissionError = new FirestorePermissionError({
                path: `users/${userId}`,
                operation: 'update',
                requestResourceData: { walletAddress: connectedAddress },
            });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setIsSaving(false);
        }
    };

    const handleVerifyPoh = () => {
        if (!savedAddress || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Save a wallet address first.' });
            return;
        }

        startPohVerification(async () => {
             try {
                const res = await fetch('/api/poh/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address: savedAddress })
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Verification request failed');
                }

                const { isHuman } = await res.json();
                const newStatus = isHuman ? 'verified' : 'unverified';

                const userRef = doc(firestore, 'users', userId);
                await updateDoc(userRef, { pohStatus: newStatus });
                setPohStatus(newStatus); // Update local state

                toast({ title: 'Verification Complete', description: `Proof of Humanity status: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}.` });
            } catch (e: any) {
                console.error("Error verifying PoH:", e);
                const permissionError = new FirestorePermissionError({
                    path: `users/${userId}`,
                    operation: 'update',
                    requestResourceData: { pohStatus: '...' },
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not verify PoH status.' });
            }
        });
    };
    
    const handleVerifyGitcoin = () => {
        if (!savedAddress || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Save a wallet address first.' });
            return;
        }

        startGitcoinVerification(async () => {
             try {
                const res = await fetch('/api/gitcoin-passport/score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address: savedAddress })
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Request to check score failed.');
                }

                const { score } = await res.json();
                const numericScore = Number(score) || 0;

                const userRef = doc(firestore, 'users', userId);
                await updateDoc(userRef, { gitcoinScore: numericScore });
                setGitcoinScore(numericScore);

                toast({ title: 'Verification Complete', description: `Your Gitcoin Passport Score is ${numericScore.toFixed(2)}.` });
            } catch (e: any) {
                console.error("Error verifying Gitcoin Passport:", e);
                 const permissionError = new FirestorePermissionError({
                    path: `users/${userId}`,
                    operation: 'update',
                    requestResourceData: { gitcoinScore: '...' },
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({ variant: 'destructive', title: 'Error', description: `Could not verify Gitcoin Passport score: ${e.message}` });
            }
        });
    };

    const isAddressUnsaved = connectedAddress && (connectedAddress !== savedAddress);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5"/> Web3 Wallet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
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
                 </div>

                <div className="space-y-2">
                     <h4 className="text-sm font-medium">Verifications</h4>
                     <div className="flex items-center justify-between rounded-md border p-3">
                         <div className="flex items-center gap-2">
                            {pohStatus === 'verified' && <ShieldCheck className="h-5 w-5 text-green-500" />}
                            {pohStatus === 'unverified' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                             <span className="font-semibold">Proof of Humanity</span>
                         </div>
                         {pohStatus === 'unknown' ? (
                            <Button size="sm" variant="secondary" onClick={handleVerifyPoh} disabled={!savedAddress || isVerifyingPoh}>
                                {isVerifyingPoh && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Check
                            </Button>
                         ) : (
                             <Badge variant={pohStatus === 'verified' ? 'secondary' : 'outline'}>{pohStatus === 'verified' ? 'Verified' : 'Not Verified'}</Badge>
                         )}
                     </div>
                     <div className="flex items-center justify-between rounded-md border p-3">
                         <div className="flex items-center gap-2">
                            <span className="font-semibold">Gitcoin Passport</span>
                         </div>
                         {gitcoinScore === null ? (
                            <Button size="sm" variant="secondary" onClick={handleVerifyGitcoin} disabled={!savedAddress || isVerifyingGitcoin}>
                                {isVerifyingGitcoin && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Check Score
                            </Button>
                         ) : (
                             <Badge variant="secondary">Score: {gitcoinScore.toFixed(2)}</Badge>
                         )}
                     </div>
                </div>


                <div className="flex flex-col gap-2 pt-4 border-t">
                    <Button onClick={connectWallet}>
                        {savedAddress ? 'Connect Different Wallet' : 'Connect Wallet'}
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


const DashboardPage = () => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/dashboard');
    }
  }, [user, isUserLoading, router]);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

  // Memoized query for user's organizations
  const orgsQuery = useMemoFirebase(() => {
    if (!user?.uid || !firestore) return null;
    return query(collection(firestore, 'organizations'), where('createdBy', '==', user.uid));
  }, [user?.uid, firestore]);

  // Memoized query for user's actions
  const actionsQuery = useMemoFirebase(() => {
    if (!user?.uid || !firestore) return null;
    return query(collection(firestore, 'actions'), where('createdBy', '==', user.uid));
  }, [user?.uid, firestore]);
  
  // Memoized query for user's LEAP assessments
  const leapQuery = useMemoFirebase(() => {
      if (!user?.uid || !firestore) return null;
      return query(collection(firestore, 'leapAssessments'), where('createdBy', '==', user.uid));
  }, [user?.uid, firestore]);

  const { data: organizations, isLoading: isLoadingOrgs } = useCollection(orgsQuery);
  const { data: actions, isLoading: isLoadingActions } = useCollection(actionsQuery);
  const { data: leapAssessments, isLoading: isLoadingLeap } = useCollection<LeapAssessment>(leapQuery);


  if (isUserLoading || isLoadingOrgs || isLoadingActions || isProfileLoading || isLoadingLeap || !user) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="container py-12">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold text-primary">Your Dashboard</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Welcome back! Here's an overview of your regenerative impact.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <aside className="lg:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'}/>
                <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{user.displayName || 'Anonymous User'}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
               <Button asChild variant="ghost" size="icon" className="ml-auto">
                 <Link href="/work-in-progress"><Edit className="h-4 w-4"/></Link>
              </Button>
            </CardContent>
          </Card>
          
           {user && userProfile && <WalletConnector userProfile={userProfile} userId={user.uid} />}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BrainCircuit />LEAP Assessments</CardTitle>
                    <CardDescription>Your active nature-related assessments.</CardDescription>
                </CardHeader>
                <CardContent>
                {leapAssessments && leapAssessments.length > 0 ? (
                    <ul className="space-y-3">
                    {leapAssessments.map(assessment => (
                        <li key={assessment.id} className="text-sm font-medium flex items-center justify-between p-2 rounded-md hover:bg-secondary">
                          <div>
                            <span className="font-semibold">Assessment from {assessment.createdAt.toDate().toLocaleDateString()}</span>
                            <div className="text-xs text-muted-foreground">
                                <span>
                                    Status: <Badge variant="outline">{leapStageLabels[assessment.stage] || 'In Progress'}</Badge>
                                </span>
                            </div>
                          </div>
                           <Button asChild variant="ghost" size="icon">
                               <Link href={`/leap/assessment/${assessment.id}/${leapStageSlugs[assessment.stage]}`}><ChevronRight className="h-4 w-4"/></Link>
                           </Button>
                        </li>
                    ))}
                    </ul>
                ) : (
                   <div className="text-center py-4 px-2 border-2 border-dashed rounded-lg">
                      <p className="text-sm text-muted-foreground">No active assessments.</p>
                       <Button asChild size="sm" variant="link" className="mt-1">
                         <Link href="/leap">Start a new LEAP Assessment</Link>
                       </Button>
                    </div>
                )}
                </CardContent>
            </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Building /> My Organizations</span>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/organization">Manage</Link>
                </Button>
              </CardTitle>
              <CardDescription>Organizations you have created.</CardDescription>
            </CardHeader>
            <CardContent>
              {organizations && organizations.length > 0 ? (
                <ul className="space-y-2">
                  {organizations.map(org => (
                    <li key={org.id} className="text-sm font-medium flex items-center justify-between">
                      <span>{org.name}</span>
                       <Button asChild variant="ghost" size="sm">
                           <Link href={`/org/${org.slug}`} target="_blank"><ExternalLink className="h-4 w-4"/></Link>
                       </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">You haven't created any organizations yet.</p>
              )}
            </CardContent>
          </Card>
        </aside>

        <main className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity /> My Actions</CardTitle>
              <CardDescription>A log of all the actions you have submitted.</CardDescription>
            </CardHeader>
            <CardContent>
              {actions && actions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actions.map(action => (
                      <TableRow key={action.id}>
                        <TableCell className="font-medium">{action.title}</TableCell>
                        <TableCell>{action.createdAt.toDate().toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={statusStyles[action.status]?.variant || 'default'}>
                            {statusStyles[action.status]?.text || action.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/action/${action.id}`}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 px-4 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground font-medium">No actions submitted yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">Ready to make an impact?</p>
                   <Button asChild size="sm" className="mt-4">
                     <Link href="/register">Submit Your First Action</Link>
                   </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
