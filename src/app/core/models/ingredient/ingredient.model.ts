export interface Ingredient {
  id: string;
  name: string;
  unit: string;
}

export interface RecipeIngredient {
  recipeId: string;
  ingredientId: string;
  quantity: number;
  notes: string | null;
}
