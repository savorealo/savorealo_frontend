import { Component } from '@angular/core'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { AiIdeasPanel } from './components/ai-ideas-panel/ai-ideas-panel'
import { AiRecipeForm } from './components/ai-recipe-form/ai-recipe-form'
import { AiRecipeResult } from './components/ai-recipe-result/ai-recipe-result'
import { AiRecipesHero } from './components/ai-recipes-hero/ai-recipes-hero'
import { RecentAiRecipes } from './components/recent-ai-recipes/recent-ai-recipes'
import { AiRecipeStore } from '@core/store/ai-recipe.store'
import { inject } from '@angular/core'

@Component({
	selector: 'app-ai-recipes-page',
	imports: [
		AppShell,
		AiIdeasPanel,
		AiRecipeForm,
		AiRecipeResult,
		AiRecipesHero,
		RecentAiRecipes,
	],
	templateUrl: './ai-recipes-page.html',
})
export class AiRecipesPage {
	readonly store = inject(AiRecipeStore)
}
