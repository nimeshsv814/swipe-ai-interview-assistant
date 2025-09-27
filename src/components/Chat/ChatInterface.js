// src/components/Chat/ChatInterface.js - FIXED TIMER ALIGNMENT
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Input,
  Space
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
  generateQuestion,
  submitAnswer,
  nextQuestion,
  setTimer,
  decrementTimer,
  startInterview
} from '../../store/slices/interviewSlice';
import { setCurrentStep } from '../../store/slices/uiSlice';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ChatInterface = () => {
  const dispatch = useDispatch();
  const { 
    currentQuestionIndex = 0,
    questions = [],
    answers = [],
    timeRemaining = 0,
    isActive = false,
    isCompleted = false,
    currentQuestion,
    loading = false,
    totalQuestions = 6
  } = useSelector(state => state.interview || {});

  const { extractedInfo = {} } = useSelector(state => state.candidate || {});

  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const difficultyMap = useMemo(() => ({ 
    0: 'easy', 1: 'easy', 2: 'medium', 3: 'medium', 4: 'hard', 5: 'hard' 
  }), []);

  const timeMap = useMemo(() => ({ 
    easy: 20, medium: 60, hard: 120 
  }), []);

  const currentDifficulty = difficultyMap[currentQuestionIndex] || 'easy';

  // Initialize interview when component mounts
  useEffect(() => {
    if (!isActive && !isCompleted && currentQuestionIndex === 0) {
      console.log('Starting interview...');
      dispatch(startInterview());
    }
  }, [dispatch, isActive, isCompleted, currentQuestionIndex]);

  // Generate question when needed
  useEffect(() => {
    const shouldGenerateQuestion = isActive && 
                                  !isCompleted && 
                                  !currentQuestion && 
                                  !loading &&
                                  typeof currentQuestionIndex === 'number';

    if (shouldGenerateQuestion) {
      console.log(`Generating question ${currentQuestionIndex + 1}`);
      dispatch(generateQuestion({
        candidateInfo: extractedInfo,
        difficulty: currentDifficulty,
        questionIndex: currentQuestionIndex
      }));
    }
  }, [dispatch, isActive, isCompleted, currentQuestion, loading, currentQuestionIndex, extractedInfo, currentDifficulty]);

  // Timer countdown
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      const timer = setInterval(() => {
        dispatch(decrementTimer());
      }, 1000);

      return () => clearInterval(timer);
    }

    if (isActive && timeRemaining === 0 && currentQuestion && !isSubmitting) {
      handleSubmitAnswer();
    }
  }, [isActive, timeRemaining, currentQuestion, isSubmitting, dispatch]);

  const handleSubmitAnswer = useCallback(async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const answerText = currentAnswer.trim() || "No answer provided";
      const timeSpent = timeMap[currentDifficulty] - timeRemaining;

      let score = 50;
      try {
        score = await aiService.scoreAnswer(currentQuestion || '', answerText, currentDifficulty);
      } catch (error) {
        console.warn('AI scoring failed, using default score:', error);
      }

      await dispatch(submitAnswer({
        answer: answerText,
        score,
        timeSpent,
        difficulty: currentDifficulty,
        questionIndex: currentQuestionIndex
      }));

      if (currentQuestionIndex >= totalQuestions - 1) {
        message.success('Interview completed!');
        setTimeout(() => {
          dispatch(setCurrentStep('completed'));
        }, 2000);
      } else {
        dispatch(nextQuestion());
        setCurrentAnswer('');

        const nextDifficulty = difficultyMap[currentQuestionIndex + 1] || 'easy';
        dispatch(setTimer(timeMap[nextDifficulty]));
      }

    } catch (error) {
      console.error('Error submitting answer:', error);
      message.error('Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  }, [currentAnswer, timeRemaining, currentQuestion, currentDifficulty, currentQuestionIndex, 
      totalQuestions, dispatch, timeMap, difficultyMap, isSubmitting]);

  const getProgressPercent = () => {
    if (typeof currentQuestionIndex !== 'number' || typeof totalQuestions !== 'number') {
      return 0;
    }
    return Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);
  };

  const getDifficultyColor = (difficulty) => {
    const colors = { easy: 'green', medium: 'orange', hard: 'red' };
    return colors[difficulty] || 'blue';
  };

  // Get timer color based on remaining time
  const getTimerColor = () => {
    const maxTime = timeMap[currentDifficulty];
    const percentage = (timeRemaining / maxTime) * 100;

    if (percentage > 50) return '#52c41a'; // Green
    if (percentage > 25) return '#faad14'; // Orange  
    return '#ff4d4f'; // Red
  };

  const questionDisplay = typeof currentQuestionIndex === 'number' ? 
    `Question ${currentQuestionIndex + 1} of ${totalQuestions}` : 
    'Loading Interview...';

  if (loading) {
    return (
      <div className="chat-interface" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Spin size="large" tip="Generating your interview question..." />
      </div>
    );
  }

  return (
    <div className="chat-interface" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        {/* FIXED HEADER WITH PROPER ALIGNMENT */}
        <div className="interview-header" style={{ marginBottom: '24px' }}>
          {/* Title and Info Row */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '16px'
          }}>
            {/* Left side - Title */}
            <Title level={3} style={{ margin: 0, flex: '1 1 auto', minWidth: '250px' }}>
              AI Interview - {questionDisplay}
            </Title>

            {/* Right side - Tags and Timer */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              flex: '0 0 auto'
            }}>
              {/* Difficulty Tag */}
              <Tag 
                color={getDifficultyColor(currentDifficulty)}
                style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  padding: '4px 8px',
                  borderRadius: '6px'
                }}
              >
                {currentDifficulty.toUpperCase()}
              </Tag>

              {/* Timer - Properly Aligned */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                background: timeRemaining <= 5 ? '#fff1f0' : '#f6ffed',
                padding: '6px 12px',
                borderRadius: '8px',
                border: `1px solid ${getTimerColor()}`,
                minWidth: '80px',
                justifyContent: 'center'
              }}>
                <ClockCircleOutlined 
                  style={{ 
                    color: getTimerColor(),
                    fontSize: '14px'
                  }} 
                />
                <Text 
                  strong 
                  style={{ 
                    color: getTimerColor(),
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  {timeRemaining}s
                </Text>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <Progress 
            percent={getProgressPercent()} 
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
            style={{ 
              margin: '0',
              '.ant-progress-text': {
                fontSize: '12px'
              }
            }}
            format={percent => `${percent}% Complete`}
          />
        </div>

        {/* Chat Messages Area */}
        <div className="chat-messages" style={{ 
          maxHeight: '400px', 
          overflowY: 'auto', 
          padding: '20px', 
          background: '#fafafa', 
          borderRadius: '12px',
          marginBottom: '20px',
          minHeight: '200px',
          border: '1px solid #f0f0f0'
        }}>
          {currentQuestion ? (
            <div className="message message-ai" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Avatar 
                  icon={<RobotOutlined />} 
                  style={{ 
                    background: '#1890ff',
                    flexShrink: 0
                  }} 
                />
                <div style={{ 
                  background: '#ffffff', 
                  padding: '16px 20px', 
                  borderRadius: '12px',
                  maxWidth: '80%',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e8e8e8'
                }}>
                  <Text style={{ fontSize: '15px', lineHeight: '1.6' }}>
                    {currentQuestion}
                  </Text>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px', 
              color: '#999',
              background: '#fff',
              borderRadius: '8px',
              border: '1px dashed #d9d9d9'
            }}>
              <Spin size="large" /> 
              <div style={{ marginTop: '16px', fontSize: '16px' }}>
                Preparing your interview question...
              </div>
            </div>
          )}

          {currentAnswer && (
            <div className="message message-user" style={{ 
              display: 'flex', 
              justifyContent: 'flex-end',
              marginTop: '16px'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '12px', 
                flexDirection: 'row-reverse' 
              }}>
                <Avatar 
                  icon={<UserOutlined />} 
                  style={{ 
                    background: '#52c41a',
                    flexShrink: 0
                  }} 
                />
                <div style={{ 
                  background: '#1890ff', 
                  color: 'white',
                  padding: '16px 20px', 
                  borderRadius: '12px',
                  maxWidth: '80%',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                }}>
                  <Text style={{ color: 'white', fontSize: '15px', lineHeight: '1.6' }}>
                    {currentAnswer}
                  </Text>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Answer Input Area */}
        <div className="answer-input">
          <TextArea
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Type your answer here... Be specific and detailed."
            rows={4}
            disabled={!isActive || !currentQuestion || timeRemaining === 0}
            style={{ 
              marginBottom: '16px',
              borderRadius: '8px',
              fontSize: '15px'
            }}
          />

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {/* Left side - Character count or info */}
            <div style={{ fontSize: '12px', color: '#666' }}>
              {currentAnswer.length > 0 && (
                <span>{currentAnswer.length} characters</span>
              )}
            </div>

            {/* Right side - Submit button */}
            <Button 
              type="primary" 
              icon={isSubmitting ? <CheckOutlined /> : <SendOutlined />}
              onClick={handleSubmitAnswer}
              loading={isSubmitting}
              disabled={!isActive || !currentQuestion || (!currentAnswer.trim() && timeRemaining > 0)}
              size="large"
              style={{
                borderRadius: '8px',
                height: '44px',
                paddingLeft: '24px',
                paddingRight: '24px',
                fontWeight: 'bold'
              }}
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