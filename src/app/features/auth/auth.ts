import { Component } from '@angular/core'
import { ButtonModule } from 'primeng/button';
import { Title } from "@shared/title/title";
import { BehaviorSubject } from 'rxjs';
import { NgClass } from "@angular/common";
import { Login } from "./login/login";

@Component({
  selector: 'app-auth',
  imports: [
    ButtonModule,
    Title,
    NgClass,
    Login
],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
})
export class Auth {

  isLogin = new BehaviorSubject(true)

  toRegister($event: boolean) {
    this.isLogin.next($event)
  }
}
