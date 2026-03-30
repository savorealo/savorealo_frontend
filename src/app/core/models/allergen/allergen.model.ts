export interface Allergen {
  id: string;
  name: string;
}

export interface UserAllergy {
  userId: string;
  allergenId: string;
}

export interface AllergenIngredient {
  allergenId: string;
  ingredientId: string;
}
