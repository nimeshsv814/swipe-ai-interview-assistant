// src/components/IntervieweeTab/IntervieweeTab.js
import React from 'react';
import { useSelector } from 'react-redux';
import ResumeUpload from '../ResumeUpload/ResumeUpload';
import ProfileCompletion from './ProfileCompletion';
import ChatInterface from '../Chat/ChatInterface';
import InterviewComplete from './InterviewComplete';

const IntervieweeTab = () => {
  const { currentStep } = useSelector(state => state.ui);
  const { isCompleted } = useSelector(state => state.interview);

  const renderCurrentStep = () => {
    if (isCompleted) {
      return <InterviewComplete />;
    }

    switch (currentStep) {
      case 'upload':
        return <ResumeUpload />;
      case 'profile':
        return <ProfileCompletion />;
      case 'interview':
        return <ChatInterface />;
      case 'completed':
        return <InterviewComplete />;
      default:
        return <ResumeUpload />;
    }
  };

  return (
    <div className="interviewee-tab">
      {renderCurrentStep()}
    </div>
  );
};

export default IntervieweeTab;