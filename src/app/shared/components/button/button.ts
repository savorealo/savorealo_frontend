import { Component, Input } from '@angular/core'
import { Button as PrimeNGButton } from 'primeng/button';
import type { ButtonSeverity } from 'primeng/button';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**Como usarlo:
 * <!-- Uso -->
    <app-button label="Seguir"         variant="primary"   />
    <app-button label="Editar perfil"  variant="secondary" />
    <app-button label="Ver más"        variant="ghost"     />
    <app-button label="Eliminar post"  variant="danger"    icon="pi pi-trash" />
    <app-button label="Publicar"       variant="primary"   [loading]="true"   />
    <app-button label="Guardar"        variant="primary"   size="lg" [full]="true" />
 */

@Component({
  selector: 'app-button',
  imports: [PrimeNGButton],
  template: `
    <p-button
      [label]="label"
      [icon]="icon"
      [loading]="loading"
      [disabled]="disabled"
      [severity]="severity"
      [outlined]="outlined"
      [text]="text"
      [size]="pSize"
      [styleClass]="styleClass"
    />
  `,
})
export class ButtonComponent {
  @Input() label = '';
  @Input() icon = '';
  @Input() loading = false;
  @Input() disabled = false;
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() full = false;

  get severity(): ButtonSeverity {
    return { primary: 'primary', secondary: 'secondary', ghost: 'secondary', danger: 'danger' }[this.variant] as ButtonSeverity;
  }

  get outlined() { return this.variant === 'secondary'; }
  get text() { return this.variant === 'ghost'; }

  get pSize(): 'small' | 'large' | undefined {
    return { sm: 'small', md: undefined, lg: 'large' }[this.size] as 'small' | 'large' | undefined;
  }

  get styleClass() {
    const classes = ['min-h-11', 'rounded-pill', 'font-bold'];
    if (this.full) classes.push('w-full');
    return classes.join(' ');
  }
}
