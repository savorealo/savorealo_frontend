// src/app/shared/pipes/mention.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'mention',
	standalone: true,
})
export class MentionPipe implements PipeTransform {
	transform(value: string): string {
		if (!value) return '';
		return value.replace(
			/@(\w+)/g,
			`<a href="/profile/$1" class="text-blue-500 hover:underline cursor-pointer">@$1</a>`
		);
	}
}

/* <!-- Solo menciones -->
<p [innerHTML]="post.content | mention"></p>

<!-- Combinado con hashtags — orden importante: mention primero, hashtag después -->
<p [innerHTML]="post.content | mention | hashtag"></p>

<!-- Bio del perfil -->
<p [innerHTML]="profile.bio | mention | hashtag"></p>

<!-- Comentario -->
<p [innerHTML]="comment.text | mention | hashtag"></p> */
