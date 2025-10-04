import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Note {
    note_id: string
    note_title: string
    note_content: string
    created_on: string
    last_update: string
}

interface NotesState {
    notes: Note[]
    currentNote: Note | null
    isLoading: boolean
    error: string | null
}

const initialState: NotesState = {
    notes: [],
    currentNote: null,
    isLoading: false,
    error: null,
}

export const fetchNotes = createAsyncThunk('notes/fetchNotes', async (_, { rejectWithValue }) => {
    try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        const response = await axios.get(`${API_URL}/api/notes`, { headers: { Authorization: `Bearer ${token}` } })
        return response.data.notes
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch notes')
    }
})

export const createNote = createAsyncThunk('notes/createNote', async ({ title, content }: { title: string; content: string }, { rejectWithValue }) => {
    try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        await axios.post(`${API_URL}/api/notes`, { note_title: title, note_content: content }, { headers: { Authorization: `Bearer ${token}` } })
        return
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to create note')
    }
})

export const updateNote = createAsyncThunk('notes/updateNote', async ({ id, title, content }: { id: string; title: string; content: string }, { rejectWithValue }) => {
    try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        await axios.put(`${API_URL}/api/notes/${id}`, { note_title: title, note_content: content }, { headers: { Authorization: `Bearer ${token}` } })
        return
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to update note')
    }
})

export const deleteNote = createAsyncThunk('notes/deleteNote', async (id: string, { rejectWithValue }) => {
    try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        await axios.delete(`${API_URL}/api/notes/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        return id
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to delete note')
    }
})

const slice = createSlice({
    name: 'notes',
    initialState,
    reducers: {
        setCurrentNote: (state, action) => {
            state.currentNote = action.payload
        },
        clearError: (state) => {
            state.error = null
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotes.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(fetchNotes.fulfilled, (state, action) => {
                state.notes = action.payload
                state.isLoading = false
            })
            .addCase(fetchNotes.rejected, (state, action) => {
                state.error = action.payload as string
                state.isLoading = false
            })
            .addCase(createNote.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(createNote.fulfilled, (state) => {
                state.isLoading = false
            })
            .addCase(createNote.rejected, (state, action) => {
                state.error = action.payload as string
                state.isLoading = false
            })
            .addCase(updateNote.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(updateNote.fulfilled, (state) => {
                state.isLoading = false
            })
            .addCase(updateNote.rejected, (state, action) => {
                state.error = action.payload as string
                state.isLoading = false
            })
            .addCase(deleteNote.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(deleteNote.fulfilled, (state, action) => {
                state.notes = state.notes.filter((n) => n.note_id !== action.payload)
                state.isLoading = false
            })
            .addCase(deleteNote.rejected, (state, action) => {
                state.error = action.payload as string
                state.isLoading = false
            })
    },
})

export const { setCurrentNote, clearError } = slice.actions

export default slice.reducer
