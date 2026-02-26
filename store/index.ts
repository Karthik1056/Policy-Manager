import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import policyReducer from './slices/policySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    policy: policyReducer,
  },
  // Adding middleware to handle serializable checks if needed
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;