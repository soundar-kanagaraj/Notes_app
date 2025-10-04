import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface User {
    user_id: string
    user_name: string
    user_email: string
}

interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
}

const initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
}

export const signin = createAsyncThunk(
    'auth/signin',
    async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/api/auth/signin`, {
                user_email: email,
                password,
            })
            return response.data
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Sign in failed')
        }
    }
)

export const signup = createAsyncThunk(
    'auth/signup',
    async ({ name, email, password }: { name: string; email: string; password: string }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/api/auth/signup`, {
                user_name: name,
                user_email: email,
                password,
            })
            return response.data
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Sign up failed')
        }
    }
)

const slice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        signout: (state) => {
            state.user = null
            state.token = null
            state.isAuthenticated = false
            state.isLoading = false
            state.error = null
            if (typeof window !== 'undefined') localStorage.removeItem('token')
        },
        checkAuth: (state) => {
            if (typeof window === 'undefined') return
            const token = localStorage.getItem('token')
            if (token) {
                state.token = token
                state.isAuthenticated = true
            }
        },
        clearError: (state) => {
            state.error = null
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(signin.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(signin.fulfilled, (state, action: PayloadAction<any>) => {
                const { token, user } = action.payload
                state.token = token
                state.user = user
                state.isAuthenticated = true
                state.isLoading = false
                if (typeof window !== 'undefined') localStorage.setItem('token', token)
            })
            .addCase(signin.rejected, (state, action: PayloadAction<any>) => {
                state.error = action.payload || 'Sign in failed'
                state.isLoading = false
            })
            .addCase(signup.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(signup.fulfilled, (state) => {
                state.isLoading = false
            })
            .addCase(signup.rejected, (state, action: PayloadAction<any>) => {
                state.error = action.payload || 'Sign up failed'
                state.isLoading = false
            })
    },
})

export const { signout, checkAuth, clearError } = slice.actions

export default slice.reducer
