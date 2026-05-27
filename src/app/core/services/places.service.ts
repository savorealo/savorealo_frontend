import { inject, Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { map, Observable } from 'rxjs'
import { Place, PlaceReview, PlaceType } from '@core/models/places/place.model'
import { ENVIRONMENT } from '@core/tokens/environment.token'

/**
 * Interfaz que define la estructura o contrato de datos para reviewwithuser.
 */
export interface ReviewWithUser extends PlaceReview {
  /**
   * Propiedad para gestionar display nombre.
   */
  displayName: string | null
  /**
   * Propiedad para gestionar nombre de usuario.
   */
  username:    string | null
  /**
   * Propiedad para gestionar avatar enlace.
   */
  avatarUrl:   string | null
}

/**
 * Interfaz que define la estructura o contrato de datos para placewithdistance.
 */
export interface PlaceWithDistance extends Place {
  /**
   * Propiedad para gestionar distance meters.
   */
export interface PlaceWithDistance extends Place {
  /**
   * Propiedad para gestionar distance meters.
   */
  distanceMeters: number | null
}

/**
 * Interfaz que define la estructura o contrato de datos para rawplace.
 */
interface RawPlace {
  /**
   * Propiedad para gestionar identificador.
   */
  id: string;
  /**
   * Propiedad para gestionar nombre.
   */
  name: string;
  /**
   * Propiedad para gestionar address.
   */
  address: string
  /**
   * Propiedad para gestionar place type.
   */
  place_type: string;
  /**
   * Propiedad para gestionar filters.
   */
  filters: string[] | null
  /**
   * Propiedad para gestionar descripción.
   */
  description: string | null;
  /**
   * Propiedad para gestionar media enlace.
   */
  media_url: string | null
  /**
   * Indicador booleano para es o está abrir.
   */
  is_open: boolean;
  /**
   * Propiedad para gestionar phone.
   */
  phone: string | null
  /**
   * Propiedad para gestionar specialty.
   */
  specialty: string | null;
  /**
   * Propiedad para gestionar website.
   */
  website: string | null
  /**
   * Propiedad para gestionar average rating.
   */
  average_rating: number | null;
  /**
   * Propiedad para gestionar reviews cantidad.
   */
  reviews_count: number | null
}

/**
 * Interfaz que define la estructura o contrato de datos para rawplacewithdistance.
 */
interface RawPlaceWithDistance extends RawPlace {
  /**
   * Propiedad para gestionar distance meters.
   */
  distance_meters: number | null
}

/**
 * Interfaz que define la estructura o contrato de datos para rawreview.
 */
interface RawReview {
  /**
   * Propiedad para gestionar identificador.
   */
  id: string;
  /**
   * Propiedad para gestionar user identificador.
   */
  user_id: string;
  /**
   * Propiedad para gestionar place identificador.
   */
  place_id: string
  /**
   * Propiedad para gestionar rating.
   */
  rating: number;
  /**
   * Propiedad para gestionar comment.
   */
  comment: string | null
  /**
   * Propiedad para gestionar foto enlace.
   */
  photo_url: string | null;
  /**
   * Propiedad para gestionar created at.
   */
  created_at: string
  /**
   * Propiedad para gestionar person profiles.
   */
  person_profiles: {
    /**
     * Propiedad para gestionar nombre de usuario.
     */
    username: string | null
    /**
     * Propiedad para gestionar display nombre.
     */
    display_name: string | null
    /**
     * Propiedad para gestionar avatar enlace.
     */
    avatar_url: string | null
  }[] | null
}

/**
 * Variable o constante para c o l s.
 */

/**
 * Servicio que provee la lógica de negocio para los lugares gastronómicos.
 */
@Injectable({ providedIn: 'root' })
export class PlacesService {
  /**
   * Propiedad para gestionar http.
   */
  private readonly http = inject(HttpClient)
  /**
   * Propiedad para gestionar env.
   */
  private readonly env  = inject(ENVIRONMENT)

  /**
   * Método para base.
   */
  private get base(): string {
    return `${this.env.supabaseUrl}/rest/v1`
  }

  /** Sin ubicación: todos los lugares ordenados por valoración */
  getPlaces(): Observable<PlaceWithDistance[]> {
    return this.http.get<RawPlace[]>(`${this.base}/places`, {
      params: { select: COLS, order: 'average_rating.desc' },
    }).pipe(
      map(rows => rows.map(r => ({ ...this.mapPlace(r), distanceMeters: null }))),
    )
  }

  /** Con ubicación: llama a la función PostGIS via RPC */
  getPlacesNearby(lng: number, lat: number): Observable<PlaceWithDistance[]> {
    return this.http.post<RawPlaceWithDistance[]>(`${this.base}/rpc/get_places_nearby`, {
      user_lng: lng,
      user_lat: lat,
    }).pipe(
      map(rows => rows.map(r => ({ ...this.mapPlace(r), distanceMeters: r.distance_meters }))),
    )
  }

  /**
   * Método para obtener place por identificador.
   */
  getPlaceById(id: string): Observable<Place> {
    return this.http.get<RawPlace[]>(`${this.base}/places`, {
      params: { select: COLS, id: `eq.${id}`, limit: '1' },
    }).pipe(
      map(rows => {
        if (!rows.length) throw new Error('Lugar no encontrado')
        return this.mapPlace(rows[0])
      }),
    )
  }

  /**
   * Método para obtener reviews.
   */
  getReviews(placeId: string): Observable<ReviewWithUser[]> {
    return this.http.get<RawReview[]>(`${this.base}/place_reviews`, {
      params: {
        select: 'id,user_id,place_id,rating,comment,photo_url,created_at,person_profiles!user_id(username,display_name,avatar_url)',
        place_id: `eq.${placeId}`,
        order: 'created_at.desc',
      },
    }).pipe(
      map(rows => rows.map(r => ({
        id: r.id, userId: r.user_id, placeId: r.place_id,
        rating: r.rating, comment: r.comment,
        photoUrl: r.photo_url, createdAt: new Date(r.created_at),
        displayName: r.person_profiles?.[0]?.display_name ?? null,
        username:    r.person_profiles?.[0]?.username    ?? null,
        avatarUrl:   r.person_profiles?.[0]?.avatar_url  ?? null,
      }))),
    )
  }

  /**
   * Método para añadir review.
   */
  addReview(placeId: string, userId: string, rating: number, comment: string): Observable<void> {
    return this.http.post<void>(`${this.base}/place_reviews`, {
      place_id: placeId,
      user_id: userId,
      rating,
      comment: comment || null,
    }).pipe(map(() => void 0))
  }

  /**
   * Método para map place.
   */
  private mapPlace(r: RawPlace): Place {
    return {
      id: r.id, name: r.name, address: r.address,
      location: '',
      placeType: r.place_type as PlaceType,
      filters:   (r.filters ?? []) as Place['filters'],
      description: r.description, mediaUrl: r.media_url,
      isOpen: r.is_open, phone: r.phone,
      specialty: r.specialty, website: r.website,
      averageRating: r.average_rating ?? 0,
      reviewsCount:  r.reviews_count  ?? 0,
    }
  }
}
