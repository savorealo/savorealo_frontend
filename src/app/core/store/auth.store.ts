import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { User as UserSupabase } from '@supabase/supabase-js';
import { catchError, finalize, from, map, Observable, switchMap, tap, throwError } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user.service';
import { StorageService } from '@core/services/storage';
import { SupabaseService } from '@core/services/supabase.service';
import { ProfileService, UpdatePersonProfileInput } from '@core/services/profile-service';
import { LoginUser, RegisterUser, User } from '@core/models/user/User';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private authService    = inject(AuthService);
  private userService    = inject(UserService);
  private storageService = inject(StorageService);
  private profileService = inject(ProfileService);
  private supabase       = inject(SupabaseService); // para sacar el token de sesión
  private router         = inject(Router);

  private readonly _user    = signal<UserSupabase | null>(null);
  private readonly _profile = signal<User | null>(null);
  private readonly _loading = signal(false);
  private readonly _error   = signal<string | null>(null);

  readonly user            = this._user.asReadonly();
  readonly profile         = this._profile.asReadonly();
  readonly loading         = this._loading.asReadonly();
  readonly error           = this._error.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly currentUserId   = computed(() => this._user()?.id ?? null);

  constructor(private destroyRef: DestroyRef) {
    this.authService.onAuthStateChange().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ session }) => {
      this._user.set(session?.user ?? null);
      if (session?.user) {
        this._profile.set(this.mapMetaToProfile(session.user));
        this.loadCounters(session.user.id);
      } else {
        this._profile.set(null);
      }
    });
  }

  // ─── Auth ────────────────────────────────────────────────────────────────────

  login(user: LoginUser): Observable<void> {
    this._loading.set(true);
    this._error.set(null);
    return this.authService.login(user).pipe(
      tap(({ data, error }) => {
        if (error) throw error;
        this._user.set(data.user!);
        this._profile.set(this.mapMetaToProfile(data.user!));
        this.loadCounters(data.user!.id);
      }),
      catchError(err => {
        this._error.set(err.message);
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false)),
      map(() => void 0)
    );
  }

  loginWithGoogle(): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    return this.authService.loginWithGoogle().pipe(
      tap(({ error }) => {
        if (error) throw error;
      }),
      catchError(err => {
        this._error.set(err.message ?? 'Error al iniciar sesión con Google');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false)),
      map(() => void 0)
    );
  }

  register(userData: RegisterUser): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    if (userData.photoProfile) {
      return this.storageService.uploadAvatar(userData.photoProfile).pipe(
        switchMap(photoUrl => this.authService.register({ ...userData, photoUrl })),
        tap(({ error }) => { if (error) throw error; }),
        tap(({ data }) => {
          this._user.set(data.user!);
          this._profile.set({
            ...this.mapMetaToProfile(data.user!),
            postsCount: 0, followersCount: 0, followingCount: 0,
          });
        }),
        catchError(err => {
          this._error.set(err.message ?? 'Error al registrar');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false)),
        map(() => void 0)
      );
    }

    return this.authService.register(userData).pipe(
      tap(({ error }) => { if (error) throw error; }),
      tap(({ data }) => {
        this._user.set(data.user!);
        this._profile.set({
          ...this.mapMetaToProfile(data.user!),
          postsCount: 0, followersCount: 0, followingCount: 0,
        });
      }),
      catchError(err => {
        this._error.set(err.message ?? 'Error al registrar');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false)),
      map(() => void 0)
    );
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this._user.set(null);
      this._profile.set(null);
      this.router.navigate(['/auth']);
    });
  }

  // ─── Perfil ──────────────────────────────────────────────────────────────────

  /**
   * Actualiza el perfil del usuario autenticado.
   *
   * Flujo:
   *   1. Llama a ProfileService que actualiza person_profiles en Supabase
   *   2. Parchea _profile signal con los nuevos datos (mantiene contadores)
   *
   * El trigger SQL trg_sync_profile_to_auth sincroniza raw_user_meta_data
   * automáticamente, por lo que al recargar la sesión el perfil ya estará
   * actualizado sin ninguna llamada extra.
   *
   * Uso en componente:
   *   this.authStore.updateProfile({ bio: 'Nueva bio', location: 'Madrid' })
   *     .subscribe({
   *       next: () => this.router.navigate(['/profile']),
   *       error: () => {} // el error ya está en authStore.error()
   *     });
   */
  updateProfile(input: UpdatePersonProfileInput): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    // Sacamos el token igual que lo hace Supabase internamente
    return from(this.supabase.client.auth.getSession()).pipe(
      switchMap(({ data: { session } }) => {
        if (!session?.access_token) {
          throw new Error('No hay sesión activa');
        }
        return this.profileService.updateProfile(input, session.access_token);
      }),
      tap((updatedUser: User) => {
        // Parcheamos solo los campos editables, mantenemos contadores intactos
        this._profile.update(profile => profile ? {
          ...profile,
          username:   updatedUser.username   ?? profile.username,
          fullName:   updatedUser.fullName   ?? profile.fullName,
          photo_url:  updatedUser.photo_url  ?? profile.photo_url,
          bio:        updatedUser.bio        ?? profile.bio,
          location:   updatedUser.location   ?? profile.location,
          birth_date: updatedUser.birth_date ?? profile.birth_date,
        } : profile);
      }),
      catchError(err => {
        this._error.set(err.message ?? 'Error al actualizar perfil');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false)),
      map(() => void 0)
    );
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private mapMetaToProfile(user: UserSupabase): User {
    const meta = user.user_metadata ?? {};
    return {
      id:             user.id,
      email:          user.email ?? '',
      username:       meta['username']   ?? null,
      fullName:       meta['full_name']  ?? null,
      photo_url:      meta['photo_url']  ?? null,
      bio:            meta['bio']        ?? null,
      location:       meta['location']   ?? null,
      birth_date:     meta['birth_date'] ?? null,
      postsCount:     null,
      followersCount: null,
      followingCount: null,
    };
  }

  private loadCounters(userId: string): void {
    this.userService.getUserById(userId).subscribe({
      next: ({ data }) => {
        if (!data) return;
        this._profile.update(profile => profile ? {
          ...profile,
          postsCount:     data.postsCount,
          followersCount: data.followersCount,
          followingCount: data.followingCount,
        } : profile);
      },
      error: err => console.error('Error cargando contadores:', err)
    });
  }
}
