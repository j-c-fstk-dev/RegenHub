'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertCircle, FileText, Calendar, Check, X, Clock, Edit, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { errorEmitter, FirestorePermissionError } from '@/firebase';


type PlanItem = {
  action: string;
  owner: string;
  deadline: string;
  cost?: number;
  kpi?: string;
  notes?: string;
  status?: 'pending' | 'done_on_time' | 'done_late';
};

type LeapAssessment = {
  id: string;
  plan: PlanItem[];
};

const PlanItemCard = ({ item, index, assessmentId, onUpdate }: { item: PlanItem, index: number, assessmentId: string, onUpdate: (updatedPlan: PlanItem[]) => void }) => {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [notes, setNotes] = useState(item.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const handleUpdateStatus = async (newStatus: 'done_on_time' | 'done_late') => {
    if (!firestore) return;
    
    try {
        const assessmentRef = doc(firestore, 'leapAssessments', assessmentId);
        const docSnap = await (await import('firebase/firestore')).getDoc(assessmentRef);
        const currentData = docSnap.data();
        if (!currentData || !currentData.plan) return;
        
        const newPlan = [...currentData.plan];
        newPlan[index].status = newStatus;
        
        await updateDoc(assessmentRef, { plan: newPlan });
        onUpdate(newPlan); // Update parent state
        toast({ title: "Status Updated!", description: `Action marked as ${newStatus.replace('_', ' ')}.` });
    } catch (e) {
        console.error("Error updating status:", e);
        const permissionError = new FirestorePermissionError({ path: `leapAssessments/${assessmentId}`, operation: 'update', requestResourceData: { plan: `...update item ${index}...` } });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: 'destructive', title: "Update Failed" });
    }
  };

  const handleSaveNotes = async () => {
      if (!firestore) return;
      setIsSavingNotes(true);
      try {
        const assessmentRef = doc(firestore, 'leapAssessments', assessmentId);
        const docSnap = await (await import('firebase/firestore')).getDoc(assessmentRef);
        const currentData = docSnap.data();
        if (!currentData || !currentData.plan) return;
        
        const newPlan = [...currentData.plan];
        newPlan[index].notes = notes;
        
        await updateDoc(assessmentRef, { plan: newPlan });
        onUpdate(newPlan); // Update parent state
        toast({ title: "Notes Saved!" });
      } catch(e) {
         console.error("Error saving notes:", e);
         const permissionError = new FirestorePermissionError({ path: `leapAssessments/${assessmentId}`, operation: 'update', requestResourceData: { plan: `...update item ${index}...` } });
         errorEmitter.emit('permission-error', permissionError);
         toast({ variant: 'destructive', title: "Save Failed" });
      } finally {
        setIsSavingNotes(false);
      }
  }

  const statusMap = {
    pending: { icon: Clock, text: 'Pending', color: 'bg-yellow-500' },
    done_on_time: { icon: Check, text: 'Done on Time', color: 'bg-green-500' },
    done_late: { icon: Check, text: 'Done Late', color: 'bg-blue-500' },
  };
  const currentStatus = item.status || 'pending';
  const { icon: StatusIcon, text: statusText, color: statusColor } = statusMap[currentStatus];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-semibold">{item.action}</CardTitle>
             <Badge variant={currentStatus === 'pending' ? 'outline' : 'default'} className={currentStatus !== 'pending' ? `${statusColor} text-white` : ''}>
                <StatusIcon className="h-4 w-4 mr-2" />
                {statusText}
            </Badge>
        </div>
        <CardDescription>Owner: {item.owner}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2"/>
            Deadline: {new Date(item.deadline).toLocaleDateString()}
        </div>
        <div>
            <h4 className="font-semibold text-sm mb-2">Notes</h4>
            <Textarea 
                placeholder="Add notes about progress, challenges, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
            />
            <Button size="sm" variant="outline" className="mt-2" onClick={handleSaveNotes} disabled={isSavingNotes}>
                {isSavingNotes ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}
                <span className="ml-2">Save Notes</span>
            </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="secondary" disabled={currentStatus !== 'pending'}>
                    <Edit className="h-4 w-4 mr-2"/> Update Status
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleUpdateStatus('done_on_time')}>
                   <Check className="h-4 w-4 mr-2"/> Completed On Time
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => handleUpdateStatus('done_late')}>
                   <Clock className="h-4 w-4 mr-2"/> Completed with Delay
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <Button disabled={currentStatus === 'pending'}>Register Action on Wall</Button>
      </CardFooter>
    </Card>
  );
};


const LeapPlanPage = () => {
  const params = useParams();
  const assessmentId = params.assessmentId as string;
  const firestore = useFirestore();

  const assessmentDocRef = useMemoFirebase(() => {
    if (!firestore || !assessmentId) return null;
    return doc(firestore, 'leapAssessments', assessmentId);
  }, [firestore, assessmentId]);

  const { data: assessment, isLoading, error } = useDoc<LeapAssessment>(assessmentDocRef);

  // Local state for plan items to allow immediate UI updates
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);

  useEffect(() => {
    if(assessment?.plan) {
        setPlanItems(assessment.plan);
    }
  }, [assessment]);

  const handlePlanUpdate = (updatedPlan: PlanItem[]) => {
      setPlanItems(updatedPlan);
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="container py-12">
        <Card className="max-w-2xl mx-auto border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle /> Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error?.message || "Could not load the assessment plan."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12">
        <header className="mb-8">
            <p className="text-sm font-semibold text-primary">LEAP Assessment</p>
            <h1 className="font-headline text-4xl font-bold flex items-center gap-3">
                <FileText className="h-8 w-8" />
                Action Plan Tracker
            </h1>
            <p className="mt-2 text-lg text-muted-foreground max-w-3xl">
                Track the progress of the actions defined in your LEAP assessment.
            </p>
        </header>

        <div className="grid gap-6">
            {planItems.length > 0 ? (
                planItems.map((item, index) => (
                    <PlanItemCard key={index} item={item} index={index} assessmentId={assessmentId} onUpdate={handlePlanUpdate} />
                ))
            ) : (
                 <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        No action plan has been defined for this assessment.
                    </CardContent>
                </Card>
            )}
        </div>
    </div>
  );
};

export default LeapPlanPage;
