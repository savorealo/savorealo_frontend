import { Component, inject } from '@angular/core'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { PostCard } from '../feed/post-card/post-card'
import { Post } from '@core/models/post/post.model'

@Component({
  selector: 'app-home',
  imports: [AppShell, PostCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {

  posts: Post[] = [
    // ── 1. PHOTO — múltiples imágenes ─────────────────────────
    {
      id: '1',
      authorId: 'u1',
      author: {
        id: 'u1',
        name: 'María García',
        username: 'mariagarcooks',
        photoUrl: 'https://i.pravatar.cc/150?img=47',
      },
      postType: 'PHOTO',
      title: 'Tarde de setas y pines en el monte 🍄',
      description:
        'Salimos muy temprano y volvimos con el cesto lleno. Nada como cocinar lo que uno mismo recoge. La seta de cardo estaba increíble simplemente con ajo y perejil.',
      categories: ['HEALTHY', 'TRENDING'],
      media: [
        { id: 'm1', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80', type: 'image', position: 0 },
        { id: 'm2', url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', type: 'image', position: 1 },
        { id: 'm3', url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80', type: 'image', position: 2 },
      ],
      recipe: null,
      likesCount: 284, commentsCount: 37, viewsCount: 1820, savesCount: 61,
      liked: false, saved: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 23),
      updatedAt: new Date(Date.now() - 1000 * 60 * 23),
    },

    // ── 2. RECIPE ─────────────────────────────────────────────
    {
      id: '2',
      authorId: 'u2',
      author: {
        id: 'u2',
        name: 'Carlos Benítez',
        username: 'carlosbenitez_chef',
        photoUrl: 'https://i.pravatar.cc/150?img=12',
      },
      postType: 'RECIPE',
      title: 'Risotto de gambas al azafrán',
      description:
        'Mi versión del risotto clásico. El truco está en el caldo caliente y remover sin parar los últimos 5 minutos. El azafrán lo cambia todo.',
      categories: ['ITALIAN', 'SEAFOOD', 'LUNCH'],
      media: [
        { id: 'm4', url: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800&q=80', type: 'image', position: 0 },
      ],
      recipe: {
        id: 'r1',
        name: 'Risotto de gambas al azafrán',
        description: 'Cremoso, intenso y con el toque marino de las gambas frescas.',
        timeRequired: 40,
        estimatedCost: 18,
        servings: 2,
        difficulty: 'MEDIUM',
        ingredients: [
          { ingredientId: 'i1', name: 'Arroz arborio',      unit: 'g',   quantity: 200,  notes: null },
          { ingredientId: 'i2', name: 'Gambas',             unit: 'g',   quantity: 300,  notes: 'peladas y limpias' },
          { ingredientId: 'i3', name: 'Caldo de pescado',   unit: 'ml',  quantity: 800,  notes: 'bien caliente' },
          { ingredientId: 'i4', name: 'Cebolla',            unit: 'ud',  quantity: 1,    notes: 'picada fina' },
          { ingredientId: 'i5', name: 'Vino blanco seco',   unit: 'ml',  quantity: 100,  notes: null },
          { ingredientId: 'i6', name: 'Azafrán',            unit: 'g',   quantity: 0.2,  notes: 'una pizca generosa' },
          { ingredientId: 'i7', name: 'Parmesano',          unit: 'g',   quantity: 50,   notes: 'rallado al momento' },
          { ingredientId: 'i8', name: 'Mantequilla',        unit: 'g',   quantity: 30,   notes: 'fría, para el mantecado' },
        ],
        steps: [
          { step: 1, text: 'Sofríe la cebolla en aceite a fuego medio durante 8 minutos hasta que esté transparente.' },
          { step: 2, text: 'Añade el arroz y tuesta 2 minutos. Incorpora el vino y deja evaporar.' },
          { step: 3, text: 'Disuelve el azafrán en el caldo caliente. Ve añadiendo cazo a cazo, removiendo constantemente.' },
          { step: 4, text: 'A los 15 minutos añade las gambas. Cocina 3-4 minutos más hasta que estén rosadas.' },
          { step: 5, text: 'Apaga el fuego, añade mantequilla y parmesano. Tapa y reposa 2 minutos antes de servir.' },
        ],
      },
      likesCount: 512, commentsCount: 89, viewsCount: 4300, savesCount: 203,
      liked: true, saved: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    },

    // ── 3. TEXT ───────────────────────────────────────────────
    {
      id: '3',
      authorId: 'u3',
      author: {
        id: 'u3',
        name: 'La Taberna del Puerto',
        username: null,
        photoUrl: 'https://i.pravatar.cc/150?img=33',
      },
      postType: 'TEXT',
      title: null,
      description:
        '¿Por qué la pasta italiana sabe diferente a la de aquí? El secreto no es solo la harina (que también). Es el agua. En Nápoles el agua del grifo es ligeramente alcalina y eso cambia la textura del gluten. Pequeñas cosas que hacen grandes diferencias en la cocina.',
      categories: ['ITALIAN', 'TRENDING'],
      media: [],
      recipe: null,
      likesCount: 147, commentsCount: 52, viewsCount: 980, savesCount: 34,
      liked: false, saved: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 7),
    },

    // ── 4. PHOTO — imagen única ───────────────────────────────
    {
      id: '4',
      authorId: 'u4',
      author: {
        id: 'u4',
        name: 'Ana Villanueva',
        username: 'anabakes',
        photoUrl: 'https://i.pravatar.cc/150?img=5',
      },
      postType: 'PHOTO',
      title: 'Tarta de queso japonesa ☁️',
      description:
        'Después de tres intentos por fin conseguí la textura perfecta. El horno de vapor lo es todo. Se desmolda perfecta y tiembla como gelatina.',
      categories: ['DESSERTS', 'JAPANESE'],
      media: [
        { id: 'm5', url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&q=80', type: 'image', position: 0 },
      ],
      recipe: null,
      likesCount: 923, commentsCount: 114, viewsCount: 7200, savesCount: 401,
      liked: false, saved: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
  ]
}
