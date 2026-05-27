import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { User as UserSupabase } from '@supabase/supabase-js';
import { catchError, finalize, from, map, Observable, switchMap, tap, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user.service';
import { StorageService } from '@core/services/storage';
import { SupabaseService } from '@core/services/supabase.service';
import { PresenceService } from '@core/services/presence.service';
import { SettingsService } from '@core/services/settings.service';
import { ProfileService, UpdatePersonProfileInput } from '@core/services/profile-service';
import { LoginUser, RegisterUser, User } from '@core/models/user/User';
import { toUserMessage } from '@core/utils/user-error';
import { TranslationService, LanguageCode } from '@core/services/translation.service';

/**
 * Almacén de estado reactivo para gestionar la lógica de la autenticación.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  /**
   * Propiedad para gestionar auth service.
   */
  private authService    = inject(AuthService);
  /**
   * Propiedad para gestionar user service.
   */
  private userService    = inject(UserService);
  /**
   * Propiedad para gestionar storage service.
   */
  private storageService = inject(StorageService);
  /**
   * Propiedad para gestionar profile service.
   */
  private profileService = inject(ProfileService);
  /**
   * Propiedad para gestionar supabase.
   */
  private supabase       = inject(SupabaseService);
  /**
   * Propiedad para gestionar presence.
   */
  private presence       = inject(PresenceService);
  /**
   * Propiedad para gestionar settings.
   */
  private settings       = inject(SettingsService);
  /**
   * Propiedad para gestionar router.
   */
  private router         = inject(Router);
  /**
   * Propiedad para gestionar messages.
   */
  private messages       = inject(MessageService);
  /**
   * Propiedad para gestionar translation service.
   */
  private translationService = inject(TranslationService);

  /**
   * Propiedad para gestionar user.
   */
  private readonly _user    = signal<UserSupabase | null>(null);
  /**
   * Propiedad para gestionar profile.
   */
  private readonly _profile = signal<User | null>(null);
  /**
   * Propiedad para gestionar cargando.
   */
  private readonly _loading = signal(false);
  /**
   * Propiedad para gestionar error.
   */
  private readonly _error   = signal<string | null>(null);

  // Flag para distinguir logout voluntario de sesión expirada
  /**
   * Propiedad para gestionar logging out.
   */
  private _loggingOut = false;
  /**
   * Propiedad para gestionar settings loaded for user identificador.
   */
  private _settingsLoadedForUserId: string | null = null;

  /**
   * Propiedad para gestionar user.
   */
  readonly user            = this._user.asReadonly();
  /**
   * Propiedad para gestionar profile.
   */
  readonly profile         = this._profile.asReadonly();
  /**
   * Propiedad para gestionar cargando.
   */
  readonly loading         = this._loading.asReadonly();
  /**
   * Propiedad para gestionar error.
   */
  readonly error           = this._error.asReadonly();
  /**
   * Indicador booleano para es o está authenticated.
   */
  readonly isAuthenticated = computed(() => this._user() !== null);
  /**
   * Propiedad para gestionar current user identificador.
   */
  readonly currentUserId   = computed(() => this._user()?.id ?? null);

  /**
   * Constructor de la clase o componente para inicializar dependencias.
   */
  constructor(private destroyRef: DestroyRef) {
    let lastProfileUserId: string | null = null;

    this.authService.onAuthStateChange().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ event, session }) => {
      this._user.set(session?.user ?? null);
      if (session?.user) {
        this.presence.start(session.user.id);
        // Fallback inmediato desde JWT metadata (puede estar stale)
        this._profile.set(this.mapMetaToProfile(session.user));
        // Cargar perfil fresco desde la BD en eventos relevantes:
        // - INITIAL_SESSION / SIGNED_IN: primera carga o login
        // - USER_UPDATED: el trigger SQL sincronizó metadata
        const isRelevant = event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED';
        if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && this._settingsLoadedForUserId !== session.user.id) {
          this._settingsLoadedForUserId = session.user.id;
          this.loadUserSettings();
        }
        if (isRelevant && (lastProfileUserId !== session.user.id || event === 'USER_UPDATED')) {
          lastProfileUserId = session.user.id;
          this.loadFullProfile(session.user.id);
        }
      } else {
        this.presence.stop();
        this._profile.set(null);
        this._settingsLoadedForUserId = null;
        lastProfileUserId = null;
        if (event === 'SIGNED_OUT') {
          if (!this._loggingOut) {
            // Sesión expirada por caducidad del refresh token — informar al usuario
            this.messages.add({
              severity: 'warn',
              summary: 'Sesión expirada',
              detail: 'Por favor, inicia sesión de nuevo.',
              life: 5000,
            });
          }
          this.router.navigate(['/auth']);
        }
      }
    });
  }

  // ─── Auth ────────────────────────────────────────────────────────────────────

  /**
   * Método para login.
   */
  login(user: LoginUser): Observable<void> {
    this._loading.set(true);
    this._error.set(null);
    return this.authService.login(user).pipe(
      tap(({ data, error }) => {
        if (error) throw error;
        this._user.set(data.user!);
        this._profile.set(this.mapMetaToProfile(data.user!));
        this._settingsLoadedForUserId = data.user!.id;
        this.loadUserSettings();
        this.loadFullProfile(data.user!.id);
      }),
      catchError(err => {
        this._error.set(toUserMessage(err, 'No se pudo iniciar sesión'));
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false)),
      map(() => void 0)
    );
  }

  /**
   * Método para login with google.
   */
  loginWithGoogle(): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    return this.authService.loginWithGoogle().pipe(
      tap(({ error }) => {
        if (error) throw error;
      }),
      catchError(err => {
        this._error.set(toUserMessage(err, 'No se pudo iniciar sesión con Google'));
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false)),
      map(() => void 0)
    );
  }

  /**
   * Método para register.
   */
  register(userData: RegisterUser): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    if (userData.photoProfile) {
      return this.storageService.uploadAvatar(userData.photoProfile).pipe(
        switchMap(photoUrl => this.authService.register({ ...userData, photoUrl })),
        tap(({ error }) => { if (error) throw error; }),
        tap(({ data }) => {
          this._user.set(data.user!);
          this._settingsLoadedForUserId = data.user!.id;
          this.loadUserSettings();
          this._profile.set({
            ...this.mapMetaToProfile(data.user!),
            postsCount: 0, followersCount: 0, followingCount: 0,
          });
        }),
        catchError(err => {
          this._error.set(toUserMessage(err, 'No se pudo completar el registro'));
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
        this._settingsLoadedForUserId = data.user!.id;
        this.loadUserSettings();
        this._profile.set({
          ...this.mapMetaToProfile(data.user!),
          postsCount: 0, followersCount: 0, followingCount: 0,
        });
      }),
      catchError(err => {
        this._error.set(toUserMessage(err, 'No se pudo completar el registro'));
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false)),
      map(() => void 0)
    );
  }

  /**
   * Método para logout.
   */
  logout(): void {
    this._loggingOut = true;
    this.authService.logout().subscribe({
      complete: () => { this._loggingOut = false; },
      error:    () => { this._loggingOut = false; },
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
        // Parche optimista inmediato para que la UI refleje el cambio al instante
        this._profile.update(profile => profile ? {
          ...profile,
          username:   updatedUser.username   ?? profile.username,
          fullName:   updatedUser.fullName   ?? profile.fullName,
          photo_url:  updatedUser.photo_url  ?? profile.photo_url,
          bio:        updatedUser.bio        ?? profile.bio,
          location:   updatedUser.location   ?? profile.location,
          birth_date: updatedUser.birth_date ?? profile.birth_date,
        } : profile);

        // Recargamos el perfil completo desde la BD para que el signal
        // tenga datos frescos y no dependamos del JWT cacheado de Supabase
        const userId = this._user()?.id;
        if (userId) this.loadFullProfile(userId);
      }),
      catchError(err => {
        this._error.set(toUserMessage(err, 'No se pudo actualizar el perfil'));
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false)),
      map(() => void 0)
    );
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * Método para map meta to profile.
   */
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

  /**
   * Carga el perfil completo desde GraphQL (BD) y sobrescribe los datos
   * del JWT cacheado. Así bio, foto, location, contadores, etc. siempre
   * reflejan el estado real de la base de datos, no el user_metadata stale
   * del token de Supabase.
   */
  private loadFullProfile(userId: string): void {
    this.userService.getUserById(userId).subscribe({
      next: ({ data }) => {
        if (!data) return;
        this._profile.update(profile => profile ? {
          ...profile,
          username:       data.username       ?? profile.username,
          fullName:       data.fullName        ?? profile.fullName,
          photo_url:      data.photo_url       ?? profile.photo_url,
          bio:            data.bio             ?? profile.bio,
          location:       data.location        ?? profile.location,
          birth_date:     data.birth_date      ?? profile.birth_date,
          postsCount:     data.postsCount,
          followersCount: data.followersCount,
          followingCount: data.followingCount,
        } : profile);
      },
      error: err => console.error('Error cargando perfil:', err)
    });
  }

  /**
   * Método para cargar user settings.
   */
  private loadUserSettings(): void {
    this.settings.loadSettings().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (s) => {
        if (s.language) {
          this.translationService.setLanguage(s.language as LanguageCode);
        }
      },
      error: err => console.error('Error cargando ajustes:', err)
    });
  }
}
