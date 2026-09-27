import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useAuth as useClerkAuth, useUser } from '@clerk/react'
import { getCurrentUserFn } from '../server/user'

interface User {
    id: string
    name: string
    email: string
    slotsFree: number
    slotsUsed: number
}

interface AuthContextType {
    user: User | null
    loading: boolean
    refreshUser: () => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const { isLoaded, isSignedIn, signOut } = useClerkAuth()
    const { user: clerkUser } = useUser()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    // Sync and load user data
    useEffect(() => {
        if (!isLoaded) {
            setLoading(true)
            return
        }

        if (!isSignedIn || !clerkUser) {
            setUser(null)
            setLoading(false)
            return
        }

        const email = clerkUser.emailAddresses?.[0]?.emailAddress || ''
        const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Letter Writer'

        // Optimistically set initial user immediately to prevent blocking the UI
        setUser(prev => prev ?? {
            id: clerkUser.id,
            name,
            email,
            slotsFree: 5,
            slotsUsed: 0,
        })
        setLoading(false)

        // Asynchronously sync with DB and load real slot counts
        let isMounted = true
        getCurrentUserFn({ data: { name, email } })
            .then(dbUser => {
                if (isMounted && dbUser) {
                    setUser(dbUser)
                }
            })
            .catch(err => {
                console.error('Failed to sync user with database:', err)
            })

        return () => {
            isMounted = false
        }
    }, [isLoaded, isSignedIn, clerkUser])

    const refreshUser = async () => {
        if (!isSignedIn || !clerkUser) {
            setUser(null)
            return
        }

        const email = clerkUser.emailAddresses?.[0]?.emailAddress || ''
        const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Letter Writer'

        try {
            const dbUser = await getCurrentUserFn({ data: { name, email } })
            if (dbUser) {
                setUser(dbUser)
            }
        } catch (error) {
            console.error('Failed to refresh user:', error)
        }
    }

    const logout = async () => {
        setUser(null)
        if (signOut) {
            await signOut()
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, refreshUser, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
    return ctx
}