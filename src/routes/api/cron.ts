import { createFileRoute } from '@tanstack/react-router'
import { db } from '#/lib/db'
import { letters, users } from '#/lib/db/schema'
import { sendLetterEmail } from '#/lib/email'
import { lte, isNull, and, eq } from 'drizzle-orm'

export const Route = createFileRoute('/api/cron')({
    server: {
        handlers: {
            GET: async ({ request }: { request: Request }) => {
                const env = process.env as Record<string, string | undefined>
                const isDev = env.NODE_ENV === 'development'
                const authHeader = request.headers.get('authorization')
                const cronSecret = env.CRON_SECRET
                const expectedAuth = cronSecret ? `Bearer ${cronSecret}` : null

                const isAuthorized = isDev || (expectedAuth && authHeader === expectedAuth)

                if (!isAuthorized) {
                    return new Response(JSON.stringify({ error: 'Unauthorized. Provide Authorization: Bearer <CRON_SECRET>' }), {
                        status: 401,
                        headers: { 'Content-Type': 'application/json' },
                    })
                }

                try {
                    if (!env.DATABASE_URL) {
                        return new Response(
                            JSON.stringify({ error: 'DATABASE_URL environment variable is missing in Vercel' }),
                            { status: 500, headers: { 'Content-Type': 'application/json' } }
                        )
                    }

                    const now = new Date()

                    const pendingLetters = await db
                        .select({
                            letter: letters,
                            user: users,
                        })
                        .from(letters)
                        .innerJoin(users, eq(letters.userId, users.id))
                        .where(
                            and(
                                lte(letters.deliverAt, now),
                                isNull(letters.deliveredAt)
                            )
                        )

                    if (pendingLetters.length === 0) {
                        return new Response(
                            JSON.stringify({ message: 'No letters to deliver', processed: 0 }),
                            { status: 200, headers: { 'Content-Type': 'application/json' } }
                        )
                    }

                    const results = await Promise.allSettled(
                        pendingLetters.map(async ({ letter, user }) => {
                            await sendLetterEmail({
                                to: user.email,
                                toName: user.name || 'Friend',
                                letter,
                            })

                            await db
                                .update(letters)
                                .set({ deliveredAt: new Date() })
                                .where(eq(letters.id, letter.id))

                            return letter.id
                        })
                    )

                    const successful = results.filter((r) => r.status === 'fulfilled').length
                    const failed = results.filter((r) => r.status === 'rejected').length

                    return new Response(
                        JSON.stringify({
                            message: 'Cron job execution completed',
                            total: pendingLetters.length,
                            successful,
                            failed,
                        }),
                        { status: 200, headers: { 'Content-Type': 'application/json' } }
                    )
                } catch (error: any) {
                    console.error('Cron execution failed:', error)
                    return new Response(
                        JSON.stringify({ error: error.message || 'Internal Server Error' }),
                        { status: 500, headers: { 'Content-Type': 'application/json' } }
                    )
                }
            },
        },
    },
})