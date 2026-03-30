export type PostType = 'PHOTO' | 'VIDEO' | 'TEXT' | 'RECIPE';

export type PostCategory =
  | 'TRENDING' | 'ITALIAN' | 'MEXICAN' | 'JAPANESE' | 'CHINESE'
  | 'DESSERTS' | 'VEGAN' | 'QUICK_EASY' | 'BURGER' | 'SEAFOOD'
  | 'COCKTAILS' | 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACKS'
  | 'HEALTHY' | 'COMFORT_FOOD' | 'STREET_FOOD';

export interface Post {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  postType: PostType;
  title: string | null;
  description: string | null;
  categories: PostCategory[] | null;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  savesCount: number;
}
