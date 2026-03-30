export interface CreatePlaceReviewDto {
  placeId: string;
  rating: number;
  comment?: string;
  photoUrl?: string;
}
