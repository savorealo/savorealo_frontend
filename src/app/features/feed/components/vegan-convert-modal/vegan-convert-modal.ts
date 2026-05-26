import { Component, effect, inject, input, model, signal } from '@angular/core'
import { Post } from '@core/models/post/post.model'
import { AiRecipeService, VeganRecipeResult } from '@core/services/ai-recipe.service'
import { DialogModule } from 'primeng/dialog'
import { SavoLoader } from '@shared/components/savo-loader/savo-loader'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

@Component({
  selector: 'app-vegan-convert-modal',
  imports: [DialogModule, SavoLoader, TranslatePipe],
  templateUrl: './vegan-convert-modal.html',
})
export class VeganConvertModal {
  private readonly ai = inject(AiRecipeService)

  post    = input.required<Post>()
  visible = model(false)

  loading = signal(false)
  error   = signal<string | null>(null)
  result  = signal<VeganRecipeResult | null>(null)
  copied  = signal(false)

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

  retry(): void {
    this.generate()
  }

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

  close(): void {
    this.visible.set(false)
  }
}
