import { Component, computed, inject, output, signal } from '@angular/core'
import { StepperModule } from 'primeng/stepper'
import { ButtonModule } from 'primeng/button'
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms'
import { RegisterUser } from '@core/models/user/User'
import { PasswordModule } from 'primeng/password'
import { DatePickerModule } from 'primeng/datepicker'
import { TextareaModule } from 'primeng/textarea'
import { InputTextModule } from 'primeng/inputtext'
import { MessageModule } from 'primeng/message'
import { Header as Header_Step_1 } from './steps/step1/header/header'
import { Header as Header_Step_2 } from './steps/step2/header/header'
import { Header as Header_Step_3 } from './steps/step3/header/header'
import { Body as Body_Step_1 } from "./steps/step1/body/body"
import { Body as Body_Step_2 } from "./steps/step2/body/body"
import { Body as Body_Step_3 } from "./steps/step3/body/body"

function passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
  const password        = form.get('password')?.value
  const confirmPassword = form.get('confirmPassword')?.value
  return password === confirmPassword ? null : { passwordMismatch: true }
}

@Component({
  selector: 'app-register',
  imports: [
    StepperModule,
    ButtonModule,
    ReactiveFormsModule,
    PasswordModule,
    DatePickerModule,
    TextareaModule,
    InputTextModule,
    MessageModule,
    Header_Step_1,
    Header_Step_2,
    Header_Step_3,
    Body_Step_1,
    Body_Step_2,
    Body_Step_3,
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {

  toLoginEvent     = output()
  activeStep       = signal<number>(1)
  onSubmitEvent    = output<RegisterUser>()
  private formBuilder = inject(FormBuilder)

  

  registerTitle = computed(() => {
    if (this.activeStep() === 1) return 'Create your account'
    if (this.activeStep() === 2) return 'Create your profile'
    if (this.activeStep() === 3) return 'Add a photo'
    return ''
  })

  /* Definde si el usuario debe poder pasar al paso 2 */
  isValidStep2 = computed(()=>{
    if(
     this.registerForm.get('email')?.valid &&
     this.registerForm.get('username')?.valid &&
     this.registerForm.get('password')?.valid &&
     this.registerForm.get('confirmPassword')?.valid
    ){
      return true
    }else return false

  })

  /* Define si el usuario puede pasar al paso 3 */
  isValidStep3 = computed(()=>{
    if(
      this.isValidStep2() &&
      this.registerForm.get("fullName")?.valid &&
      this.registerForm.get("birthDate")?.valid &&
      this.registerForm.get("bio")?.valid
    ){ 
      return true
    } else {
      return false
    }
  })

  registerForm: FormGroup = this.formBuilder.group({
    // Step 1
    email:           ['', [Validators.required, Validators.email]],
    username:        ['', Validators.required],
    password:        ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()\-_+=.])[A-Za-z\d@$!%*?&#^()\-_+=.]+$/)
    ]],
    confirmPassword: ['', Validators.required],
    // Step 2
    fullName:  ['', Validators.required],
    birthDate: [null, Validators.required],
    bio:       [''],
    // Step 3
    photo: [null]
  }, { validators: passwordMatchValidator })

  isInvalid(controlName: string): boolean {
    const control = this.registerForm.get(controlName)
    return !!(control?.invalid && control.touched)
  }

  onPhotoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
      this.registerForm.get('photo')?.setValue(file)
    }
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.onSubmitEvent.emit({
        email:        this.registerForm.get('email')?.value,
        password:     this.registerForm.get('password')?.value,
        username:     this.registerForm.get('username')?.value,
        fullName:     this.registerForm.get('fullName')?.value,
        bio:          this.registerForm.get('bio')?.value,
        birthDate:    this.registerForm.get('birthDate')?.value,
        photoProfile: this.registerForm.get('photo')?.value,
      })
    }else console.log("invalido")
  }

  isValid(formControlName: string):boolean{
    return this.registerForm.get(formControlName)?.valid || false
  }

  activateSecondStep(){
    if(this.isValidStep2()){
      this.activeStep.set(2);
    }
  }
  activateThirdStep(){
    if(this.isValidStep2() && this.isValidStep3()){
      this.activeStep.set(3);
    }
  }

  toLogin(){
    this.toLoginEvent.emit()
  }
}