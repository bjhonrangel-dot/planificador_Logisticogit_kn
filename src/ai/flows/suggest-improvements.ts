// src/ai/flows/suggest-improvements.ts
'use server';

/**
 * @fileOverview An AI agent that analyzes a shift plan and suggests improvements to meet production goals.
 *
 * - suggestImprovements - A function that analyzes the shift plan and provides suggestions for improvement.
 * - SuggestImprovementsInput - The input type for the suggestImprovements function.
 * - SuggestImprovementsOutput - The return type for the suggestImprovements function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestImprovementsInputSchema = z.object({
  shiftPlan: z.string().describe('A description of the current shift plan, including tasks, assigned personnel, and production goals.'),
  productionGoals: z.string().describe('A description of the overall production goals for the shift.'),
  currentCapacity: z.string().describe('A description of the current production capacity based on the shift plan.'),
});
export type SuggestImprovementsInput = z.infer<typeof SuggestImprovementsInputSchema>;

const SuggestImprovementsOutputSchema = z.object({
  feasibilityAssessment: z.string().describe('An assessment of the feasibility of the current shift plan to meet production goals.'),
  criticalPoints: z.string().describe('A list of critical points or tasks where there is a deficit in meeting the goals.'),
  improvementSuggestions: z.string().describe('Key suggestions for improving the shift plan to address the critical points and meet production goals.'),
});
export type SuggestImprovementsOutput = z.infer<typeof SuggestImprovementsOutputSchema>;

export async function suggestImprovements(input: SuggestImprovementsInput): Promise<SuggestImprovementsOutput> {
  return suggestImprovementsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestImprovementsPrompt',
  input: {schema: SuggestImprovementsInputSchema},
  output: {schema: SuggestImprovementsOutputSchema},
  prompt: `You are an expert logistics manager. Analyze the provided shift plan, production goals, and current capacity, and provide suggestions to improve the plan to meet the production goals.

Shift Plan: {{{shiftPlan}}}
Production Goals: {{{productionGoals}}}
Current Capacity: {{{currentCapacity}}}

Provide the following:
- Feasibility Assessment: An assessment of the feasibility of the current shift plan to meet production goals.
- Critical Points: A list of critical points or tasks where there is a deficit in meeting the goals.
- Improvement Suggestions: Key suggestions for improving the shift plan to address the critical points and meet production goals.`,
});

const suggestImprovementsFlow = ai.defineFlow(
  {
    name: 'suggestImprovementsFlow',
    inputSchema: SuggestImprovementsInputSchema,
    outputSchema: SuggestImprovementsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
