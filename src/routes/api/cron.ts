import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '../../utils/supabase'
import { sendLetterEmail } from '../../lib/email'
import { decryptText } from '../../lib/crypto'

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
                    const now = new Date()

                    const { data: pendingLetters, error: fetchError } = await supabase
                        .from('letters')
                        .select('*')
                        .lte('deliver_at', now.toISOString())
                        .is('delivered_at', null)

                    if (fetchError) {
                        throw new Error(`Database error: ${fetchError.message}`)
                    }

                    if (!pendingLetters || pendingLetters.length === 0) {
                        return new Response(
                            JSON.stringify({ message: 'No letters to deliver at this time', processed: 0, checkedAt: now.toISOString() }),
                            { status: 200, headers: { 'Content-Type': 'application/json' } }
                        )
                    }

                    const results = await Promise.allSettled(
                        pendingLetters.map(async (l: any) => {
                            const { data: user, error: userError } = await supabase
                                .from('users')
                                .select('*')
                                .eq('id', l.user_id)
                                .single()

                            if (userError || !user || !user.email) {
                                throw new Error(`Recipient user not found for letter ${l.id}`)
                            }

                            const decryptedTitle = decryptText(l.title) || 'Untitled Letter'
                            const decryptedContent = decryptText(l.content) ?? null
                            const decryptedImageUrl = decryptText(l.image_url) ?? null

                            await sendLetterEmail({
                                to: user.email,
                                toName: user.name || 'Friend',
                                letter: {
                                    id: l.id,
                                    userId: l.user_id,
                                    title: decryptedTitle,
                                    content: decryptedContent,
                                    imageUrl: decryptedImageUrl,
                                    type: l.type,
                                    deliverAt: l.deliver_at,
                                    deliveredAt: l.delivered_at,
                                    createdAt: l.created_at,
                                },
                            })

                            const { error: updateError } = await supabase
                                .from('letters')
                                .update({ delivered_at: new Date().toISOString() })
                                .eq('id', l.id)

                            if (updateError) {
                                throw new Error(`Failed to mark delivered: ${updateError.message}`)
                            }

                            return l.id
                        })
                    )

                    const successful = results.filter((r) => r.status === 'fulfilled').length
                    const failed = results.filter((r) => r.status === 'rejected').length

                    return new Response(
                        JSON.stringify({
                            message: 'Cron job execution completed successfully',
                            total: pendingLetters.length,
                            successful,
                            failed,
                            timestamp: now.toISOString(),
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
