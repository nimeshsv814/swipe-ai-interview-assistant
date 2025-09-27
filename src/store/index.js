// src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';

import interviewSlice from './slices/interviewSlice';
import candidateSlice from './slices/candidateSlice';
import uiSlice from './slices/uiSlice';

const rootReducer = combineReducers({
  interview: interviewSlice,
  candidate: candidateSlice,
  ui: uiSlice,
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['interview', 'candidate'], // Only persist interview and candidate data
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);