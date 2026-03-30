import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'hashtag',
	standalone: true,
})
export class HashtagPipe implements PipeTransform {

	transform(value: string): string {
		if (!value) return '';
		return value.replace(
			/#(\w+)/g,
			`<a href="/explore?tag=$1" class="text-orange-500 hover:underline cursor-pointer">#$1</a>`
		);
	}
}

/*
<!-- En el template — importante usar [innerHTML] -->
<p [innerHTML]="post.content | hashtag"></p>
Casos de uso:
html<!-- Post del feed -->
<p [innerHTML]="post.content | hashtag"></p>

<!-- Combinado con MentionPipe cuando lo hagáis -->
<p [innerHTML]="post.content | mention | hashtag"></p>

<!-- Bio del perfil -->
<p [innerHTML]="profile.bio | hashtag"></p> */
