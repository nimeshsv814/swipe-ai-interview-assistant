// src/store/slices/interviewSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { aiService } from '../../services/aiService';

// Async thunk for generating interview question
export const generateQuestion = createAsyncThunk(
  'interview/generateQuestion',
  async ({ candidateInfo, questionIndex }) => {
    const difficulty = questionIndex < 2 ? 'easy' : questionIndex < 4 ? 'medium' : 'hard';
    const question = await aiService.generateQuestion(candidateInfo, difficulty, questionIndex);
    return { question, difficulty, questionIndex };
  }
);

// Async thunk for scoring answer
export const scoreAnswer = createAsyncThunk(
  'interview/scoreAnswer',
  async ({ question, answer, difficulty }) => {
    const score = await aiService.scoreAnswer(question, answer, difficulty);
    return score;
  }
);

// Async thunk for final evaluation
export const generateFinalEvaluation = createAsyncThunk(
  'interview/generateFinalEvaluation',
  async ({ candidateInfo, questionAnswers }) => {
    const evaluation = await aiService.generateFinalEvaluation(candidateInfo, questionAnswers);
    return evaluation;
  }
);

const initialState = {
  currentQuestion: null,
  questionIndex: 0,
  questions: [],
  answers: [],
  scores: [],
  timer: 0,
  isActive: false,
  isPaused: false,
  isCompleted: false,
  finalScore: 0,
  finalSummary: '',
  isLoading: false,
  error: null,
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    startInterview: (state) => {
      state.isActive = true;
      state.isPaused = false;
      state.questionIndex = 0;
      state.timer = 20; // Start with easy question timer
    },
    pauseInterview: (state) => {
      state.isPaused = true;
    },
    resumeInterview: (state) => {
      state.isPaused = false;
    },
    setTimer: (state, action) => {
      state.timer = action.payload;
    },
    decrementTimer: (state) => {
      if (state.timer > 0) {
        state.timer -= 1;
      }
    },
    submitAnswer: (state, action) => {
      const { answer } = action.payload;
      state.answers[state.questionIndex] = answer;
    },
    nextQuestion: (state) => {
      state.questionIndex += 1;
      if (state.questionIndex >= 6) {
        state.isCompleted = true;
        state.isActive = false;
      } else {
        // Set timer based on difficulty
        const difficulty = state.questionIndex < 2 ? 'easy' : state.questionIndex < 4 ? 'medium' : 'hard';
        state.timer = difficulty === 'easy' ? 20 : difficulty === 'medium' ? 60 : 120;
      }
    },
    resetInterview: (state) => {
      return { ...initialState };
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateQuestion.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateQuestion.fulfilled, (state, action) => {
        state.isLoading = false;
        const { question, difficulty, questionIndex } = action.payload;
        state.questions[questionIndex] = { question, difficulty, questionIndex };
        state.currentQuestion = question;
        // Set timer based on difficulty
        state.timer = difficulty === 'easy' ? 20 : difficulty === 'medium' ? 60 : 120;
      })
      .addCase(generateQuestion.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      .addCase(scoreAnswer.fulfilled, (state, action) => {
        state.scores[state.questionIndex] = action.payload;
      })
      .addCase(generateFinalEvaluation.fulfilled, (state, action) => {
        const { totalScore, summary } = action.payload;
        state.finalScore = totalScore;
        state.finalSummary = summary;
      });
  },
});

export const {
  startInterview,
  pauseInterview,
  resumeInterview,
  setTimer,
  decrementTimer,
  submitAnswer,
  nextQuestion,
  resetInterview,
  setError,
} = interviewSlice.actions;

export default interviewSlice.reducer;