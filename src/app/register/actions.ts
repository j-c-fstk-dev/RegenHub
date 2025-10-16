"use server";

import { z } from "zod";
import { aiAssistedIntentVerification } from "@/ai/flows/ai-assisted-intent-verification";

// A simplified input schema for the action, as the full schema is on the client.
const ActionInputSchema = z.object({
  actionName: z.string(),
  actionType: z.string(),
  actionDescription: z.string(),
  location: z.string(),
  numberOfParticipants: z.number(),
  photos: z.array(z.string()),
  socialMediaLinks: z.array(z.string()),
  contactEmail: z.string().email(),
});

type ActionInput = z.infer<typeof ActionInputSchema>;


async function sendEmailNotification(data: ActionInput) {
    // In a real app, you would use an email service like Resend, SendGrid, or AWS SES.
    // For this example, we'll just log to the console.
    console.log("Sending email notification to admin about new submission from:", data.contactEmail);
    console.log("Submission details:", JSON.stringify(data, null, 2));

    // Example of what it might look like with a real service:
    //
    // import { Resend } from 'resend';
    // const resend = new Resend(process.env.RESEND_API_KEY);
    //
    // await resend.emails.send({
    //   from: 'submissions@regen-hub.com',
    //   to: 'admin@regen-hub.com',
    //   subject: `New Intent Submission: ${data.actionName}`,
    //   html: `<p>A new intent has been submitted by ${data.contactEmail}.</p><p>Details: ${data.actionDescription}</p>`
    // });
    
    return Promise.resolve();
}


export async function submitIntent(
  data: ActionInput
): Promise<{ success: boolean; error?: string; verification?: any }> {
  const validatedData = ActionInputSchema.safeParse(data);

  if (!validatedData.success) {
    return { success: false, error: "Invalid data provided." };
  }

  try {
    const verificationResult = await aiAssistedIntentVerification(validatedData.data);
    
    console.log("AI Verification Result:", verificationResult);
    
    // In a real application, you would now save the intent and the verification result to a database.
    
    // Send email notification
    await sendEmailNotification(validatedData.data);


    return { success: true, verification: verificationResult };

  } catch (error) {
    console.error("Error during AI verification:", error);
    return { success: false, error: "An error occurred during the verification process." };
  }
}
