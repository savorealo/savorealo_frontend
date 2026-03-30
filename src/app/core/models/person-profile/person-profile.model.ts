export interface PersonProfile {
  userId: string;
  username: string;
  fullName: string | null;
  photoUrl: string | null;
  bio: string | null;
  location: string | null;
  birthDate: string;
}
