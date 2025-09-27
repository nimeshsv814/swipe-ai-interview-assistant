// src/components/common/WelcomeBackModal.js
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, Button, Typography, Space, Card } from 'antd';
import { PlayCircleOutlined, StopOutlined, UserOutlined } from '@ant-design/icons';
import { resumeInterview, resetInterview } from '../../store/slices/interviewSlice';
import { clearCurrentCandidate } from '../../store/slices/candidateSlice';
import { resetUI, setCurrentStep } from '../../store/slices/uiSlice';

const { Title, Text } = Typography;

const WelcomeBackModal = ({ visible, onClose }) => {
  const dispatch = useDispatch();
  const { currentCandidate } = useSelector(state => state.candidate);
  const { questionIndex } = useSelector(state => state.interview);

  const handleResumeInterview = () => {
    dispatch(resumeInterview());
    dispatch(setCurrentStep('interview'));
    onClose();
  };

  const handleStartNewInterview = () => {
    dispatch(resetInterview());
    dispatch(clearCurrentCandidate());
    dispatch(resetUI());
    dispatch(setCurrentStep('upload'));
    onClose();
  };

  return (
    <Modal
      title="Welcome Back!"
      visible={visible}
      onCancel={onClose}
      footer={null}
      centered
      width={500}
    >
      <div style={{ textAlign: 'center' }}>
        <UserOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />

        <Title level={3}>Resume Your Interview</Title>

        <Text type="secondary">
          We found an unfinished interview session for {currentCandidate?.name || 'this candidate'}.
        </Text>

        <Card style={{ margin: '20px 0', textAlign: 'left' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Candidate: </Text>
              <Text>{currentCandidate?.name}</Text>
            </div>
            <div>
              <Text strong>Progress: </Text>
              <Text>Question {questionIndex + 1} of 6</Text>
            </div>
            <div>
              <Text strong>Status: </Text>
              <Text>Interview in progress</Text>
            </div>
          </Space>
        </Card>

        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          Would you like to continue where you left off or start a new interview?
        </Text>

        <Space direction="vertical" style={{ width: '100%' }}>
          <Button 
            type="primary" 
            icon={<PlayCircleOutlined />}
            onClick={handleResumeInterview}
            size="large"
            block
          >
            Resume Interview
          </Button>

          <Button 
            icon={<StopOutlined />}
            onClick={handleStartNewInterview}
            size="large"
            block
          >
            Start New Interview
          </Button>
        </Space>
      </div>
    </Modal>
  );
};

export default WelcomeBackModal;