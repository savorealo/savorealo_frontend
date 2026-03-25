import { Component, inject } from '@angular/core'
import { ButtonModule } from 'primeng/button';
import { Title } from "@shared/title/title";
import { BehaviorSubject } from 'rxjs';
import { NgClass } from "@angular/common";
import { Login } from "./login/login";
import { LoginUser, RegisterUser } from '@core/models/user/User';
import { Register } from "./register/register";
import { AuthStore } from '@core/auth/auth.store';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  imports: [
    ButtonModule,
    Title,
    NgClass,
    Login,
    Register
],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
})
export class Auth {
  private router = inject(Router)
  authStore = inject(AuthStore)
  isRegister = new BehaviorSubject(false)

  toRegister($event: boolean) {
    this.isRegister.next($event)
  }

  onRegisterSubmit($event: RegisterUser){
    console.log("Hola:",$event)
    this.authStore.register($event).subscribe()
  }

  onLoginSubmit($event: LoginUser){
    this.authStore.login($event).subscribe({
      next: ()=>{ 
        this.router.navigate(['/'])
      }
    })
  }
}
