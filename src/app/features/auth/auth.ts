import { Component, inject, signal } from '@angular/core'
import { NgClass } from "@angular/common";
import { Login } from "./login/login";
import { LoginUser, RegisterUser } from '@core/models/user/User';
import { Register } from "./register/register";
import { AuthStore } from '@core/store/auth.store';
import { ActivatedRoute, Router } from '@angular/router';
import { EmojiRain } from "@features/emoji-rain/emoji-rain";

/**
 * Clase de utilidad para la autenticación.
 */
@Component({
  selector: 'app-auth',
  imports: [
    NgClass,
    Login,
    Register,
  ],
  templateUrl: './auth.html',
})
export class Auth {
  /**
   * Propiedad para gestionar router.
   */
  private router = inject(Router)
  /**
   * Propiedad para gestionar route.
   */
  private route = inject(ActivatedRoute)
  /**
   * Propiedad para gestionar auth store.
   */
  authStore = inject(AuthStore)
  /**
   * Indicador booleano para es o está register.
   */
  isRegister = signal(false)
  /**
   * Propiedad para gestionar logo enlace.
   */
  readonly logoUrl = '/assets/icons/new_logo.png'

  /**
   * Método para to register.
   */
  toRegister($event: boolean) {
    this.isRegister.set($event)
  }

  /**
   * Método para evento de register enviar.
   */
  onRegisterSubmit($event: RegisterUser){
    this.authStore.register($event).subscribe({
      next: ()=>{
        this.router.navigateByUrl(this.getSafeReturnUrl())
      },
      error: (err) => {
        console.error('Register error:', err)
        alert(err?.message ?? 'Error al registrarse, inténtalo de nuevo')
      }
    })
  }

  /**
   * Método para evento de login enviar.
   */
  onLoginSubmit($event: LoginUser){
    this.authStore.login($event).subscribe({
      next: ()=>{
        this.router.navigateByUrl(this.getSafeReturnUrl())
      },
      error: (err) => {
        console.error('Login error:', err)
        alert(err?.message ?? 'Error al iniciar sesión')
      }
    })
  }

  /**
   * Método para evento de google auth.
   */
  onGoogleAuth() {
    this.authStore.loginWithGoogle().subscribe();
  }

  /**
   * Método para obtener safe return enlace.
   */
  private getSafeReturnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl')
    return returnUrl?.startsWith('/') ? returnUrl : '/'
  }
}
