export interface LoginUserDto {
  email: string;
  password: string;
}

export interface RegisterUserDto {
  email: string;
  password: string;
  username: string;
  fullName?: string;
  bio?: string;
  birthDate: string | Date;
  photoProfile: File | null;
  photoUrl?: string;
  location?: string;
}

export interface CreateUserPayloadDto {
  username: string;
  email: string;
  password_hash: string;
  birth_date: string;
  photo_url?: string;
  bio?: string;
  location?: string;
}
