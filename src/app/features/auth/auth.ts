import { Component, inject } from '@angular/core'
import { ButtonModule } from 'primeng/button';
import { Title } from "@shared/title/title";
import { BehaviorSubject } from 'rxjs';
import { NgClass } from "@angular/common";
import { Login } from "./login/login";
import { LoginUser, RegisterUser } from '@core/models/user/User';
import { Register } from "./register/register";
import { AuthService } from '@core/services/auth.service';

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
  authService = inject(AuthService)
  isRegister = new BehaviorSubject(false)

  toRegister($event: boolean) {
    this.isRegister.next($event)
  }

  onRegisterSubmit($event: RegisterUser){
    console.log($event)
  }

  onLoginSubmit($event: LoginUser){
    this.authService.login($event).subscribe((data)=>{
      console.log(data)
    })
  }
}
