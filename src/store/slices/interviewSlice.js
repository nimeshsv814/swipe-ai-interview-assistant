// src/store/slices/interviewSlice.js - NO FIREBASE, LOCALSTORAGE ONLY
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { aiService } from '../../services/aiService';

// Async thunk for generating questions (OpenAI only, no Firebase)
export const generateQuestion = createAsyncThunk(
  'interview/generateQuestion',
  async ({ candidateInfo, difficulty, questionIndex }, { rejectWithValue }) => {
    try {
      console.log(`🤖 Generating ${difficulty} question ${questionIndex + 1}`);
      const question = await aiService.generateQuestion(candidateInfo, difficulty, questionIndex);
      return { question, difficulty, questionIndex };
    } catch (error) {
      console.error('AI question generation error:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for scoring answers (OpenAI only, no Firebase)  
export const scoreAnswer = createAsyncThunk(
  'interview/scoreAnswer',
  async ({ question, answer, difficulty }, { rejectWithValue }) => {
    try {
      console.log(`🎯 Scoring ${difficulty} answer...`);
      const score = await aiService.scoreAnswer(question, answer, difficulty);
      return { score, answer, difficulty };
    } catch (error) {
      console.error('AI answer scoring error:', error);
      return rejectWithValue(error.message || 'Failed to score answer');
    }
  }
);

const initialState = {
  currentQuestionIndex: 0,
  questions: [],
  answers: [],
  currentQuestion: null,
  timeRemaining: 0,
  isActive: false,
  isCompleted: false,
  isPaused: false,
  totalQuestions: 6,
  startTime: null,
  endTime: null,
  finalScore: null,
  finalSummary: null,
  loading: false,
  error: null
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    // Start the interview
    startInterview: (state) => {
      state.isActive = true;
      state.isCompleted = false;
      state.isPaused = false;
      state.currentQuestionIndex = 0;
      state.startTime = new Date().toISOString();
      state.error = null;
      state.timeRemaining = 20; // Start with easy question timer
      console.log('🚀 Interview started (localStorage mode)');
    },

    // Set timer for current question
    setTimer: (state, action) => {
      state.timeRemaining = action.payload;
      console.log(`⏰ Timer set to ${action.payload}s`);
    },

    // Decrement timer each second
    decrementTimer: (state) => {
      if (state.timeRemaining > 0) {
        state.timeRemaining -= 1;
      }
    },

    // Submit answer (synchronous, no database)
    submitAnswer: (state, action) => {
      const { answer, score, timeSpent, difficulty, questionIndex } = action.payload;

      const answerData = {
        questionIndex,
        question: state.currentQuestion,
        answer,
        score: score || 50, // Default score if not provided
        timeSpent,
        difficulty,
        timestamp: new Date().toISOString()
      };

      // Add to answers array
      state.answers.push(answerData);
      console.log(`📝 Answer submitted (localStorage): ${score || 50} points`);
    },

    // Move to next question
    nextQuestion: (state) => {
      if (state.currentQuestionIndex < state.totalQuestions - 1) {
        state.currentQuestionIndex += 1;
        state.currentQuestion = null; // Clear for new generation
        state.timeRemaining = 0;
        console.log(`➡️  Moving to question ${state.currentQuestionIndex + 1}`);
      }
    },

    // Complete the interview
    completeInterview: (state, action) => {
      state.isCompleted = true;
      state.isActive = false;
      state.endTime = new Date().toISOString();

      if (action.payload) {
        state.finalScore = action.payload.finalScore;
        state.finalSummary = action.payload.finalSummary;
      } else {
        // Calculate final score from answers
        const totalScore = state.answers.reduce((sum, answer) => sum + (answer.score || 0), 0);
        state.finalScore = state.answers.length > 0 ? Math.round(totalScore / state.answers.length) : 0;
        state.finalSummary = `Interview completed with ${state.answers.length} questions. Average score: ${state.finalScore}%`;
      }

      console.log(`🎉 Interview completed (localStorage): ${state.finalScore}% average`);
    },

    // Pause interview
    pauseInterview: (state) => {
      state.isPaused = true;
      state.isActive = false;
      console.log('⏸️  Interview paused');
    },

    // Resume interview
    resumeInterview: (state) => {
      state.isPaused = false;
      state.isActive = true;
      console.log('▶️  Interview resumed');
    },

    // Reset interview completely
    resetInterview: (state) => {
      console.log('🔄 Interview reset');
      return { ...initialState };
    },

    // Set error state
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
      console.error('❌ Interview error:', action.payload);
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Set loading state
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  },

  extraReducers: (builder) => {
    builder
      // Generate question cases
      .addCase(generateQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log('🤖 Generating question...');
      })
      .addCase(generateQuestion.fulfilled, (state, action) => {
        state.loading = false;
        const { question, difficulty, questionIndex } = action.payload;

        // Set current question
        state.currentQuestion = question;

        // Add to questions array if not already there
        const existingIndex = state.questions.findIndex(q => q.index === questionIndex);
        if (existingIndex === -1) {
          state.questions.push({
            index: questionIndex,
            question,
            difficulty,
            timestamp: new Date().toISOString()
          });
        }

        // Set timer based on difficulty
        const timers = { easy: 20, medium: 60, hard: 120 };
        state.timeRemaining = timers[difficulty] || 20;

        console.log(`✅ Question generated: ${difficulty} level`);
      })
      .addCase(generateQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to generate question';
        console.error('❌ Question generation failed:', action.payload);
      })

      // Score answer cases  
      .addCase(scoreAnswer.pending, (state) => {
        console.log('🎯 Scoring answer...');
      })
      .addCase(scoreAnswer.fulfilled, (state, action) => {
        const { score } = action.payload;
        console.log(`✅ Answer scored: ${score} points`);
        // Score is handled by submitAnswer reducer
      })
      .addCase(scoreAnswer.rejected, (state, action) => {
        console.warn('⚠️  Answer scoring failed, using default score');
        // Continue with default scoring in submitAnswer
      });
  }
});

export const {
  startInterview,
  setTimer,
  decrementTimer,
  submitAnswer,
  nextQuestion,
  completeInterview,
  pauseInterview,
  resumeInterview,
  resetInterview,
  setError,
  clearError,
  setLoading
} = interviewSlice.actions;

export default interviewSlice.reducer;