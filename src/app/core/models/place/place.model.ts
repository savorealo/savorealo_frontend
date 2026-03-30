export type PlaceType = 'RESTAURANT' | 'BAR' | 'CAFE' | 'BAKERY' | 'FOOD_TRUCK';

export type PlaceFilter =
  | 'BURGER' | 'SEAFOOD' | 'ITALIAN' | 'MEXICAN' | 'CHINESE'
  | 'JAPANESE' | 'COCKTAIL' | 'WINE' | 'HAPPY_HOUR' | 'NIGHTLIFE';

export interface Place {
  id: string;
  name: string;
  address: string;
  location: string;
  placeType: PlaceType;
  description: string | null;
  mediaUrl: string | null;
  filters: PlaceFilter[] | null;
  isOpen: boolean;
  phone: string | null;
  specialty: string | null;
  website: string | null;
  averageRating: number | null;
  reviewsCount: number | null;
}
