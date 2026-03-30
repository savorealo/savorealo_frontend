export interface PlaceReview {
  id: string;
  userId: string;
  placeId: string;
  rating: number;
  comment: string | null;
  photoUrl: string | null;
  createdAt: string;
}
