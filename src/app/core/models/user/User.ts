/**
 * Interfaz que define la estructura o contrato de datos para loginuser.
 */
export interface LoginUser{
    /**
     * Propiedad para gestionar correo.
     */
    email: string
    /**
     * Propiedad para gestionar contraseña.
     */
    password: string
}

/**
 * Interfaz que define la estructura o contrato de datos para registeruser.
 */
export interface RegisterUser{
    /**
     * Propiedad para gestionar correo.
     */
    email: string
    /**
     * Propiedad para gestionar contraseña.
     */
    password: string
    /**
     * Propiedad para gestionar nombre de usuario.
     */
    username: string
    /**
     * Propiedad para gestionar full nombre.
     */
    fullName?: string
    /**
     * Propiedad para gestionar biografía.
     */
    bio?: string
    /**
     * Propiedad para gestionar birth fecha.
     */
    birthDate: string | Date
    /**
     * Propiedad para gestionar foto profile.
     */
    photoProfile: File | null
    /**
     * Propiedad para gestionar foto enlace.
     */
    photoUrl?: string
    /**
     * Propiedad para gestionar ubicación.
     */
    location?: string
}

/**
 * Interfaz que define la estructura o contrato de datos para createuserpayload.
 */
export interface CreateUserPayload{
    /**
     * Propiedad para gestionar nombre de usuario.
     */
    username: string;
    /**
     * Propiedad para gestionar correo.
     */
    email: string;
    /**
     * Propiedad para gestionar contraseña hash.
     */
    password_hash: string; // se envía el password en texto plano, el backend lo hashea
    /**
     * Propiedad para gestionar birth fecha.
     */
    birth_date: string;    // 'YYYY-MM-DD'
    /**
     * Propiedad para gestionar foto enlace.
     */
    photo_url?: string;
    /**
     * Propiedad para gestionar biografía.
     */
    bio?: string;
    /**
     * Propiedad para gestionar ubicación.
     */
    location?: string;
}

/** Lo que devuelve GET /api/users/:id */
export interface User {
  /**
   * Propiedad para gestionar identificador.
   */
  id:             string;
  /**
   * Propiedad para gestionar correo.
   */
  email:          string;
  /**
   * Propiedad para gestionar nombre de usuario.
   */
  username:       string;
  /**
   * Propiedad para gestionar full nombre.
   */
  fullName:       string | null;
  /**
   * Propiedad para gestionar foto enlace.
   */
  photo_url:      string | null;
  /**
   * Propiedad para gestionar biografía.
   */
  bio:            string | null;
  /**
   * Propiedad para gestionar ubicación.
   */
  location:       string | null;
  /**
   * Propiedad para gestionar birth fecha.
   */
  birth_date:     string | null;
  /**
   * Propiedad para gestionar posts cantidad.
   */
  postsCount:     number | null;
  /**
   * Propiedad para gestionar followers cantidad.
   */
  followersCount: number | null;
  /**
   * Propiedad para gestionar following cantidad.
   */
  followingCount: number | null;
  /**
   * Propiedad para gestionar si el usuario es administrador.
   */
  is_admin?: boolean;
}