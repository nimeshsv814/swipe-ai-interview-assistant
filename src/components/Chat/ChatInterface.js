// src/components/Chat/ChatInterface.js - WITH PROPER RESULT SAVING
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Card, 
  Button, 
  Typography, 
  Tag, 
  Progress, 
  Avatar, 
  message,
  Spin,
  Input
} from 'antd';
import { 
  SendOutlined, 
  RobotOutlined, 
  UserOutlined, 
  ClockCircleOutlined
} from '@ant-design/icons';

import { aiService } from '../../services/aiService';
import { 
  generateQuestion,
  submitAnswer,
  nextQuestion,
  setTimer,
  decrementTimer,
  startInterview,
  completeInterview
} from '../../store/slices/interviewSlice';
import { 
  addInterviewResults,
  updateCandidate
} from '../../store/slices/candidateSlice';
import { setCurrentStep } from '../../store/slices/uiSlice';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ChatInterface = () => {
  const dispatch = useDispatch();
  const interview = useSelector(state => state.interview || {});
  const candidate = useSelector(state => state.candidate || {});

  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Safe destructuring with defaults
  const currentQuestionIndex = interview.currentQuestionIndex || 0;
  const questions = interview.questions || [];
  const answers = interview.answers || [];
  const timeRemaining = interview.timeRemaining || 0;
  const isActive = interview.isActive || false;
  const isCompleted = interview.isCompleted || false;
  const currentQuestion = interview.currentQuestion;
  const loading = interview.loading || false;
  const totalQuestions = 6;

  const currentCandidate = candidate.currentCandidate;
  const extractedInfo = candidate.extractedInfo || {};

  // Difficulty mapping
  const getDifficulty = (index) => {
    if (index <= 1) return 'easy';
    if (index <= 3) return 'medium';
    return 'hard';
  };

  // Time limits
  const getTimeLimit = (difficulty) => {
    if (difficulty === 'easy') return 30;
    if (difficulty === 'medium') return 90;
    return 150;
  };

  const currentDifficulty = getDifficulty(currentQuestionIndex);

  // Start interview when component loads
  useEffect(() => {
    if (!isActive && !isCompleted && currentQuestionIndex === 0 && !currentQuestion) {
      console.log('🚀 Starting interview...');
      dispatch(startInterview());
    }
  }, [dispatch, isActive, isCompleted, currentQuestionIndex, currentQuestion]);

  // Generate question when needed
  useEffect(() => {
    if (isActive && !isCompleted && !currentQuestion && !loading && currentQuestionIndex < totalQuestions) {
      console.log('🤖 Generating question', currentQuestionIndex + 1);

      dispatch(generateQuestion({
        candidateInfo: extractedInfo,
        difficulty: currentDifficulty,
        questionIndex: currentQuestionIndex
      })).then(() => {
        dispatch(setTimer(getTimeLimit(currentDifficulty)));
      });
    }
  }, [dispatch, isActive, isCompleted, currentQuestion, loading, currentQuestionIndex, extractedInfo, currentDifficulty, totalQuestions]);

  // Timer countdown
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      const timer = setInterval(() => {
        dispatch(decrementTimer());
      }, 1000);
      return () => clearInterval(timer);
    }

    if (isActive && timeRemaining === 0 && currentQuestion && !isSubmitting) {
      console.log('⏰ Time up! Auto-submitting...');
      handleSubmitAnswer();
    }
  }, [isActive, timeRemaining, currentQuestion, isSubmitting, dispatch]);

  // FIXED: Complete interview with proper result saving
  const completeInterviewProcess = useCallback(async (finalAnswers) => {
    try {
      console.log('🎉 Completing interview and saving results...');

      // Calculate final score
      const allScores = finalAnswers.map(a => a.score || 0);
      const finalScore = Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length);

      const performance = finalScore >= 80 ? 'Excellent' : 
                         finalScore >= 60 ? 'Good' : 
                         finalScore >= 40 ? 'Fair' : 'Needs Improvement';

      const finalSummary = 'Interview completed successfully! Answered ' + totalQuestions + 
                          ' questions with an average score of ' + finalScore + '%. Performance: ' + performance + '.';

      const completedAt = new Date().toISOString();

      // Complete interview in store
      dispatch(completeInterview({
        finalScore,
        finalSummary,
        completedAt
      }));

      // CRITICAL: Save results to candidate record
      if (currentCandidate && currentCandidate.id) {
        console.log('💾 Saving interview results to candidate:', currentCandidate.id);

        dispatch(addInterviewResults({
          candidateId: currentCandidate.id,
          results: {
            finalScore,
            finalSummary,
            totalQuestions,
            answersCount: finalAnswers.length,
            averageScore: finalScore,
            performance,
            completedAt,
            interviewData: {
              questions: questions,
              answers: finalAnswers,
              startTime: interview.startTime,
              endTime: completedAt,
              totalTimeSpent: Date.parse(completedAt) - Date.parse(interview.startTime)
            }
          }
        }));

        // Also update candidate status
        dispatch(updateCandidate({
          candidateId: currentCandidate.id,
          updateData: {
            status: 'interview-completed',
            interviewCompletedAt: completedAt,
            finalScore,
            lastActivity: completedAt
          }
        }));

        console.log('✅ Interview results saved to candidate record!');
      } else {
        console.warn('⚠️  No current candidate found - results not saved to dashboard');
      }

      message.success('Interview completed! Final score: ' + finalScore + '%');

      setTimeout(() => {
        dispatch(setCurrentStep('completed'));
      }, 3000);

    } catch (error) {
      console.error('❌ Error completing interview:', error);
      message.error('Error saving interview results');
    }
  }, [currentCandidate, dispatch, totalQuestions, questions, interview.startTime]);

  const handleSubmitAnswer = useCallback(async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const answerText = currentAnswer.trim() || "No answer provided";
      const timeSpent = getTimeLimit(currentDifficulty) - timeRemaining;

      console.log('📝 Submitting answer for question', currentQuestionIndex + 1);

      // Score answer
      let score = 50;
      try {
        score = await aiService.scoreAnswer(currentQuestion, answerText, currentDifficulty);
        console.log('🎯 AI scored:', score, 'points');
      } catch (error) {
        console.warn('AI scoring failed, using default score');
      }

      // Submit to store
      dispatch(submitAnswer({
        answer: answerText,
        score,
        timeSpent,
        difficulty: currentDifficulty,
        questionIndex: currentQuestionIndex
      }));

      setCurrentAnswer('');

      // Check if complete
      if (currentQuestionIndex >= totalQuestions - 1) {
        console.log('🏁 Final question completed!');

        // Get updated answers including this one
        const updatedAnswers = [...answers, {
          questionIndex: currentQuestionIndex,
          question: currentQuestion,
          answer: answerText,
          score,
          timeSpent,
          difficulty: currentDifficulty,
          timestamp: new Date().toISOString()
        }];

        // Complete the interview
        await completeInterviewProcess(updatedAnswers);

      } else {
        console.log('➡️  Moving to next question');
        dispatch(nextQuestion());
      }

    } catch (error) {
      console.error('❌ Error submitting answer:', error);
      message.error('Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  }, [currentAnswer, timeRemaining, currentQuestion, currentDifficulty, currentQuestionIndex, 
      totalQuestions, dispatch, isSubmitting, answers, completeInterviewProcess]);

  // Progress calculation - FIXED
  const getProgressPercent = () => {
    const completedQuestions = answers.length;
    return Math.round((completedQuestions / totalQuestions) * 100);
  };

  const getDifficultyColor = (difficulty) => {
    if (difficulty === 'easy') return 'green';
    if (difficulty === 'medium') return 'orange';
    return 'red';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Spin size="large" tip="Generating question..." />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <Title level={3} style={{ margin: 0 }}>
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </Title>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Tag color={getDifficultyColor(currentDifficulty)}>
                {currentDifficulty.toUpperCase()}
              </Tag>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                padding: '6px 12px',
                border: '1px solid #d9d9d9',
                borderRadius: '8px'
              }}>
                <ClockCircleOutlined />
                <Text strong>{timeRemaining}s</Text>
              </div>
            </div>
          </div>

          <Progress 
            percent={getProgressPercent()} 
            format={percent => percent + '% Complete'}
          />

          {/* Show candidate info for debugging */}
          {currentCandidate && (
            <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
              Interviewing: {currentCandidate.name} (ID: {currentCandidate.id})
            </div>
          )}
        </div>

        {/* Chat Messages */}
        <div style={{ 
          maxHeight: '400px', 
          overflowY: 'auto', 
          padding: '20px', 
          background: '#fafafa', 
          borderRadius: '8px',
          marginBottom: '20px',
          minHeight: '200px'
        }}>
          {currentQuestion ? (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Avatar icon={<RobotOutlined />} style={{ background: '#1890ff' }} />
                <div style={{ 
                  background: '#ffffff', 
                  padding: '16px', 
                  borderRadius: '12px',
                  maxWidth: '80%',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <Text>{currentQuestion}</Text>
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>
                    {currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1)} • {getTimeLimit(currentDifficulty)}s time limit
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin />
              <div style={{ marginTop: '16px' }}>Preparing your question...</div>
            </div>
          )}

          {currentAnswer && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flexDirection: 'row-reverse' }}>
                <Avatar icon={<UserOutlined />} style={{ background: '#52c41a' }} />
                <div style={{ 
                  background: '#1890ff', 
                  color: 'white',
                  padding: '16px', 
                  borderRadius: '12px',
                  maxWidth: '80%'
                }}>
                  <Text style={{ color: 'white' }}>{currentAnswer}</Text>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Answer Input */}
        <div>
          <TextArea
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Type your answer here..."
            rows={4}
            disabled={!isActive || !currentQuestion || timeRemaining === 0 || isSubmitting}
            style={{ marginBottom: '16px' }}
          />

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {timeRemaining <= 10 && timeRemaining > 0 && (
                <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                  ⏰ {timeRemaining}s remaining!
                </span>
              )}
            </div>

            <Button 
              type="primary" 
              icon={<SendOutlined />}
              onClick={handleSubmitAnswer}
              loading={isSubmitting}
              disabled={!isActive || !currentQuestion}
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