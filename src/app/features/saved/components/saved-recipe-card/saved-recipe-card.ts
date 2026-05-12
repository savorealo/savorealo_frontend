import { Component, input, output } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Post } from '@core/models/post/post.model'

@Component({
	selector: 'app-saved-recipe-card',
	imports: [RouterLink],
	templateUrl: './saved-recipe-card.html',
})
export class SavedRecipeCard {
	post = input.required<Post>()
	remove = output<string>()
}
