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
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private storageService = inject(StorageService);
  private router = inject(Router);

  // Usuario de Supabase Auth — solo para saber si está autenticado y obtener el id
  private readonly _user = signal<UserSupabase | null>(null);
  // Perfil completo de la BD (person_profiles) — foto, username, bio, etc.
  private readonly _profile = signal<User | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly user = this._user.asReadonly();
  readonly profile = this._profile.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly currentUserId = computed(() => this._user()?.id ?? null);

  constructor(private destroyRef: DestroyRef) {
    this.restoreSession();
    this.authService.onAuthStateChange().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ session }) => {
      this._user.set(session?.user ?? null);
      if (session?.user) {
        this.loadProfile(session.user.id);
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
        this.loadProfile(data.user!.id);
      }),
      catchError(err => {
        this._error.set(err.message);
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false)),
      map(() => void 0)
    );
  }

  /**
   * Flujo completo de registro:
   * 1. Si hay foto → subir a Storage ANTES del signUp (sin sesión, igual que el móvil)
   * 2. signUp con options.data (incluye photo_url si la hay)
   *    → el trigger crea auth.users + public.users + person_profiles automáticamente
   * 3. Carga el perfil de la BD en _profile
   * 4. Navegar a /home
   */
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
          this.loadProfile(data.user!.id);
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
        this.loadProfile(data.user!.id);
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

  private loadProfile(userId: string): void {
    this.userService.getUserById(userId).subscribe({
      next: ({ data }) => this._profile.set(data),
      error: err => console.error('Error cargando perfil:', err)
    });
  }

  private restoreSession(): void {
    this.authService.getSession().subscribe(({ data }) => {
      if (data?.session?.user) {
        this._user.set(data.session.user);
        this.loadProfile(data.session.user.id);
      }
    });
  }
}