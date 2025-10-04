'use client'
import { motion } from 'framer-motion'

interface Note {
    note_id: string
    note_title: string
    note_content: string
    created_on: string
    last_update: string
}

interface NoteCardProps {
    note: Note
    index: number
    onEdit: (note: Note) => void
    onDelete: (id: string) => void
}

export default function NoteCard({ note, index, onEdit, onDelete }: NoteCardProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const truncateContent = (content: string, maxLength: number) => {
        if (content.length <= maxLength) return content
        return content.substring(0, maxLength) + '...'
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4 }}
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group"
        >
            <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {note.note_title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {truncateContent(note.note_content, 120)}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>Updated {formatDate(note.last_update)}</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onEdit(note)}
                        className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 transition-colors"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => onDelete(note.note_id)}
                        className="flex-1 px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </motion.div>
    )
}
