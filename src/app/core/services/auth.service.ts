import { inject, Injectable } from '@angular/core'
import { SupabaseService } from './supabase.service';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabase = inject(SupabaseService);

  login(email: string, password: string) {
    return from(this.supabase.client.auth.signInWithPassword({ email, password }))
  }

  register(usernname: string, email: string, password: string, birthdate: Date) {
    return from(this.supabase.client.auth.signUp({
      email, password,
      options: {
        data: {
          usernname: usernname,
          birthdate: birthdate,
          /* añadir los que falten */
        }
      }
    }));
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
