import { Component, Input } from '@angular/core'
import { Button as PrimeNGButton } from 'primeng/button';
import type { ButtonSeverity } from 'primeng/button';

/**
 * Define las variantes de estilo visual disponibles para el componente de botón.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/**
 * Define los tamaños de visualización disponibles para el botón.
 */
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
  /**
   * Propiedad para gestionar label.
   */
  @Input() label = '';
  /**
   * Propiedad para gestionar icon.
   */
  @Input() icon = '';
  /**
   * Propiedad para gestionar cargando.
   */
  @Input() loading = false;
  /**
   * Propiedad para gestionar disabled.
   */
  @Input() disabled = false;
  /**
   * Propiedad para gestionar variant.
   */
  @Input() variant: ButtonVariant = 'primary';
  /**
   * Propiedad para gestionar tamaño.
   */
  @Input() size: ButtonSize = 'md';
  /**
   * Propiedad para gestionar full.
   */
  @Input() full = false;

  /**
   * Método para severity.
   */
  get severity(): ButtonSeverity {
    return { primary: 'primary', secondary: 'secondary', ghost: 'secondary', danger: 'danger' }[this.variant] as ButtonSeverity;
  }

  /**
   * Método para outlined.
   */
  get outlined() { return this.variant === 'secondary'; }
  /**
   * Método para text.
   */
  get text() { return this.variant === 'ghost'; }

  /**
   * Método para p tamaño.
   */
  get pSize(): 'small' | 'large' | undefined {
    return { sm: 'small', md: undefined, lg: 'large' }[this.size] as 'small' | 'large' | undefined;
  }

  /**
   * Método para style class.
   */
  get styleClass() {
    const classes = ['min-h-11', 'rounded-pill', 'font-bold'];
    if (this.full) classes.push('w-full');
    return classes.join(' ');
  }
}
