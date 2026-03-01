import { PublicProfile } from '@/components/profile/public-profile'
import { redirect } from 'next/navigation'

async function getProfile(id: string) {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_USER_BASE_URL || 'http://localhost:3001'}/v1/users/${id}`, {
            next: { revalidate: 60 } // Cache for 60 seconds
        })
        if (!res.ok) return null
        const data = await res.json()
        return data.data
    } catch {
        return null
    }
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const profile = await getProfile(id)

    if (profile?.nickname) {
        redirect(`/@${profile.nickname}`)
    }

    return <PublicProfile identifier={id} />
}
