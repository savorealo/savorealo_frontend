// src/app/core/models/user.mapper.ts

import { UserDto } from './user.dto'
import { User }    from './user.model'

export function mapUserDtoToUser(dto: UserDto): User {
  const isPerson   = dto.user_type === 'PERSON'
  const profile    = dto.person_profiles
  const bizProfile = dto.business_profiles

  return {
    id:             dto.id,
    userType:       dto.user_type,

    // Nombre unificado según tipo de usuario
    name:           isPerson
                      ? (profile?.full_name ?? profile?.username ?? '')
                      : (bizProfile?.business_name ?? ''),

    username:       profile?.username   ?? null,
    avatarUrl:      isPerson
                      ? (profile?.photo_url  ?? null)
                      : (bizProfile?.photo_url ?? null),
    bio:            isPerson
                      ? (profile?.bio      ?? null)
                      : (bizProfile?.bio   ?? null),
    location:       isPerson
                      ? (profile?.location ?? null)
                      : (bizProfile?.location ?? null),

    // Solo negocios
    website:        bizProfile?.website   ?? null,
    specialty:      bizProfile?.specialty ?? null,
    phone:          bizProfile?.phone     ?? null,

    // Solo personas
    birthDate:      profile?.birth_date
                      ? new Date(profile.birth_date)
                      : null,

    followersCount: dto.followers_count,
    followingCount: dto.following_count,
    postsCount:     dto.posts_count,
    createdAt:      new Date(dto.created_at),
    updatedAt:      new Date(dto.updated_at),
  }
}
