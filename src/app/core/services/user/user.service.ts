import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { User } from '@core/models/user/User';
import { map, Observable } from 'rxjs';

interface GraphQLResponse<T> {
  data: T;
  errors?: { message: string }[];
}

interface UserByIdGQL {
  user: {
    id: string;
    userType: string;
    postCount: number;
    followerCount: number;
    followingCount: number;
    isFollowedByCurrentUser: boolean;
    personProfile: {
      username: string;
      fullName: string | null;
      photoUrl: string | null;
      bio: string | null;
      location: string | null;
    } | null;
  };
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private graphqlUrl = `${environment.apiUrl}/graphql`;
  private apiUrl = `${environment.apiUrl}/api/users`;

  getUserById(userId: string): Observable<{ data: User }> {
    const query = `
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          userType
          postCount
          followerCount
          followingCount
          isFollowedByCurrentUser
          personProfile {
            username
            fullName
            photoUrl
            bio
            location
          }
        }
      }
    `;

    return this.http.post<GraphQLResponse<UserByIdGQL>>(
      this.graphqlUrl,
      { query, variables: { id: userId } }
    ).pipe(
      map(res => {
        const u = res.data.user;
        return {
          data: {
            id: u.id,
            username: u.personProfile?.username ?? '',
            photo_url: u.personProfile?.photoUrl ?? null,
            bio: u.personProfile?.bio ?? null,
            location: u.personProfile?.location ?? null,
            fullName: u.personProfile?.fullName ?? null,
            postsCount: u.postCount,
            followersCount: u.followerCount,
            followingCount: u.followingCount,
          } as User
        };
      })
    );
  }

  updateUser(id: string, payload: { photo_url?: string; bio?: string; location?: string }): Observable<{ message: string; data: User }> {
    return this.http.put<{ message: string; data: User }>(`${this.apiUrl}/${id}`, payload);
  }
}