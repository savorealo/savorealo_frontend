import { inject, Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { map, Observable } from 'rxjs'
import { Place, PlaceReview, PlaceType } from '@core/models/places/place.model'
import { ENVIRONMENT } from '@core/tokens/environment.token'

export interface ReviewWithUser extends PlaceReview {
  displayName: string | null
  username:    string | null
  avatarUrl:   string | null
}

export interface PlaceWithDistance extends Place {
  distanceMeters: number | null
}

interface RawPlace {
  id: string; name: string; address: string
  place_type: string; filters: string[] | null
  description: string | null; media_url: string | null
  is_open: boolean; phone: string | null
  specialty: string | null; website: string | null
  average_rating: number | null; reviews_count: number | null
}

interface RawPlaceWithDistance extends RawPlace {
  distance_meters: number | null
}

interface RawReview {
  id: string; user_id: string; place_id: string
  rating: number; comment: string | null
  photo_url: string | null; created_at: string
  person_profiles: {
    username: string | null
    display_name: string | null
    avatar_url: string | null
  }[] | null
}

const COLS = 'id,name,address,place_type,filters,description,media_url,is_open,phone,specialty,website,average_rating,reviews_count'

@Injectable({ providedIn: 'root' })
export class PlacesService {
  private readonly http = inject(HttpClient)
  private readonly env  = inject(ENVIRONMENT)

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

  addReview(placeId: string, userId: string, rating: number, comment: string): Observable<void> {
    return this.http.post<void>(`${this.base}/place_reviews`, {
      place_id: placeId,
      user_id: userId,
      rating,
      comment: comment || null,
    }).pipe(map(() => void 0))
  }

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
