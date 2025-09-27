// src/components/Chat/ChatInterface.js - CORRECTED IMPORTS
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Card, 
  Input, 
  Button, 
  Typography, 
  Tag, 
  Progress, 
  Avatar, 
  message,
  Spin 
} from 'antd';
import { 
  SendOutlined, 
  RobotOutlined, 
  UserOutlined, 
  ClockCircleOutlined,
  CheckOutlined 
} from '@ant-design/icons';

import { aiService } from '../../services/aiService';
import { 
  generateQuestion,      // ✅ Available
  submitAnswer,          // ✅ Available  
  nextQuestion,          // ✅ Available
  setTimer,              // ✅ Available
  decrementTimer,        // ✅ Available
  resetInterview         // ✅ Available
} from '../../store/slices/interviewSlice';
import { 
  createCandidateInDB,
  updateCandidateInDB
} from '../../store/slices/candidateSlice';
import { setCurrentStep } from '../../store/slices/uiSlice';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ChatInterface = () => {
  const dispatch = useDispatch();
  const { 
    currentQuestionIndex, 
    questions, 
    answers, 
    timeRemaining, 
    isActive, 
    isCompleted,
    currentQuestion  // Use from slice instead of calculating
  } = useSelector(state => state.interview);
  const { currentCandidate, extractedInfo } = useSelector(state => state.candidate);

  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Memoize static configuration objects
  const difficultyMap = useMemo(() => ({ 
    0: 'easy', 1: 'easy', 2: 'medium', 3: 'medium', 4: 'hard', 5: 'hard' 
  }), []);

  const timeMap = useMemo(() => ({ 
    easy: 20, medium: 60, hard: 120 
  }), []);

  const currentDifficulty = difficultyMap[currentQuestionIndex];

  // Generate question when starting or moving to next question
  const generateNextQuestion = useCallback(async () => {
    if (aiGenerating || currentQuestion) return;

    try {
      setAiGenerating(true);
      console.log('Generating question', currentQuestionIndex + 1);

      // Use the available generateQuestion action
      const result = await dispatch(generateQuestion({
        candidateInfo: extractedInfo,
        difficulty: currentDifficulty,
        questionIndex: currentQuestionIndex
      }));

      if (generateQuestion.fulfilled.match(result)) {
        // Set timer using available setTimer action
        dispatch(setTimer(timeMap[currentDifficulty]));
        console.log('Question generated and timer set');
      }

      setAiGenerating(false);
    } catch (error) {
      console.error('Error generating question:', error);
      message.error('Failed to generate question. Please try again.');
      setAiGenerating(false);
    }
  }, [dispatch, extractedInfo, currentDifficulty, currentQuestionIndex, timeMap, aiGenerating, currentQuestion]);

  useEffect(() => {
    if (isActive && !isCompleted && !currentQuestion && !aiGenerating) {
      generateNextQuestion();
    }
  }, [isActive, isCompleted, currentQuestion, aiGenerating, generateNextQuestion]);

  // Timer countdown effect
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      const timer = setInterval(() => {
        dispatch(decrementTimer()); // Use available decrementTimer
        if (timeRemaining <= 1) {
          handleSubmitAnswer(); // Auto-submit when time runs out
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isActive, timeRemaining]);

  const handleSubmitAnswer = useCallback(async () => {
    if (!currentAnswer.trim() && timeRemaining > 0) return;

    try {
      setIsSubmitting(true);
      const answerText = currentAnswer.trim() || "No answer provided";
      const timeSpent = timeMap[currentDifficulty] - timeRemaining;

      // Use available submitAnswer action
      const result = await dispatch(submitAnswer({
        answer: answerText,
        timeSpent,
        difficulty: currentDifficulty,
        questionIndex: currentQuestionIndex
      }));

      if (submitAnswer.fulfilled.match(result)) {
        // Check if interview is complete
        if (currentQuestionIndex >= 5) {
          await completeInterviewProcess();
        } else {
          // Move to next question
          dispatch(nextQuestion());
          setCurrentAnswer('');
        }
      }

      setIsSubmitting(false);
    } catch (error) {
      console.error('Error submitting answer:', error);
      message.error('Failed to submit answer. Please try again.');
      setIsSubmitting(false);
    }
  }, [currentAnswer, timeRemaining, currentDifficulty, currentQuestionIndex, dispatch, timeMap]);

  const completeInterviewProcess = useCallback(async () => {
    try {
      console.log('Completing interview process...');

      // Calculate final score from answers
      const totalScore = answers.reduce((sum, answer) => sum + (answer.score || 0), 0) / Math.max(answers.length, 1);
      const finalSummary = `Interview completed with ${answers.length} questions answered. Average score: ${Math.round(totalScore)}%`;

      // Update candidate in database with final results
      if (currentCandidate?.id) {
        await dispatch(updateCandidateInDB({
          candidateId: currentCandidate.id,
          updateData: {
            finalScore: Math.round(totalScore),
            finalSummary,
            status: 'completed',
            interviewCompletedAt: new Date().toISOString(),
            answers: [...answers, {
              question: currentQuestion?.question || '',
              answer: currentAnswer.trim() || "No answer provided",
              difficulty: currentDifficulty,
              questionIndex: currentQuestionIndex
            }]
          }
        }));
      }

      message.success('Interview completed successfully!');

      setTimeout(() => {
        dispatch(setCurrentStep('completed'));
      }, 2000);

    } catch (error) {
      console.error('Error completing interview:', error);
      message.error('Error completing interview');
    }
  }, [answers, currentCandidate, dispatch, currentQuestion, currentAnswer, currentDifficulty, currentQuestionIndex]);

  const getProgressPercent = () => {
    return Math.round(((currentQuestionIndex + 1) / 6) * 100);
  };

  const getDifficultyColor = (difficulty) => {
    const colors = { easy: 'green', medium: 'orange', hard: 'red' };
    return colors[difficulty] || 'blue';
  };

  if (aiGenerating) {
    return (
      <div className="chat-interface" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Spin size="large" tip="Generating your interview question..." />
      </div>
    );
  }

  return (
    <div className="chat-interface" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <div className="interview-header" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3} style={{ margin: 0 }}>
              Technical Interview - Question {currentQuestionIndex + 1} of 6
            </Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {currentDifficulty && (
                <Tag color={getDifficultyColor(currentDifficulty)}>
                  {currentDifficulty.toUpperCase()}
                </Tag>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClockCircleOutlined />
                <Text strong>{timeRemaining}s</Text>
              </div>
            </div>
          </div>

          <Progress 
            percent={getProgressPercent()} 
            strokeColor="#1890ff"
            style={{ marginTop: '16px' }}
          />
        </div>

        <div className="chat-messages" style={{ 
          maxHeight: '400px', 
          overflowY: 'auto', 
          padding: '16px', 
          background: '#fafafa', 
          borderRadius: '8px',
          marginBottom: '20px' 
        }}>
          {currentQuestion && (
            <div className="message message-ai" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Avatar icon={<RobotOutlined />} style={{ background: '#1890ff' }} />
                <div style={{ 
                  background: '#ffffff', 
                  padding: '12px 16px', 
                  borderRadius: '12px',
                  maxWidth: '80%',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' 
                }}>
                  <Text>{currentQuestion}</Text>
                </div>
              </div>
            </div>
          )}

          {currentAnswer && (
            <div className="message message-user" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flexDirection: 'row-reverse' }}>
                <Avatar icon={<UserOutlined />} style={{ background: '#52c41a' }} />
                <div style={{ 
                  background: '#1890ff', 
                  color: 'white',
                  padding: '12px 16px', 
                  borderRadius: '12px',
                  maxWidth: '80%' 
                }}>
                  <Text style={{ color: 'white' }}>{currentAnswer}</Text>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="answer-input">
          <TextArea
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Type your answer here..."
            rows={4}
            disabled={!isActive || timeRemaining === 0}
            style={{ marginBottom: '12px' }}
          />

          <div style={{ textAlign: 'right' }}>
            <Button 
              type="primary" 
              icon={isSubmitting ? <CheckOutlined /> : <SendOutlined />}
              onClick={handleSubmitAnswer}
              loading={isSubmitting}
              disabled={!isActive || (!currentAnswer.trim() && timeRemaining > 0)}
              size="large"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Answer'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChatInterface;