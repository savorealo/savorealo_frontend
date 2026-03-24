export interface LoginUser{
    email: string
    password: string
}

export interface RegisterUser{
    email: string
    password: string
    username: string
    fullName?: string
    bio?: string
    birthDate?: string
    photoProfile?: File
    photoUrl?: string
}