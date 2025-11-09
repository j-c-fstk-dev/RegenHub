'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, DocumentData } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Building, Activity, Edit, ExternalLink, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { BrowserProvider, Eip1193Provider } from 'ethers';
import { useToast } from '@/hooks/use-toast';
import { updateUserWallet } from '../admin/actions';

// Helper for status styling
const statusStyles: { [key: string]: { variant: "default" | "secondary" | "destructive" | "outline", text: string } } = {
  submitted: { variant: 'outline', text: 'Submitted' },
  review_ready: { variant: 'default', text: 'Ready for Review' },
  review_failed: { variant: 'destructive', text: 'AI Failed' },
  verified: { variant: 'secondary', text: 'Verified' },
  rejected: { variant: 'destructive', text: 'Rejected' },
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
    if (!user || !firestore) return null;
    return query(collection(firestore, 'organizations'), where('createdBy', '==', user.uid));
  }, [user, firestore]);

  // Memoized query for user's actions
  const actionsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'actions'), where('createdBy', '==', user.uid), orderBy('createdAt', 'desc'));
  }, [user, firestore]);

  const { data: organizations, isLoading: isLoadingOrgs } = useCollection(orgsQuery);
  const { data: actions, isLoading: isLoadingActions } = useCollection(actionsQuery);

  if (isUserLoading || isLoadingOrgs || isLoadingActions || isProfileLoading || !user) {
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
               <Button variant="ghost" size="icon" className="ml-auto" disabled>
                 <Edit className="h-4 w-4"/>
              </Button>
            </CardContent>
          </Card>
          
          {user && userProfile && <WalletConnector userProfile={userProfile} userId={user.uid} />}

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
