import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI()],
  // Use a model that supports JSON output for structured responses.
  model: 'googleai/gemini-2.5-flash',
});
