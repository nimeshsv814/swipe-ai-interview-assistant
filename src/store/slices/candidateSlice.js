// src/store/slices/candidateSlice.js - UPDATED FOR FIREBASE
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { firebaseService } from '../../services/firebaseService';

// Async thunks for Firebase operations
export const createCandidateInDB = createAsyncThunk(
  'candidate/createInDB',
  async (candidateData, { rejectWithValue }) => {
    try {
      const candidate = await firebaseService.createCandidate(candidateData);
      return candidate;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateCandidateInDB = createAsyncThunk(
  'candidate/updateInDB', 
  async ({ candidateId, updateData }, { rejectWithValue }) => {
    try {
      const updatedCandidate = await firebaseService.updateCandidate(candidateId, updateData);
      return updatedCandidate;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAllCandidates = createAsyncThunk(
  'candidate/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const candidates = await firebaseService.getAllCandidates();
      return candidates;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteCandidateFromDB = createAsyncThunk(
  'candidate/deleteFromDB',
  async (candidateId, { rejectWithValue }) => {
    try {
      await firebaseService.deleteCandidate(candidateId);
      return candidateId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const uploadResumeToStorage = createAsyncThunk(
  'candidate/uploadResume',
  async ({ file, candidateId }, { rejectWithValue }) => {
    try {
      const resumeData = await firebaseService.uploadResumeFile(file, candidateId);
      return resumeData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

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
  loading: {
    creating: false,
    updating: false,
    fetching: false,
    uploading: false,
  },
  error: null,
  lastSync: null,
};

const candidateSlice = createSlice({
  name: 'candidate',
  initialState,
  reducers: {
    // Local state management (no database operations)
    setResumeFile: (state, action) => {
      state.resume = action.payload;
    },
    setExtractedInfo: (state, action) => {
      state.extractedInfo = { ...state.extractedInfo, ...action.payload };
      const required = ['name', 'email', 'phone'];
      state.missingFields = required.filter(field => !state.extractedInfo[field]);
      state.isProfileComplete = state.missingFields.length === 0;
    },
    updateCandidateInfo: (state, action) => {
      const { field, value } = action.payload;
      state.extractedInfo[field] = value;
      state.missingFields = state.missingFields.filter(f => f !== field);
      state.isProfileComplete = state.missingFields.length === 0;
    },
    setCurrentCandidate: (state, action) => {
      state.currentCandidate = action.payload;
    },
    clearCurrentCandidate: (state) => {
      state.currentCandidate = null;
      state.resume = null;
      state.extractedInfo = { name: '', email: '', phone: '' };
      state.missingFields = [];
      state.isProfileComplete = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create candidate in database
      .addCase(createCandidateInDB.pending, (state) => {
        state.loading.creating = true;
        state.error = null;
      })
      .addCase(createCandidateInDB.fulfilled, (state, action) => {
        state.loading.creating = false;
        state.currentCandidate = action.payload;
        // Add to local list if not already present
        const existingIndex = state.candidatesList.findIndex(c => c.id === action.payload.id);
        if (existingIndex === -1) {
          state.candidatesList.unshift(action.payload);
        }
        state.lastSync = new Date().toISOString();
      })
      .addCase(createCandidateInDB.rejected, (state, action) => {
        state.loading.creating = false;
        state.error = action.payload;
      })

      // Update candidate in database
      .addCase(updateCandidateInDB.pending, (state) => {
        state.loading.updating = true;
        state.error = null;
      })
      .addCase(updateCandidateInDB.fulfilled, (state, action) => {
        state.loading.updating = false;
        const updatedCandidate = action.payload;

        // Update current candidate if it's the same one
        if (state.currentCandidate?.id === updatedCandidate.id) {
          state.currentCandidate = { ...state.currentCandidate, ...updatedCandidate };
        }

        // Update in candidates list
        const index = state.candidatesList.findIndex(c => c.id === updatedCandidate.id);
        if (index !== -1) {
          state.candidatesList[index] = { ...state.candidatesList[index], ...updatedCandidate };
        }

        state.lastSync = new Date().toISOString();
      })
      .addCase(updateCandidateInDB.rejected, (state, action) => {
        state.loading.updating = false;
        state.error = action.payload;
      })

      // Fetch all candidates from database
      .addCase(fetchAllCandidates.pending, (state) => {
        state.loading.fetching = true;
        state.error = null;
      })
      .addCase(fetchAllCandidates.fulfilled, (state, action) => {
        state.loading.fetching = false;
        state.candidatesList = action.payload;
        state.lastSync = new Date().toISOString();
      })
      .addCase(fetchAllCandidates.rejected, (state, action) => {
        state.loading.fetching = false;
        state.error = action.payload;
      })

      // Delete candidate from database
      .addCase(deleteCandidateFromDB.pending, (state) => {
        state.loading.updating = true;
        state.error = null;
      })
      .addCase(deleteCandidateFromDB.fulfilled, (state, action) => {
        state.loading.updating = false;
        const deletedId = action.payload;

        // Remove from candidates list
        state.candidatesList = state.candidatesList.filter(c => c.id !== deletedId);

        // Clear current candidate if it was deleted
        if (state.currentCandidate?.id === deletedId) {
          state.currentCandidate = null;
        }

        state.lastSync = new Date().toISOString();
      })
      .addCase(deleteCandidateFromDB.rejected, (state, action) => {
        state.loading.updating = false;
        state.error = action.payload;
      })

      // Upload resume to storage
      .addCase(uploadResumeToStorage.pending, (state) => {
        state.loading.uploading = true;
        state.error = null;
      })
      .addCase(uploadResumeToStorage.fulfilled, (state, action) => {
        state.loading.uploading = false;
        // Update resume with cloud storage URL
        if (state.resume) {
          state.resume.downloadURL = action.payload.downloadURL;
          state.resume.cloudId = action.payload.id;
        }
        state.lastSync = new Date().toISOString();
      })
      .addCase(uploadResumeToStorage.rejected, (state, action) => {
        state.loading.uploading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setResumeFile,
  setExtractedInfo,
  updateCandidateInfo,
  setCurrentCandidate,
  clearCurrentCandidate,
  clearError,
} = candidateSlice.actions;

export default candidateSlice.reducer;