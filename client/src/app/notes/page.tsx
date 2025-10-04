'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useNotesStore } from '@/store/notesStore'
import NoteCard from '@/components/NoteCard'
import NoteModal from '@/components/NoteModel'
import { motion } from 'framer-motion'

export default function NotesPage() {
    const router = useRouter()
    const { isAuthenticated, user, signout } = useAuthStore()
    const { notes, fetchNotes, deleteNote, setCurrentNote } = useNotesStore()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingNote, setEditingNote] = useState<any>(null)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/signin')
            return
        }
        fetchNotes()
    }, [isAuthenticated, router, fetchNotes])

    const handleSignOut = () => {
        signout()
        router.push('/signin')
    }

    const handleCreateNote = () => {
        setEditingNote(null)
        setIsModalOpen(true)
    }

    const handleEditNote = (note: any) => {
        setEditingNote(note)
        setIsModalOpen(true)
    }

    const handleDeleteNote = async (id: string) => {
        if (confirm('Are you sure you want to delete this note?')) {
            await deleteNote(id)
        }
    }

    const filteredNotes = notes.filter(
        (note: any) =>
            note.note_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.note_content.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-900">📝 NotesApp</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600 hidden sm:inline">
                                Welcome, <span className="font-medium">{user?.user_name}</span>
                            </span>
                            <button
                                onClick={handleSignOut}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Action Bar */}
                <div className="mb-8 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                    <div className="flex-1 max-w-md">
                        <input
                            type="text"
                            placeholder="Search notes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        />
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCreateNote}
                        className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all shadow-lg shadow-blue-500/30"
                    >
                        + Create Note
                    </motion.button>
                </div>

                {/* Notes Grid */}
                {filteredNotes.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16"
                    >
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                            <span className="text-4xl">📝</span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {searchQuery ? 'No notes found' : 'No notes yet'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {searchQuery
                                ? 'Try adjusting your search query'
                                : 'Create your first note to get started'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={handleCreateNote}
                                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Create Note
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {filteredNotes.map((note: any, index: number) => (
                            <NoteCard
                                key={note.note_id}
                                note={note}
                                index={index}
                                onEdit={handleEditNote}
                                onDelete={handleDeleteNote}
                            />
                        ))}
                    </motion.div>
                )}
            </main>

            {/* Note Modal */}
            <NoteModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                note={editingNote}
                onSuccess={() => {
                    setIsModalOpen(false)
                    fetchNotes()
                }}
            />
        </div>
    )
}