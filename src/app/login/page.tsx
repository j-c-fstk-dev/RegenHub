'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams, useRouter } from 'next/navigation';
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
import { useAuth, useFirestore, useUser } from '@/firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, TwitterAuthProvider, getAdditionalUserInfo, UserCredential, createUserWithEmailAndPassword, User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';

const GoogleIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.012,35.245,44,30.028,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
);

const XIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 1200 1227" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L112.633 44.4146H302.482L604.469 507.634L651.937 575.528L1098.05 1183.43H908.196L569.165 687.854V687.828Z" fill="currentColor"/>
  </svg>
);


const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const LoginPage = () => {
  const { user, isUserLoading } = useUser();
  const [isPending, startTransition] = useTransition();
  const [isSocialPending, startSocialTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isSignUp, setIsSignUp] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && !isUserLoading) {
      router.push(searchParams.get('redirect') || '/admin');
    }
  }, [user, isUserLoading, router, searchParams]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '', name: ''},
  });

  const handleAuthSuccess = async (userCredential: UserCredential) => {
    const user = userCredential.user;
    if (!user || !firestore) return;

    const additionalInfo = getAdditionalUserInfo(userCredential);
    const isNewUser = additionalInfo?.isNewUser;
    
    let userRole = 'member'; // Default role

    if (isNewUser) {
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, {
        name: user.displayName || form.getValues('name') || 'Anonymous User',
        email: user.email,
        createdAt: serverTimestamp(),
        twitterHandle: additionalInfo?.profile?.screen_name || null,
        role: 'member' // New users are always members
      }, { merge: true });
    } else {
        // If user already exists, fetch their role
        const userRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if(userDoc.exists() && userDoc.data().role === 'admin') {
            userRole = 'admin';
        }
    }
    
    toast({
      title: 'Login Successful',
      description: "You've been successfully logged in.",
    });

    const redirectUrl = searchParams.get('redirect');
    if (redirectUrl) {
      router.push(redirectUrl);
    } else if (userRole === 'admin') {
      router.push('/admin');
    } else {
      router.push('/register');
    }
  }
  
  const handleAuthError = (error: any) => {
    console.error('Auth failed:', error);
    let description = 'An unexpected error occurred. Please try again.';
    if (error.code === 'auth/email-already-in-use') {
        description = 'This email is already in use. Try logging in instead.';
    } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        description = 'Invalid email or password.';
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      description = 'An account already exists with this email. Please sign in with the original method.';
    } else if (error.message) {
      description = error.message;
    }
    toast({
      variant: 'destructive',
      title: isSignUp ? 'Sign Up Failed' : 'Login Failed',
      description,
    });
  }

  const onEmailSubmit = (values: FormValues) => {
    if (!auth) return;
    startTransition(async () => {
      try {
        if (isSignUp) {
            if(!values.name) {
                toast({ variant: 'destructive', title: 'Sign Up Failed', description: 'Please enter your name.' });
                return;
            }
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            await handleAuthSuccess(userCredential);
        } else {
            const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
            await handleAuthSuccess(userCredential);
        }
      } catch (error: any) {
        handleAuthError(error);
      }
    });
  };

  const onSocialSubmit = (provider: GoogleAuthProvider | TwitterAuthProvider) => {
    if (!auth) return;
    startSocialTransition(async () => {
       try {
        const userCredential = await signInWithPopup(auth, provider);
        await handleAuthSuccess(userCredential);
      } catch (error: any) {
        handleAuthError(error);
      }
    })
  }

  if (isUserLoading || user) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="container flex min-h-[calc(100vh-14rem)] items-center justify-center py-12">
      <div className="mx-auto w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
             <div className="mx-auto mb-4 inline-block rounded-full bg-primary/10 p-4">
                <LogIn className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-headline text-3xl">{isSignUp ? 'Create an Account' : 'Welcome'}</CardTitle>
            <CardDescription>
              {isSignUp ? 'Fill in your details to get started.' : 'Log in or sign up to continue.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onEmailSubmit)} className="space-y-6">
                {isSignUp && (
                     <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Your Name" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
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
                <Button type="submit" className="w-full" disabled={isPending || isSocialPending}>
                  {(isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSignUp ? 'Sign Up' : 'Log In'} with Email
                </Button>
              </form>
            </Form>
             <div className="relative flex w-full items-center py-6">
                <Separator className="flex-1" />
                <span className="mx-2 flex-shrink-0 text-xs text-muted-foreground">OR</span>
                <Separator className="flex-1" />
              </div>
               <div className="flex flex-col gap-2">
                 <Button onClick={() => onSocialSubmit(new GoogleAuthProvider())} variant="outline" className="w-full" disabled={isPending || isSocialPending}>
                    {isSocialPending ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( <GoogleIcon /> )}
                    Continue with Google
                </Button>
                 <Button onClick={() => onSocialSubmit(new TwitterAuthProvider())} variant="outline" className="w-full" disabled={isPending || isSocialPending}>
                    {isSocialPending ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( <XIcon /> )}
                    Continue with X
                </Button>
              </div>
          </CardContent>
          <CardFooter className="justify-center">
             <Button variant="link" onClick={() => setIsSignUp(!isSignUp)}>
                {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
             </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
