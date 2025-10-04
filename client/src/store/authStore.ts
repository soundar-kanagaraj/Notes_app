import { useDispatch, useSelector } from 'react-redux'
import { useCallback } from 'react'
import { RootState, AppDispatch } from '@/redux/store'
import { signin as signinAction, signup as signupAction, signout as signoutAction, checkAuth as checkAuthAction, clearError as clearErrorAction } from '@/redux/slices/authSlice'

export const useAuthStore = () => {
    const state = useSelector((s: RootState) => s.auth)
    const dispatch = useDispatch<AppDispatch>()

    return {
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
        error: state.error,
        signin: useCallback((email: string, password: string) => dispatch(signinAction({ email, password })), [dispatch]),
        signup: useCallback((name: string, email: string, password: string) => dispatch(signupAction({ name, email, password })), [dispatch]),
        signout: useCallback(() => dispatch(signoutAction()), [dispatch]),
        checkAuth: useCallback(() => dispatch(checkAuthAction()), [dispatch]),
        clearError: useCallback(() => dispatch(clearErrorAction()), [dispatch]),
    }
}