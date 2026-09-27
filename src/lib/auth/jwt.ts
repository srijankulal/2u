import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env['JWT_SECRET']!)
const EXPIRY = '7d'

export interface JWTPayload {
    sub: string // user id
    email: string
    name: string
}

export async function signToken(payload: JWTPayload): Promise<string> {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(EXPIRY)
        .sign(secret)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, secret)
        return payload as unknown as JWTPayload
    } catch {
        return null
    }
}

export const COOKIE_NAME = '2u_token'
