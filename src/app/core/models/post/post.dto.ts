import { PostCategory, PostType } from './post.model';

export interface CreatePostDto {
  postType: PostType;
  title?: string;
  description?: string;
  categories?: PostCategory[];
}

export interface UpdatePostDto {
  title?: string;
  description?: string;
  categories?: PostCategory[];
}
