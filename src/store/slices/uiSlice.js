// src/store/slices/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeTab: 'interviewee', // 'interviewee' or 'interviewer'
  showWelcomeModal: false,
  showProfileModal: false,
  isInterviewStarted: false,
  currentStep: 'upload', // 'upload', 'profile', 'interview', 'completed'
  notifications: [],
  loading: {
    resume: false,
    ai: false,
    scoring: false,
  },
  errors: {
    resume: null,
    ai: null,
    general: null,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setShowWelcomeModal: (state, action) => {
      state.showWelcomeModal = action.payload;
    },
    setShowProfileModal: (state, action) => {
      state.showProfileModal = action.payload;
    },
    setInterviewStarted: (state, action) => {
      state.isInterviewStarted = action.payload;
    },
    setCurrentStep: (state, action) => {
      state.currentStep = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload,
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        n => n.id !== action.payload
      );
    },
    setLoading: (state, action) => {
      const { type, value } = action.payload;
      state.loading[type] = value;
    },
    setError: (state, action) => {
      const { type, error } = action.payload;
      state.errors[type] = error;
    },
    clearError: (state, action) => {
      const type = action.payload;
      state.errors[type] = null;
    },
    clearAllErrors: (state) => {
      state.errors = {
        resume: null,
        ai: null,
        general: null,
      };
    },
    resetUI: (state) => {
      return { ...initialState };
    },
  },
});

export const {
  setActiveTab,
  setShowWelcomeModal,
  setShowProfileModal,
  setInterviewStarted,
  setCurrentStep,
  addNotification,
  removeNotification,
  setLoading,
  setError,
  clearError,
  clearAllErrors,
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;