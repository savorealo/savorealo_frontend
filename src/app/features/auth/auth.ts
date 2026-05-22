import { Component, inject, signal } from '@angular/core'
import { NgClass } from "@angular/common";
import { Login } from "./login/login";
import { LoginUser, RegisterUser } from '@core/models/user/User';
import { Register } from "./register/register";
import { AuthStore } from '@core/store/auth.store';
import { ActivatedRoute, Router } from '@angular/router';
import { EmojiRain } from "@features/emoji-rain/emoji-rain";

@Component({
  selector: 'app-auth',
  imports: [
    NgClass,
    Login,
    Register,
    EmojiRain
  ],
  templateUrl: './auth.html',
})
export class Auth {
  private router = inject(Router)
  private route = inject(ActivatedRoute)
  authStore = inject(AuthStore)
  isRegister = signal(false)
  readonly logoUrl = '/assets/icons/new_logo.png'

  toRegister($event: boolean) {
    this.isRegister.set($event)
  }

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

  onGoogleAuth() {
    this.authStore.loginWithGoogle().subscribe();
  }

  private getSafeReturnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl')
    return returnUrl?.startsWith('/') ? returnUrl : '/'
  }
}
