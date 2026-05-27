import { Component, effect, inject, input, model, signal } from '@angular/core'
import { Post } from '@core/models/post/post.model'
import { AiRecipeService, VeganRecipeResult } from '@core/services/ai-recipe.service'
import { DialogModule } from 'primeng/dialog'
import { SavoLoader } from '@shared/components/savo-loader/savo-loader'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

/**
 * Clase de utilidad para veganconvertmodal.
 */
@Component({
  selector: 'app-vegan-convert-modal',
  imports: [DialogModule, SavoLoader, TranslatePipe],
  templateUrl: './vegan-convert-modal.html',
})
export class VeganConvertModal {
  /**
   * Propiedad para gestionar ai.
   */
  private readonly ai = inject(AiRecipeService)

  /**
   * Propiedad para gestionar post.
   */
  post    = input.required<Post>()
  /**
   * Propiedad para gestionar visible.
   */
  visible = model(false)

  /**
   * Propiedad para gestionar cargando.
   */
  loading = signal(false)
  /**
   * Propiedad para gestionar error.
   */
  error   = signal<string | null>(null)
  /**
   * Propiedad para gestionar result.
   */
  result  = signal<VeganRecipeResult | null>(null)
  /**
   * Propiedad para gestionar copied.
   */
  copied  = signal(false)

  /**
   * Constructor de la clase o componente para inicializar dependencias.
   */
  constructor() {
    effect(() => {
      if (this.visible()) {
        this.generate()
      } else {
        this.result.set(null)
        this.error.set(null)
        this.copied.set(false)
      }
    })
  }

  /**
   * Método para generate.
   */
  private generate(): void {
    this.loading.set(true)
    this.error.set(null)
    this.result.set(null)

    this.ai.veganizeRecipe(this.post()).subscribe({
      next: r => {
        this.result.set(r)
        this.loading.set(false)
      },
      error: () => {
        this.error.set('No se pudo generar la versión vegana. Inténtalo de nuevo.')
        this.loading.set(false)
      },
    })
  }

  /**
   * Método para retry.
   */
  retry(): void {
    this.generate()
  }

  /**
   * Método para copy to clipboard.
   */
  copyToClipboard(): void {
    const r = this.result()
    if (!r) return

    const lines: string[] = [`🌱 ${r.title}`, ``, r.description]

    if (r.ingredients.length) {
      lines.push(``, `📋 Ingredientes:`)
      r.ingredients.forEach(i => {
        const qty = i.quantity ? `${i.quantity}${i.unit ? ' ' + i.unit : ''}` : ''
        const name = i.vegan
        lines.push(`• ${qty ? qty + ' de ' : ''}${name}${i.changed ? ' ✓' : ''}`)
      })
    }

    if (r.steps.length) {
      lines.push(``, `👨‍🍳 Pasos:`)
      r.steps.forEach(s => lines.push(`${s.step}. ${s.text}`))
    }

    if (r.tip) lines.push(``, `💡 Tip: ${r.tip}`)

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      this.copied.set(true)
      setTimeout(() => this.copied.set(false), 2500)
    })
  }

  /**
   * Método para cerrar.
   */
  close(): void {
    this.visible.set(false)
  }
}
