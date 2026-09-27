import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env['DATABASE_URL'] || ''

const isCloudDatabase = connectionString.includes('supabase.com') ||
    connectionString.includes('neon.tech') ||
    connectionString.includes('render.com') ||
    connectionString.includes('railway.app') ||
    connectionString.includes('aws.')

// Disable prefetch for transaction poolers (like Supabase port 6543)
export const client = postgres(connectionString, {
    prepare: false,
    ssl: isCloudDatabase ? 'require' : undefined,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
})

export const db = drizzle(client, { schema })
