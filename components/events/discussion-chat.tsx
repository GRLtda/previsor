'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { userApi } from '@/lib/api/client'
import { useAuth } from '@/contexts/auth-context'
import { useAuthModal } from '@/contexts/auth-modal-context'
import { useCommentRealTime } from '@/hooks/use-market-ws'
import type { Comment } from '@/lib/types'
import { Loader2, Heart, MessageSquare, ChevronDown, Send, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface DiscussionChatProps {
    eventId: string
}

type SortBy = 'recent' | 'popular' | 'oldest'

const SORT_LABELS: Record<SortBy, string> = {
    recent: 'Mais recentes',
    popular: 'Mais curtidos',
    oldest: 'Mais antigos',
}

function timeAgo(dateStr: string): string {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) return 'agora'
    if (diffMin < 60) return `há ${diffMin} min`
    if (diffHour < 24) return `há ${diffHour}h`
    if (diffDay < 30) return `há ${diffDay}d`
    return `há ${Math.floor(diffDay / 30)} meses`
}

/** Render comment content with @mentions highlighted */
function CommentContent({ content }: { content: string }) {
    // Split content by @mention pattern
    const parts = content.split(/(@\S+)/g)
    return (
        <p className="mt-1 text-[13px] text-foreground dark:text-[#d1d5db] whitespace-pre-wrap break-words leading-relaxed">
            {parts.map((part, i) =>
                part.startsWith('@') ? (
                    <span key={i} className="text-blue-500 font-semibold">{part}</span>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </p>
    )
}

/* ─── Single Comment Row ─── */
function CommentItem({
    comment,
    eventId,
    canComment,
    currentUserId,
    onReplyPosted,
    onRequireLogin,
    onDeleted,
}: {
    comment: Comment
    eventId: string
    canComment: boolean
    currentUserId: string | null
    onReplyPosted: () => void
    onRequireLogin: () => void
    onDeleted: (commentId: string, parentId: string | null) => void
}) {
    const [likes, setLikes] = useState(comment.likesCount)
    const [liked, setLiked] = useState(comment.userVote === 'like')
    const [showReplyInput, setShowReplyInput] = useState(false)
    const [replyText, setReplyText] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [showReplies, setShowReplies] = useState(false)
    const [replies, setReplies] = useState<Comment[]>(comment.replies || [])
    const [repliesTotal, setRepliesTotal] = useState(comment.repliesCount)
    const [loadingReplies, setLoadingReplies] = useState(false)
    const [voting, setVoting] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [deleted, setDeleted] = useState(false)

    // Sync state if parent receives real-time WebSocket updates for this comment's replies
    useEffect(() => {
        setRepliesTotal(comment.repliesCount)
        if (comment.replies && comment.replies.length > 0) {
            setReplies(prev => {
                const newReplies = [...prev]
                comment.replies!.forEach(newReply => {
                    if (!newReplies.some(r => r.id === newReply.id)) {
                        newReplies.push(newReply)
                    }
                })
                return newReplies
            })
        }
    }, [comment.replies, comment.repliesCount])

    const isOwner = currentUserId === comment.userId

    const handleLike = async () => {
        if (!canComment) { onRequireLogin(); return }
        if (voting) return
        setVoting(true)
        try {
            const res = await userApi.voteComment(comment.id, 'like')
            setLikes(res.data.likesCount)
            setLiked(res.data.userVote === 'like')
        } catch { /* ignore */ }
        finally { setVoting(false) }
    }

    const handleReplyToggle = () => {
        if (!canComment) { onRequireLogin(); return }
        if (!showReplyInput) {
            // Auto-prefix with @username
            setReplyText(`@${comment.user.firstName} `)
        }
        setShowReplyInput(!showReplyInput)
    }

    const handleReplySubmit = async () => {
        if (!replyText.trim() || submitting) return
        setSubmitting(true)
        try {
            await userApi.createComment(eventId, replyText.trim(), comment.id)
            setReplyText('')
            setShowReplyInput(false)
            setRepliesTotal(prev => prev + 1)
            await loadReplies()
            onReplyPosted()
        } catch { /* ignore */ }
        finally { setSubmitting(false) }
    }

    const handleDelete = async () => {
        if (deleting) return
        setDeleting(true)
        try {
            await userApi.deleteComment(comment.id)
            setDeleted(true)
            onDeleted(comment.id, comment.parentId ?? null)
        } catch { /* ignore */ }
        finally { setDeleting(false) }
    }

    const loadReplies = async () => {
        setLoadingReplies(true)
        try {
            const res = await userApi.getReplies(comment.id, { limit: 50 })
            setReplies(res.data.replies)
            setRepliesTotal(res.data.total)
            setShowReplies(true)
        } catch { /* ignore */ }
        finally { setLoadingReplies(false) }
    }

    if (deleted) return null

    return (
        <div className="border-b border-black/5 dark:border-white/5 py-4">
            <div className="flex gap-3">
                {/* Avatar */}
                <Link href={`/profile/${comment.userId}`} className="flex size-[36px] min-w-[36px] items-center justify-center rounded-full bg-black/10 dark:bg-white/10 overflow-hidden hover:ring-2 hover:ring-blue-500/50 transition-all">
                    {comment.user.avatarUrl ? (
                        <img src={comment.user.avatarUrl} alt={comment.user.firstName} className="size-full object-cover" />
                    ) : (
                        <span className="text-xs font-bold">{comment.user.firstName.charAt(0).toUpperCase()}</span>
                    )}
                </Link>

                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Link href={`/profile/${comment.userId}`} className="text-[13px] font-semibold dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors">{comment.user.firstName}</Link>
                            <span className="text-[11px] text-[#606E85] dark:text-[#A1A7BB]">{timeAgo(comment.createdAt)}</span>
                        </div>
                        {isOwner && (
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer p-1"
                                title="Excluir comentário"
                            >
                                {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                            </button>
                        )}
                    </div>

                    {/* Content with @mention highlight */}
                    <CommentContent content={comment.content} />

                    {/* Actions */}
                    <div className="mt-2 flex items-center gap-4">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-1.5 text-[12px] cursor-pointer transition-colors ${liked
                                ? 'text-rose-500'
                                : 'text-muted-foreground hover:text-rose-500'
                                }`}
                        >
                            <Heart className={`size-3.5 ${liked ? 'fill-current' : ''}`} />
                            <span className="font-medium">{likes > 0 ? likes : ''}</span>
                        </button>

                        <button
                            onClick={handleReplyToggle}
                            className="flex items-center gap-1.5 text-[12px] cursor-pointer text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors font-medium"
                            title="Responder"
                        >
                            <MessageSquare className="size-3.5" />
                        </button>
                    </div>

                    {/* Reply Input */}
                    {showReplyInput && (
                        <div className="mt-3 flex gap-2">
                            <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReplySubmit() } }}
                                placeholder="Escreva uma resposta..."
                                className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-blue-500/50 transition-colors placeholder:text-[#606E85] dark:placeholder:text-[#A1A7BB]"
                                disabled={submitting}
                                autoFocus
                            />
                            <button
                                onClick={handleReplySubmit}
                                disabled={!replyText.trim() || submitting}
                                className="flex items-center justify-center size-9 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors cursor-pointer"
                            >
                                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                            </button>
                        </div>
                    )}

                    {/* Replies */}
                    {repliesTotal > 0 && !showReplies && (
                        <button
                            onClick={loadReplies}
                            disabled={loadingReplies}
                            className="mt-2 flex items-center gap-1 text-[12px] text-blue-500 hover:text-blue-400 font-medium transition-colors cursor-pointer"
                        >
                            {loadingReplies ? (
                                <Loader2 className="size-3 animate-spin" />
                            ) : (
                                <>
                                    <ChevronDown className="size-3" />
                                    <span>Ver {repliesTotal} {repliesTotal === 1 ? 'resposta' : 'respostas'}</span>
                                </>
                            )}
                        </button>
                    )}

                    {showReplies && replies.length > 0 && (
                        <div className="mt-3 pl-2 border-l-2 border-black/5 dark:border-white/5">
                            {replies.map((reply) => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    eventId={eventId}
                                    canComment={canComment}
                                    currentUserId={currentUserId}
                                    onReplyPosted={loadReplies}
                                    onRequireLogin={onRequireLogin}
                                    onDeleted={(deletedId) => {
                                        setReplies(prev => prev.filter(r => r.id !== deletedId))
                                        setRepliesTotal(prev => Math.max(0, prev - 1))
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {showReplies && replies.length > 0 && (
                        <button
                            onClick={() => setShowReplies(false)}
                            className="mt-1 text-[12px] text-[#606E85] dark:text-[#A1A7BB] hover:text-foreground dark:hover:text-white transition-colors cursor-pointer"
                        >
                            Ocultar respostas
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

/* ─── Main Discussion Chat ─── */
export function DiscussionChat({ eventId }: DiscussionChatProps) {
    const { isAuthenticated, isOtpVerified, user } = useAuth()
    const { openAuthModal } = useAuthModal()
    const canComment = isAuthenticated && isOtpVerified
    const currentUserId = user?.id ?? null

    const [comments, setComments] = useState<Comment[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [offset, setOffset] = useState(0)
    const [sortBy, setSortBy] = useState<SortBy>('recent')
    const [showSortMenu, setShowSortMenu] = useState(false)
    const [commentText, setCommentText] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const sortMenuRef = useRef<HTMLDivElement>(null)
    const LIMIT = 20

    const requireLogin = useCallback(() => {
        openAuthModal('LOGIN')
    }, [openAuthModal])

    const loadComments = useCallback(async (currentOffset: number, sort: SortBy, append = false) => {
        try {
            const res = await userApi.getComments(eventId, { limit: LIMIT, offset: currentOffset, sortBy: sort })
            if (res.success && res.data) {
                if (append) {
                    setComments(prev => [...prev, ...res.data.comments])
                } else {
                    setComments(res.data.comments)
                }
                setTotal(res.data.total)
            }
        } catch { /* ignore */ }
    }, [eventId])

    useEffect(() => {
        setLoading(true)
        setOffset(0)
        loadComments(0, sortBy).finally(() => setLoading(false))
    }, [loadComments, sortBy])

    // Real-time comment updates via WebSocket
    useCommentRealTime((newComment) => {
        if (newComment.eventId !== eventId) return

        if (!newComment.parentId) {
            setComments(prev => {
                if (prev.some(c => c.id === newComment.id)) return prev
                if (sortBy === 'recent') {
                    return [{ ...newComment, replies: [] }, ...prev]
                }
                return [...prev, { ...newComment, replies: [] }]
            })
            setTotal(prev => prev + 1)
        } else {
            setComments(prev => prev.map(c => {
                if (c.id === newComment.parentId) {
                    const updatedReplies = c.replies ? [...c.replies] : []
                    if (!updatedReplies.some(r => r.id === newComment.id)) {
                        updatedReplies.push(newComment)
                    }
                    return { ...c, repliesCount: c.repliesCount + 1, replies: updatedReplies }
                }
                return c
            }))
        }
    })

    // Close sort menu on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
                setShowSortMenu(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleLoadMore = async () => {
        const newOffset = offset + LIMIT
        setOffset(newOffset)
        setLoadingMore(true)
        await loadComments(newOffset, sortBy, true)
        setLoadingMore(false)
    }

    const handleSubmitComment = async () => {
        if (!commentText.trim()) return
        if (!canComment) { requireLogin(); return }
        if (submitting) return
        setSubmitting(true)
        try {
            await userApi.createComment(eventId, commentText.trim())
            setCommentText('')
            setOffset(0)
            await loadComments(0, sortBy)
        } catch { /* ignore */ }
        finally { setSubmitting(false) }
    }

    const handleCommentDeleted = (commentId: string) => {
        setComments(prev => prev.filter(c => c.id !== commentId))
        setTotal(prev => Math.max(0, prev - 1))
    }

    const handleSortChange = (sort: SortBy) => {
        setSortBy(sort)
        setShowSortMenu(false)
    }

    return (
        <div className="w-full">
            {/* Comment Input — always shown */}
            <div className="mb-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitComment() } }}
                        placeholder="Escreva um comentário..."
                        className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 text-[13px] outline-none focus:border-blue-500/50 transition-colors placeholder:text-[#606E85] dark:placeholder:text-[#A1A7BB]"
                        disabled={submitting}
                    />
                    <button
                        onClick={handleSubmitComment}
                        disabled={submitting}
                        className="flex items-center justify-center px-4 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors font-medium text-[13px] gap-1.5 cursor-pointer"
                    >
                        {submitting ? <Loader2 className="size-4 animate-spin" /> : <><Send className="size-4" /><span className="hidden sm:inline">Enviar</span></>}
                    </button>
                </div>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] text-[#606E85] dark:text-[#A1A7BB] font-medium">
                    {total} {total === 1 ? 'comentário' : 'comentários'}
                </span>
                <div className="relative" ref={sortMenuRef}>
                    <button
                        onClick={() => setShowSortMenu(!showSortMenu)}
                        className="flex items-center gap-1 text-[12px] text-[#606E85] dark:text-[#A1A7BB] hover:text-foreground dark:hover:text-white transition-colors font-medium cursor-pointer"
                    >
                        {SORT_LABELS[sortBy]}
                        <ChevronDown className={`size-3.5 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
                    </button>
                    {showSortMenu && (
                        <div className="absolute right-0 top-full mt-1 bg-background border border-black/10 dark:border-white/10 rounded-lg shadow-lg py-1 z-20 min-w-[140px]">
                            {(Object.entries(SORT_LABELS) as [SortBy, string][]).map(([key, label]) => (
                                <button
                                    key={key}
                                    onClick={() => handleSortChange(key)}
                                    className={`w-full text-left px-3 py-2 text-[13px] cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${sortBy === key ? 'font-semibold text-blue-500' : 'text-foreground dark:text-[#d1d5db]'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
            )}

            {/* Empty state */}
            {!loading && comments.length === 0 && (
                <div className="min-h-[200px] flex items-center justify-center text-muted-foreground">
                    <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
                </div>
            )}

            {/* Comments list */}
            {!loading && comments.length > 0 && (
                <div>
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            eventId={eventId}
                            canComment={canComment}
                            currentUserId={currentUserId}
                            onReplyPosted={() => loadComments(0, sortBy)}
                            onRequireLogin={requireLogin}
                            onDeleted={handleCommentDeleted}
                        />
                    ))}

                    {/* Load more */}
                    {comments.length < total && (
                        <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="mt-4 w-full flex items-center justify-center py-3 text-sm font-medium text-[#606E85] dark:text-[#A1A7BB] hover:text-foreground transition-colors cursor-pointer"
                        >
                            {loadingMore ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                'Carregar mais'
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
