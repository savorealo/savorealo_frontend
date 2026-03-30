export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface Recipe {
  id: string;
  postId: string;
  name: string;
  description: string | null;
  steps: unknown;
  timeRequired: number | null;
  estimatedCost: number | null;
  servings: number | null;
  difficulty: DifficultyLevel | null;
}
