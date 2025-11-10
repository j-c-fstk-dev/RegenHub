
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Handshake, Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTransition } from 'react';

const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }).max(2000),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const ContactPage = () => {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const form = useForm<ContactFormValues>({
        resolver: zodResolver(contactFormSchema),
        defaultValues: { name: "", email: "", message: "" },
    });

    // NOTE: This is a mock submission handler. In a real application,
    // this would be replaced with a server action to send an email.
    const onSubmit = (values: ContactFormValues) => {
        startTransition(() => {
            console.log("Form submitted:", values);
            // Simulate API call
            setTimeout(() => {
                toast({
                    title: "Message Sent!",
                    description: "Thank you for reaching out. We will get back to you shortly.",
                });
                form.reset();
            }, 1000);
        });
    };


  return (
    <div className="container py-12">
        <header className="mb-12 text-center">
            <div className="inline-block rounded-full bg-primary/10 p-4 mb-4">
                <Handshake className="h-10 w-10 text-primary"/>
            </div>
            <h1 className="font-headline text-4xl font-bold text-primary md:text-5xl">
                Partner With Us
            </h1>
            <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
                We're looking for collaborators, funders, and pilot partners to help grow the regenerative ecosystem. Let's connect.
            </p>
        </header>

        <div className="mx-auto max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Contact Form</CardTitle>
                    <CardDescription>
                        For partnership inquiries, research collaborations, or to learn more about funding RegenHub, please fill out the form below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                             <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Your Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Jane Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="jane.doe@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="message"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Message</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Tell us how you'd like to collaborate..." className="min-h-[150px]" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4"/>}
                                Send Message
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    </div>
  );
};

export default ContactPage;
