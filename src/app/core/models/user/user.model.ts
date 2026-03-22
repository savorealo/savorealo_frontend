// src/app/core/models/user.model.ts
// Forma limpia que usa el frontend — unificada independientemente del tipo

export type UserType = 'PERSON' | 'RESTAURANT' | 'BAR'

export interface User {
  id:             string
  userType:       UserType
  // Nombre unificado — full_name para personas, business_name para negocios
  name:           string
  username:       string | null   // solo personas
  avatarUrl:      string | null
  bio:            string | null
  location:       string | null
  website:        string | null   // solo negocios
  specialty:      string | null   // solo negocios
  phone:          string | null   // solo negocios
  birthDate:      Date | null     // solo personas
  followersCount: number
  followingCount: number
  postsCount:     number
  createdAt:      Date
  updatedAt:      Date
}
