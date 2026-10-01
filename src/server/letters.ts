import { createServerFn } from '@tanstack/react-start'
import { auth } from '@clerk/tanstack-react-start/server'
import { supabase } from '../utils/supabase'
import { uploadLetterImage } from '../lib/cloudinary'

async function getAuthedUser() {
    const { userId } = await auth()
    if (!userId) return null

    const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_user_id', userId)
        .maybeSingle()

    return user
}

export const getLettersFn = createServerFn({ method: 'GET' }).handler(async () => {
    const user = await getAuthedUser()
    if (!user) return []

    const { data: letters, error } = await supabase
        .from('letters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error || !letters) return []

    return letters.map((l: any) => ({
        id: l.id,
        title: l.title,
        content: l.content,
        imageUrl: l.image_url,
        type: l.type,
        deliverAt: l.deliver_at,
        deliveredAt: l.delivered_at,
        createdAt: l.created_at,
    }))
})

export const getLetterByIdFn = createServerFn({ method: 'GET' })
    .validator((d: string) => d)
    .handler(async ({ data: id }) => {
        const user = await getAuthedUser()
        if (!user) throw new Error('Unauthorized')

        const { data: letter, error } = await supabase
            .from('letters')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (error || !letter) throw new Error('Letter not found')

        return {
            id: letter.id,
            title: letter.title,
            content: letter.content,
            imageUrl: letter.image_url,
            type: letter.type,
            deliverAt: letter.deliver_at,
            deliveredAt: letter.delivered_at,
            createdAt: letter.created_at,
        }
    })

export const createTypedLetterFn = createServerFn({ method: 'POST' })
    .validator((d: { title: string; content: string; deliverAt: string }) => d)
    .handler(async ({ data }) => {
        const user = await getAuthedUser()
        if (!user) throw new Error('Unauthorized')

        const { count } = await supabase
            .from('letters')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .is('delivered_at', null)

        if ((count || 0) >= 5) {
            throw new Error('You can only have 5 pending letters at a time')
        }

        const deliverDate = new Date(data.deliverAt)
        if (isNaN(deliverDate.getTime())) {
            throw new Error('Invalid delivery date')
        }
        if (deliverDate.getTime() < Date.now() - 60000) {
            throw new Error('Delivery date cannot be in the past')
        }

        const { data: created, error } = await supabase
            .from('letters')
            .insert({
                user_id: user.id,
                title: data.title,
                content: data.content,
                type: 'typed',
                deliver_at: deliverDate.toISOString(),
            })
            .select()
            .single()

        if (error || !created) throw new Error(error?.message || 'Failed to create letter')

        return {
            id: created.id,
            title: created.title,
            content: created.content,
            imageUrl: created.image_url,
            type: created.type,
            deliverAt: created.deliver_at,
            deliveredAt: created.delivered_at,
            createdAt: created.created_at,
        }
    })

export const createScannedLetterFn = createServerFn({ method: 'POST' })
    .validator((d: { title: string; base64Data: string; deliverAt: string }) => d)
    .handler(async ({ data }) => {
        const user = await getAuthedUser()
        if (!user) throw new Error('Unauthorized')

        const { count } = await supabase
            .from('letters')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .is('delivered_at', null)

        if ((count || 0) >= 5) {
            throw new Error('You can only have 5 pending letters at a time')
        }

        const deliverDate = new Date(data.deliverAt)
        if (isNaN(deliverDate.getTime())) {
            throw new Error('Invalid delivery date')
        }
        if (deliverDate.getTime() < Date.now() - 60000) {
            throw new Error('Delivery date cannot be in the past')
        }

        // Upload to Cloudinary
        const base64Parts = data.base64Data.split(';base64,')
        const rawBase64 = base64Parts.length > 1 ? base64Parts[1] : data.base64Data
        const buffer = Buffer.from(rawBase64, 'base64')

        const imageUrl = await uploadLetterImage(buffer, user.id)

        const { data: created, error } = await supabase
            .from('letters')
            .insert({
                user_id: user.id,
                title: data.title,
                image_url: imageUrl,
                type: 'scanned',
                deliver_at: deliverDate.toISOString(),
            })
            .select()
            .single()

        if (error || !created) throw new Error(error?.message || 'Failed to create scanned letter')

        return {
            id: created.id,
            title: created.title,
            content: created.content,
            imageUrl: created.image_url,
            type: created.type,
            deliverAt: created.deliver_at,
            deliveredAt: created.delivered_at,
            createdAt: created.created_at,
        }
    })

export const deleteLetterFn = createServerFn({ method: 'POST' })
    .validator((d: string) => d)
    .handler(async ({ data: id }) => {
        const user = await getAuthedUser()
        if (!user) throw new Error('Unauthorized')

        const { error } = await supabase
            .from('letters')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) throw new Error(error.message)
        return { success: true }
    })

export const rescheduleLetterFn = createServerFn({ method: 'POST' })
    .validator((d: { id: string; deliverAt: string }) => d)
    .handler(async ({ data }) => {
        const user = await getAuthedUser()
        if (!user) throw new Error('Unauthorized')

        const deliverDate = new Date(data.deliverAt)
        if (isNaN(deliverDate.getTime())) {
            throw new Error('Invalid delivery date')
        }
        if (deliverDate.getTime() < Date.now() - 60000) {
            throw new Error('Delivery date cannot be in the past')
        }

        const { data: updated, error } = await supabase
            .from('letters')
            .update({ deliver_at: deliverDate.toISOString() })
            .eq('id', data.id)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error || !updated) throw new Error(error?.message || 'Failed to reschedule letter')

        return {
            id: updated.id,
            title: updated.title,
            content: updated.content,
            imageUrl: updated.image_url,
            type: updated.type,
            deliverAt: updated.deliver_at,
            deliveredAt: updated.delivered_at,
            createdAt: updated.created_at,
        }
    })
