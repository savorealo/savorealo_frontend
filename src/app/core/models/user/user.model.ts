export type UserType = 'PERSON' | 'RESTAURANT' | 'BAR';

/** Representa la fila de la tabla `users` en Supabase */
export interface UserRow {
  id: string;
  createdAt: string;
  updatedAt: string;
  userType: UserType;
  followersCount: number;
  followingCount: number;
  postsCount: number;
}

/** Vista combinada users + person_profiles que devuelve la API */
export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string | null;
  photo_url: string | null;
  bio: string | null;
  location: string | null;
  birth_date: string | null;
  postsCount: number | null;
  followersCount: number | null;
  followingCount: number | null;
}
