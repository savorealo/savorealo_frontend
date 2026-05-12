import { computed, inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from, Observable } from 'rxjs';
import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { LoginUser, RegisterUser } from '@core/models/user/User';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService);
  private _user = signal<User | null>(null);

  user = this._user.asReadonly();
  isLogged = computed(() => this._user() !== null);

  login(user: LoginUser) {
    return from(
      this.supabase.client.auth.signInWithPassword({
        email: user.email,
        password: user.password,
      })
    );
  }

  loginWithGoogle() {
    const redirectTo = typeof window !== 'undefined'
      ? window.location.origin
      : undefined;

    return from(
      this.supabase.client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      })
    );
  }

  /**
   * El trigger handle_new_auth_user lee raw_user_meta_data y crea automáticamente:
   *   - public.users
   *   - public.person_profiles (solo si viene username)
   * La foto NO se manda aquí — se sube a Storage después del signUp
   */
  register(user: RegisterUser) {
    // El datepicker de PrimeNG devuelve un Date object, el trigger necesita 'YYYY-MM-DD'
    const birthDate = user.birthDate instanceof Date
      ? user.birthDate.toISOString().split('T')[0]
      : user.birthDate;

    return from(
      this.supabase.client.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            username: user.username.toLowerCase().trim(),
            birth_date: birthDate,
            full_name: user.fullName ?? null,
            bio: user.bio ?? null,
            location: user.location ?? null,
            photo_url: user.photoUrl ?? null,
          }
        }
      })
    );
  }

  logout() {
    return from(this.supabase.client.auth.signOut());
  }

  resetPassword(email: string) {
    return from(this.supabase.client.auth.resetPasswordForEmail(email));
  }

  getSession() {
    return from(this.supabase.client.auth.getSession());
  }

  onAuthStateChange(): Observable<{ event: AuthChangeEvent; session: Session | null }> {
    return new Observable(observer => {
      const { data } = this.supabase.client.auth.onAuthStateChange(
        (event, session) => observer.next({ event, session })
      );
      return () => data.subscription.unsubscribe();
    });
  }
}
