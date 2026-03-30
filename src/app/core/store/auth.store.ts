import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { User as UserSupabase } from '@supabase/supabase-js';
import { catchError, finalize, map, Observable, switchMap, tap, throwError } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user/user.service';
import { StorageService } from '@core/services/storage';
import { LoginUser, RegisterUser, User } from '@core/models/user/User';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private authService    = inject(AuthService);
  private userService    = inject(UserService);
  private storageService = inject(StorageService);
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
        // 1. Perfil básico inmediato desde user_metadata — sin esperar red
        this._profile.set(this.mapMetaToProfile(session.user));
        // 2. Contadores desde public.users — cuando responda, actualiza el signal
        this.loadCounters(session.user.id);
      } else {
        this._profile.set(null);
      }
    });
  }

  login(user: LoginUser): Observable<void> {
    this._loading.set(true);
    this._error.set(null);
    return this.authService.login(user).pipe(
      tap(({ data, error }) => {
        if (error) throw error;
        this._user.set(data.user!);
        // Perfil básico inmediato
        this._profile.set(this.mapMetaToProfile(data.user!));
        // Contadores async — actualiza el signal cuando responda
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

  register(userData: RegisterUser): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    if (userData.photoProfile) {
      return this.storageService.uploadAvatar(userData.photoProfile).pipe(
        switchMap(photoUrl =>
          this.authService.register({ ...userData, photoUrl })
        ),
        tap(({ error }) => { if (error) throw error; }),
        tap(({ data }) => {
          this._user.set(data.user!);
          // Usuario nuevo — contadores a 0, no hace falta llamar al backend
          this._profile.set({
            ...this.mapMetaToProfile(data.user!),
            postsCount: 0, followersCount: 0, followingCount: 0,
          });
        }),
        tap(() => this.router.navigate(['/home'])),
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
      tap(() => this.router.navigate(['/home'])),
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

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Perfil básico desde user_metadata — inmediato, sin red.
   * Contadores a null hasta que loadCounters() responda.
   */
  private mapMetaToProfile(user: UserSupabase): User {
    const meta = user.user_metadata ?? {};
    console.log(meta)
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

  /**
   * Carga solo los contadores desde public.users y parchea el signal.
   * El resto del perfil ya estaba disponible desde user_metadata.
   */
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