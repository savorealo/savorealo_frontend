export interface LoginUser{
    email: string
    password: string
}

export interface RegisterUser{
    email: string
    password: string
    username: string
    fullName?: string
    bio?: string
    birthDate: string | Date
    photoProfile: File | null
    photoUrl?: string
    location?: string
}

export interface CreateUserPayload{
    username: string;
    email: string;
    password_hash: string; // se envía el password en texto plano, el backend lo hashea
    birth_date: string;    // 'YYYY-MM-DD'
    photo_url?: string;
    bio?: string;
    location?: string;
}

/** Lo que devuelve GET /api/users/:id */
export interface User {
  id: string;
  username: string;
  fullName: string | null;
  photo_url: string | null;
  bio: string | null;
  location: string | null;
  postsCount: number;
  followersCount: number;
  followingCount: number;
}