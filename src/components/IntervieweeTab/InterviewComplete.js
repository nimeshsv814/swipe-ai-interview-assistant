// src/components/IntervieweeTab/InterviewComplete.js
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Result, Button, Typography, Divider, Space, Progress } from 'antd';
import { CheckCircleOutlined, TrophyOutlined, ReloadOutlined } from '@ant-design/icons';
import { resetInterview } from '../../store/slices/interviewSlice';
import { clearCurrentCandidate } from '../../store/slices/candidateSlice';
import { resetUI, setCurrentStep } from '../../store/slices/uiSlice';

const { Title, Text, Paragraph } = Typography;

const InterviewComplete = () => {
  const dispatch = useDispatch();
  const { finalScore, finalSummary } = useSelector(state => state.interview);
  const { currentCandidate } = useSelector(state => state.candidate);

  const handleStartNewInterview = () => {
    dispatch(resetInterview());
    dispatch(clearCurrentCandidate());
    dispatch(resetUI());
    dispatch(setCurrentStep('upload'));
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    if (score >= 40) return '#fa8c16';
    return '#ff4d4f';
  };

  const getPerformanceText = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="interview-complete">
      <Card className="completion-card">
        <Result
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          title="Interview Completed Successfully!"
          subTitle={`Thank you ${currentCandidate?.name || 'Candidate'}, your interview has been submitted.`}
        />

        <Divider />

        <div className="score-section">
          <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
            <TrophyOutlined style={{ color: getScoreColor(finalScore), marginRight: 8 }} />
            Your Final Score
          </Title>

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Progress
              type="circle"
              percent={finalScore}
              strokeColor={getScoreColor(finalScore)}
              format={percent => `${percent}/100`}
              size={120}
            />
            <div style={{ marginTop: 12 }}>
              <Text strong style={{ fontSize: 18, color: getScoreColor(finalScore) }}>
                {getPerformanceText(finalScore)} Performance
              </Text>
            </div>
          </div>

          {finalSummary && (
            <Card title="AI Evaluation Summary" size="small">
              <Paragraph>{finalSummary}</Paragraph>
            </Card>
          )}
        </div>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Space direction="vertical" size="middle">
            <Text type="secondary">
              Your interview results have been saved and are available in the Interviewer Dashboard.
            </Text>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={handleStartNewInterview}
              size="large"
            >
              Start New Interview
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default InterviewComplete;