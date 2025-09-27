// src/store/slices/candidateSlice.js - NO FIREBASE, LOCALSTORAGE ONLY
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentCandidate: null,
  candidatesList: [],
  resume: null,
  extractedInfo: {
    name: '',
    email: '',
    phone: '',
  },
  missingFields: [],
  isProfileComplete: false,
  loading: false,
  error: null,
};

const candidateSlice = createSlice({
  name: 'candidate',
  initialState,
  reducers: {
    // Set resume file
    setResumeFile: (state, action) => {
      state.resume = action.payload;
      console.log('📄 Resume file set:', action.payload?.name);
    },

    // Set extracted information from resume
    setExtractedInfo: (state, action) => {
      state.extractedInfo = { ...state.extractedInfo, ...action.payload };

      // Check for missing required fields
      const required = ['name', 'email', 'phone'];
      state.missingFields = required.filter(field => !state.extractedInfo[field]);
      state.isProfileComplete = state.missingFields.length === 0;

      console.log('✅ Extracted info updated:', state.extractedInfo);
      console.log('Missing fields:', state.missingFields);
    },

    // Update specific candidate info field
    updateCandidateInfo: (state, action) => {
      const { field, value } = action.payload;
      state.extractedInfo[field] = value;

      // Remove from missing fields if now provided
      state.missingFields = state.missingFields.filter(f => f !== field);
      state.isProfileComplete = state.missingFields.length === 0;

      console.log(`📝 Updated ${field}:`, value);
    },

    // Create new candidate (localStorage only)
    createCandidate: (state, action) => {
      const candidateData = {
        id: Date.now().toString(), // Simple ID generation
        ...action.payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };

      // Set as current candidate
      state.currentCandidate = candidateData;

      // Add to candidates list
      state.candidatesList.unshift(candidateData);

      console.log('👤 Candidate created (localStorage):', candidateData);
    },

    // Update candidate data
    updateCandidate: (state, action) => {
      const { candidateId, updateData } = action.payload;

      // Update current candidate if it matches
      if (state.currentCandidate?.id === candidateId) {
        state.currentCandidate = {
          ...state.currentCandidate,
          ...updateData,
          updatedAt: new Date().toISOString()
        };
      }

      // Update in candidates list
      const index = state.candidatesList.findIndex(c => c.id === candidateId);
      if (index !== -1) {
        state.candidatesList[index] = {
          ...state.candidatesList[index],
          ...updateData,
          updatedAt: new Date().toISOString()
        };
      }

      console.log('📝 Candidate updated (localStorage):', updateData);
    },

    // Set current candidate
    setCurrentCandidate: (state, action) => {
      state.currentCandidate = action.payload;
      console.log('👤 Current candidate set:', action.payload?.name);
    },

    // Clear current candidate and reset form
    clearCurrentCandidate: (state) => {
      state.currentCandidate = null;
      state.resume = null;
      state.extractedInfo = { name: '', email: '', phone: '' };
      state.missingFields = [];
      state.isProfileComplete = false;
      console.log('🧹 Current candidate cleared');
    },

    // Delete candidate
    deleteCandidate: (state, action) => {
      const candidateId = action.payload;

      // Remove from list
      state.candidatesList = state.candidatesList.filter(c => c.id !== candidateId);

      // Clear current candidate if it was deleted
      if (state.currentCandidate?.id === candidateId) {
        state.currentCandidate = null;
      }

      console.log('🗑️  Candidate deleted (localStorage):', candidateId);
    },

    // Set loading state
    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    // Set error state
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
      console.error('❌ Candidate error:', action.payload);
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Load candidates from localStorage (for initialization)
    loadCandidatesFromStorage: (state, action) => {
      if (action.payload && Array.isArray(action.payload)) {
        state.candidatesList = action.payload;
        console.log('📥 Candidates loaded from localStorage:', action.payload.length);
      }
    },

    // Add interview results to candidate
    addInterviewResults: (state, action) => {
      const { candidateId, results } = action.payload;

      // Update current candidate
      if (state.currentCandidate?.id === candidateId) {
        state.currentCandidate = {
          ...state.currentCandidate,
          interviewResults: results,
          interviewCompletedAt: new Date().toISOString(),
          status: 'completed',
          updatedAt: new Date().toISOString()
        };
      }

      // Update in candidates list
      const index = state.candidatesList.findIndex(c => c.id === candidateId);
      if (index !== -1) {
        state.candidatesList[index] = {
          ...state.candidatesList[index],
          interviewResults: results,
          interviewCompletedAt: new Date().toISOString(),
          status: 'completed',
          updatedAt: new Date().toISOString()
        };
      }

      console.log('🎯 Interview results added (localStorage):', results);
    }
  },
});

export const {
  setResumeFile,
  setExtractedInfo,
  updateCandidateInfo,
  createCandidate,
  updateCandidate,
  setCurrentCandidate,
  clearCurrentCandidate,
  deleteCandidate,
  setLoading,
  setError,
  clearError,
  loadCandidatesFromStorage,
  addInterviewResults
} = candidateSlice.actions;

export default candidateSlice.reducer;