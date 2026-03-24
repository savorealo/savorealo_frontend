import { computed, inject, Injectable, signal } from '@angular/core'
import { SupabaseService } from './supabase.service';
import { from, Observable } from 'rxjs';
import { User } from '@supabase/supabase-js';
import { LoginUser } from '@core/models/user/User';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabase = inject(SupabaseService);
  private _user = signal<User | null>(null)

  user = this._user.asReadonly()
  isLogged = computed(()=>{
    return this._user() !== null
  })

  login(user: LoginUser) {
    return from(this.supabase.client.auth.signInWithPassword({email: user.email, password: user.password}))
  }

  register(username: string, email: string, password: string, birthDate: Date) {
    return from(
      this.supabase.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: 'PERSON',                              // por defecto PERSON
            username: username.toLowerCase().trim(),         // el trigger hace LOWER() pero mejor enviarlo ya limpio
            birth_date: birthDate.toISOString().split('T')[0], // 'YYYY-MM-DD' — el trigger espera DATE no timestamp
            full_name: null,                                  // opcional — se puede rellenar en el perfil después
            photo_url: null,                                  // opcional
            bio: null,                                  // opcional
            location: null,                                  // opcional
          }
        }
      })
    )
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

  /* Observa al usuario todo el rato si expira el token si
  cierra sesion si tiene varias sesiones abiertas si cambia
  sus datos en cualquier momento etc */
  onAuthStateChange() {
    return new Observable(observer => {
      const { data } = this.supabase.client.auth.onAuthStateChange(
        (event, session) => observer.next({ event, session })
      )
      return () => data.subscription.unsubscribe()
    })
  }
}
