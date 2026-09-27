import { createServerFn } from '@tanstack/react-start'
import { auth, clerkClient } from '@clerk/tanstack-react-start/server'
import { supabase } from '../utils/supabase'

export const getCurrentUserFn = createServerFn({ method: 'POST' })
    .validator((d?: { name?: string; email?: string }) => d)
    .handler(async ({ data }) => {
        const { userId } = await auth()
        if (!userId) {
            return null
        }

        let email = data?.email || ''
        let name = data?.name || 'Letter Writer'

        if (!email) {
            try {
                const clerk = await clerkClient()
                const clerkUserData = await clerk.users.getUser(userId)
                email = clerkUserData.emailAddresses?.[0]?.emailAddress || ''
                name = `${clerkUserData.firstName || ''} ${clerkUserData.lastName || ''}`.trim() || 'Letter Writer'
            } catch (e) {
                console.error('Clerk getUser error:', e)
            }
        }

        // Query Supabase for user
        let dbUser = null
        try {
            const { data: existingUser } = await supabase
                .from('users')
                .select('*')
                .eq('clerk_user_id', userId)
                .maybeSingle()

            dbUser = existingUser

            if (!dbUser && email) {
                // Check by email
                const { data: existingByEmail } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', email)
                    .maybeSingle()

                if (existingByEmail) {
                    const { data: updated } = await supabase
                        .from('users')
                        .update({ clerk_user_id: userId, name: name || existingByEmail.name })
                        .eq('id', existingByEmail.id)
                        .select()
                        .single()
                    dbUser = updated
                } else {
                    const { data: created } = await supabase
                        .from('users')
                        .insert({ clerk_user_id: userId, name, email })
                        .select()
                        .single()
                    dbUser = created
                }
            }
        } catch (err) {
            console.error('Supabase user query error:', err)
        }

        // Count pending letters
        let pendingCount = 0
        if (dbUser?.id) {
            try {
                const { count } = await supabase
                    .from('letters')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', dbUser.id)
                    .is('delivered_at', null)
                pendingCount = count || 0
            } catch (err) {
                console.error('Supabase count error:', err)
            }
        }

        return {
            id: dbUser?.id || userId,
            name: dbUser?.name || name,
            email: dbUser?.email || email,
            slotsFree: Math.max(0, 5 - pendingCount),
            slotsUsed: pendingCount,
        }
    })
