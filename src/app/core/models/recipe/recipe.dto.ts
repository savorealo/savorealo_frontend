import { DifficultyLevel } from './recipe.model';

export interface CreateRecipeDto {
  name: string;
  description?: string;
  steps: unknown;
  timeRequired?: number;
  estimatedCost?: number;
  servings?: number;
  difficulty?: DifficultyLevel;
}
