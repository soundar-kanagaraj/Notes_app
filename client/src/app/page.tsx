'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function Home() {
    const router = useRouter()
    const { isAuthenticated, checkAuth } = useAuthStore()
    useEffect(() => {
        checkAuth()
    }, [checkAuth])

    useEffect(() => {
        if (isAuthenticated) {
            router.push('/notes')
        } else {
            router.push('/signin')
        }
    }, [isAuthenticated, router])

    return null
}