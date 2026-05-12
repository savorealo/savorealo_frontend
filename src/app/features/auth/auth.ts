import { Component, inject } from '@angular/core'
import { BehaviorSubject } from 'rxjs';
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
  isRegister = new BehaviorSubject(false)
  readonly logoUrl = '/assets/icons/new_logo.png'

  toRegister($event: boolean) {
    this.isRegister.next($event)
  }

  onRegisterSubmit($event: RegisterUser){
    console.log("Hola:",$event)
    this.authStore.register($event).subscribe({
      next: ()=>{
        this.router.navigateByUrl(this.getSafeReturnUrl())
      }
    })
  }

  onLoginSubmit($event: LoginUser){
    this.authStore.login($event).subscribe({
      next: ()=>{
        this.router.navigateByUrl(this.getSafeReturnUrl())
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
