import { useDispatch, useSelector } from 'react-redux'
import { useCallback } from 'react'
import { RootState, AppDispatch } from '@/redux/store'
import { fetchNotes as fetchNotesAction, createNote as createNoteAction, updateNote as updateNoteAction, deleteNote as deleteNoteAction, setCurrentNote as setCurrentNoteAction, clearError as clearErrorAction } from '@/redux/slices/notesSlice'

export const useNotesStore = () => {
    const state: any = useSelector((s: RootState) => s.notes) as RootState['notes']
    const dispatch = useDispatch<AppDispatch>()

    return {
        notes: state.notes,
        currentNote: state.currentNote,
        isLoading: state.isLoading,
        error: state.error,
        fetchNotes: useCallback(() => dispatch(fetchNotesAction()), [dispatch]) as any,
        createNote: useCallback((title: string, content: string) => dispatch(createNoteAction({ title, content })), [dispatch]) as any,
        updateNote: useCallback((id: string, title: string, content: string) => dispatch(updateNoteAction({ id, title, content })), [dispatch]) as any,
        deleteNote: useCallback((id: string) => dispatch(deleteNoteAction(id)), [dispatch]) as any,
        setCurrentNote: useCallback((note: any) => dispatch(setCurrentNoteAction(note)), [dispatch]),
        clearError: useCallback(() => dispatch(clearErrorAction()), [dispatch]),
    }
}