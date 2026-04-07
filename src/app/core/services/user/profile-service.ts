import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '@env/environment';
import { User } from '@core/models/user/User';

// ── Input para updateProfile ──────────────────────────────────
// Basado en PersonProfileInput del backend.
// username: editable (el backend lo permite).
// email: excluido — se gestiona por Supabase Auth aparte.

export interface UpdatePersonProfileInput {
  username?:  string;
  fullName?:  string;
  photoUrl?:  string;
  bio?:       string;
  location?:  string;
  birthDate?: string | Date; // acepta Date o string ISO, se normaliza antes de enviar
}

// ── Mutación GraphQL ──────────────────────────────────────────

const UPDATE_PROFILE_MUTATION = `
  mutation UpdateProfile($personData: PersonProfileInput) {
    updateProfile(personData: $personData) {
      id
      email
      userType
      createdAt
      personProfile {
        userId
        username
        fullName
        photoUrl
        bio
        location
        birthDate
      }
      postCount
      followerCount
      followingCount
    }
  }
`;

// ── Servicio ──────────────────────────────────────────────────

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly graphqlUrl = environment.apiUrl + "/graphql";

  constructor(private http: HttpClient) {}

  /**
   * Actualiza el perfil del usuario autenticado.
   * El backend saca el userId del token — no hace falta pasarlo.
   *
   * @param input  Campos a actualizar (solo los que quieras cambiar)
   * @param token  JWT de Supabase del usuario autenticado
   * @returns      Observable<User> con el usuario actualizado (tu modelo existente)
   *
   * Ejemplo de uso:
   *   this.profileService.updateProfile(
   *     { bio: 'Amante de la cocina', location: 'Madrid' },
   *     this.authService.getToken()
   *   ).subscribe({
   *     next: (user) => console.log('Actualizado', user),
   *     error: (err) => console.error(err.message)
   *   });
   */
  updateProfile(input: UpdatePersonProfileInput, token: string): Observable<User> {
    if (!token) {
      return throwError(() => new Error('Token de autenticación requerido'));
    }

    const personData = this.buildPersonData(input);

    if (Object.keys(personData).length === 0) {
      return throwError(() => new Error('Debes proporcionar al menos un campo a actualizar'));
    }

    return this.http
      .post<{ data: { updateProfile: any }; errors?: { message: string }[] }>(
        this.graphqlUrl,
        { query: UPDATE_PROFILE_MUTATION, variables: { personData } },
        {
          headers: new HttpHeaders({
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${token}`,
          }),
        }
      )
      .pipe(
        map((response) => {
          if (response.errors?.length) {
            throw new Error(response.errors[0].message);
          }
          if (!response?.data?.updateProfile) {
            throw new Error('Respuesta inesperada del servidor');
          }
          return this.mapToUser(response.data.updateProfile);
        }),
        catchError((err) => {
          console.error('[ProfileService] updateProfile error:', err);
          return throwError(() => err);
        })
      );
  }

  // ── Helpers privados ──────────────────────────────────────────

  /**
   * Construye el objeto personData para GraphQL:
   * - Elimina campos undefined
   * - Normaliza birthDate a string ISO si viene como Date
   * - Mapea fullName → fullName (el backend usa camelCase en el input)
   */
  private buildPersonData(input: UpdatePersonProfileInput): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    if (input.username  !== undefined) result['username']  = input.username;
    if (input.fullName  !== undefined) result['fullName']  = input.fullName;
    if (input.photoUrl  !== undefined) result['photoUrl']  = input.photoUrl;
    if (input.bio       !== undefined) result['bio']       = input.bio;
    if (input.location  !== undefined) result['location']  = input.location;

    if (input.birthDate !== undefined) {
      result['birthDate'] = input.birthDate instanceof Date
        ? input.birthDate.toISOString()
        : input.birthDate;
    }

    return result;
  }

  /**
   * Mapea la respuesta GraphQL al modelo User que ya usas en la app.
   * Aplanamos personProfile para que coincida con tu interfaz User.
   */
  private mapToUser(gqlUser: any): User {
    const p = gqlUser.personProfile;
    return {
      id:             gqlUser.id,
      email:          gqlUser.email ?? '',
      username:       p?.username       ?? '',
      fullName:       p?.fullName       ?? null,
      photo_url:      p?.photoUrl       ?? null,
      bio:            p?.bio            ?? null,
      location:       p?.location       ?? null,
      birth_date:     p?.birthDate      ?? null,
      postsCount:     gqlUser.postCount      ?? null,
      followersCount: gqlUser.followerCount  ?? null,
      followingCount: gqlUser.followingCount ?? null,
    };
  }
}