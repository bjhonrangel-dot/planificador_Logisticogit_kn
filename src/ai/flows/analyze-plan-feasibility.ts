'use server';

/**
 * @fileOverview Provides a feasibility analysis of the shift plan, diagnosing its overall viability and suggesting improvements.
 *
 * - analyzePlanFeasibility - A function that analyzes the feasibility of a shift plan.
 * - AnalyzePlanFeasibilityInput - The input type for the analyzePlanFeasibility function.
 * - AnalyzePlanFeasibilityOutput - The return type for the analyzePlanFeasibility function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzePlanFeasibilityInputSchema = z.object({
  totalHoursMan: z
    .number()
    .describe('Total available working hours for the shift.'),
  totalCapacityRequired: z
    .number()
    .describe('Total capacity required to meet all objectives.'),
  tasks: z.array(
    z.object({
      name: z.string().describe('Name of the task'),
      capacityLograda: z.number().describe('Achieved capacity for the task'),
      cantidadObjetivo: z.number().describe('Target quantity for the task'),
    })
  ).describe('Array of tasks with their achieved capacity and target quantities'),
});
export type AnalyzePlanFeasibilityInput = z.infer<
  typeof AnalyzePlanFeasibilityInputSchema
>;

const AnalyzePlanFeasibilityOutputSchema = z.object({
  isFeasible: z.boolean().describe('Whether the plan is feasible or not. True if it complies, false if it does not.'),
  overallDiagnosis: z
    .string()
    .describe(
      'Overall diagnosis of the plan feasibility (e.g., "Cumple" or "Incumple").'
    ),
  criticalPoints: z
    .array(z.string())
    .describe('List of tasks with a capacity deficit or where there is a surplus of staff.'),
  improvementSuggestions: z
    .array(z.string())
    .describe('Suggestions to improve the plan feasibility, such as reassigning surplus staff, indicating how many more people are needed, or how much more time is required.'),
});
export type AnalyzePlanFeasibilityOutput = z.infer<
  typeof AnalyzePlanFeasibilityOutputSchema
>;

export async function analyzePlanFeasibility(
  input: AnalyzePlanFeasibilityInput
): Promise<AnalyzePlanFeasibilityOutput> {
  return analyzePlanFeasibilityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePlanFeasibilityPrompt',
  input: {schema: AnalyzePlanFeasibilityInputSchema},
  output: {schema: AnalyzePlanFeasibilityOutputSchema},
  prompt: `You are an AI assistant specialized in logistics and warehouse operations.

You are provided with the shift plan, including the total available working hours, total capacity required, and an array of tasks with their achieved capacity and target quantities.

Based on this information, provide a detailed analysis.

If the total achieved capacity is greater than or equal to the total target quantity for all tasks, the plan is feasible.
- isFeasible: true
- overallDiagnosis: "Cumple"
- criticalPoints: Identify tasks where there is a significant surplus of staff that could be reassigned.
- improvementSuggestions: Suggest reassigning surplus staff to other tasks if needed, or congratulate on the efficient plan.

If the plan is not feasible:
- isFeasible: false
- overallDiagnosis: "Incumple"
- criticalPoints: List the specific tasks that are not meeting their target.
- improvementSuggestions: For the tasks that are not meeting their target, suggest concrete actions. Indicate how many more people might be needed or how much extra time would be required to meet the goals. Be specific.

Total Available Working Hours: {{{totalHoursMan}}}
Total Capacity Required: {{{totalCapacityRequired}}}
Tasks:
{{#each tasks}}
  - Name: {{name}}, Achieved Capacity: {{capacityLograda}}, Target Quantity: {{cantidadObjetivo}}
{{/each}}
`,
});

const analyzePlanFeasibilityFlow = ai.defineFlow(
  {
    name: 'analyzePlanFeasibilityFlow',
    inputSchema: AnalyzePlanFeasibilityInputSchema,
    outputSchema: AnalyzePlanFeasibilityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
