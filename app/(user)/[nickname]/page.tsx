import { PublicProfile } from '@/components/profile/public-profile'
import { notFound } from 'next/navigation'

export default async function NicknameProfilePage({ params }: { params: Promise<{ nickname: string }> }) {
    const { nickname } = await params;
    const decodedNickname = decodeURIComponent(nickname);

    // Check if it starts with @ (or %40 in URL encoding, which is covered by decodeURIComponent)
    if (!decodedNickname.startsWith('@')) {
        notFound();
    }

    return <PublicProfile identifier={decodedNickname} />
}
