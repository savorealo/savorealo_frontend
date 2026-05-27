// src/app/core/models/user.model.ts
// Forma limpia que usa el frontend — unificada independientemente del tipo

/**
 * Tipo de dato personalizado para usertype.
 */
export type UserType = 'PERSON' | 'RESTAURANT' | 'BAR'

/**
 * Interfaz que define la estructura o contrato de datos para el usuario o chef.
 */
export interface User {
  /**
   * Propiedad para gestionar identificador.
   */
  id:             string
  /**
   * Propiedad para gestionar user type.
   */
  userType:       UserType
  // Nombre unificado — full_name para personas, business_name para negocios
  /**
   * Propiedad para gestionar nombre.
   */
  name:           string
  /**
   * Propiedad para gestionar nombre de usuario.
   */
  username:       string | null   // solo personas
  /**
   * Propiedad para gestionar avatar enlace.
   */
  avatarUrl:      string | null
  /**
   * Propiedad para gestionar biografía.
   */
  bio:            string | null
  /**
   * Propiedad para gestionar ubicación.
   */
  location:       string | null
  /**
   * Propiedad para gestionar website.
   */
  website:        string | null   // solo negocios
  /**
   * Propiedad para gestionar specialty.
   */
  specialty:      string | null   // solo negocios
  /**
   * Propiedad para gestionar phone.
   */
  phone:          string | null   // solo negocios
  /**
   * Propiedad para gestionar birth fecha.
   */
  birthDate:      Date | null     // solo personas
  /**
   * Propiedad para gestionar followers cantidad.
   */
  followersCount: number
  /**
   * Propiedad para gestionar following cantidad.
   */
  followingCount: number
  /**
   * Propiedad para gestionar posts cantidad.
   */
  postsCount:     number
  /**
   * Propiedad para gestionar created at.
   */
  createdAt:      Date
  /**
   * Propiedad para gestionar updated at.
   */
  updatedAt:      Date
}
