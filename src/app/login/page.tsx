'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn } from 'lucide-react';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword, signInWithPopup, TwitterAuthProvider, getAdditionalUserInfo, UserCredential } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Separator } from '@/components/ui/separator';


const XIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 1200 1227" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L112.633 44.4146H302.482L604.469 507.634L651.937 575.528L1098.05 1183.43H908.196L569.165 687.854V687.828Z" fill="currentColor"/>
  </svg>
);


const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const [isPending, startTransition] = useTransition();
  const [isTwitterPending, startTwitterTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleAuthSuccess = (userCredential: UserCredential) => {
    const user = userCredential.user;
    const additionalInfo = getAdditionalUserInfo(userCredential);
    const isNewUser = additionalInfo?.isNewUser;
    
    // If it's a new user, create their profile in Firestore
    if (isNewUser) {
      const userRef = doc(firestore, 'users', user.uid);
      setDoc(userRef, {
        name: user.displayName || 'Anonymous User',
        email: user.email,
        createdAt: new Date(),
        twitterHandle: additionalInfo?.username || null
      }, { merge: true });
    }
    
    toast({
      title: 'Login Successful',
      description: "You've been successfully logged in.",
    });
    router.push('/admin');
  }
  
  const handleAuthError = (error: any) => {
    console.error('Login failed:', error);
    let description = 'An unexpected error occurred. Please try again.';
    // Handle specific Firebase error codes for better user feedback
    if (error.code === 'auth/account-exists-with-different-credential') {
      description = 'An account already exists with the same email address but different sign-in credentials. Try signing in with a different method.';
    } else if (error.code) {
      description = error.message;
    }
    toast({
      variant: 'destructive',
      title: 'Login Failed',
      description,
    });
  }

  const onEmailSubmit = (values: LoginFormValues) => {
    startTransition(async () => {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
        handleAuthSuccess(userCredential);
      } catch (error: any) {
        handleAuthError(error);
      }
    });
  };

  const onTwitterSubmit = () => {
    startTwitterTransition(async () => {
       try {
        const provider = new TwitterAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        handleAuthSuccess(userCredential);
      } catch (error: any) {
        handleAuthError(error);
      }
    })
  }

  return (
    <div className="container flex min-h-[calc(100vh-14rem)] items-center justify-center py-12">
      <div className="mx-auto w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
             <div className="mx-auto mb-4 inline-block rounded-full bg-primary/10 p-4">
                <LogIn className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-headline text-3xl">Admin Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onEmailSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="admin@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Log In with Email
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex-col gap-4">
              <div className="relative flex w-full items-center">
                <Separator className="flex-1" />
                <span className="mx-2 flex-shrink-0 text-xs text-muted-foreground">OR</span>
                <Separator className="flex-1" />
              </div>
              <Button onClick={onTwitterSubmit} variant="outline" className="w-full" disabled={isTwitterPending}>
                {isTwitterPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XIcon />
                )}
                Continue with X
              </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
