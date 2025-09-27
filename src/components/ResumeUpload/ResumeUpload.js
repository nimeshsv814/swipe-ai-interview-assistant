// src/components/ResumeUpload/ResumeUpload.js - WITH PROPER CSS IMPORT
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Upload, 
  Button, 
  Card, 
  message, 
  Spin, 
  Progress,
  Typography,
  Space,
  Divider,
  Alert
} from 'antd';
import { 
  UploadOutlined, 
  FileTextOutlined, 
  CheckCircleOutlined,
  LoadingOutlined,
  DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons';

import { pdfService } from '../../services/pdfService';
import { setResumeFile, setExtractedInfo, clearCurrentCandidate } from '../../store/slices/candidateSlice';
import { setLoading, setError, clearError, setCurrentStep } from '../../store/slices/uiSlice';

// Import the CSS file for proper styling
import './ResumeUpload.css';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

const ResumeUpload = () => {
  const dispatch = useDispatch();
  const { resume, extractedInfo } = useSelector(state => state.candidate);
  const { loading, errors } = useSelector(state => state.ui);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (file) => {
    try {
      console.log('Starting file upload:', file.name);

      pdfService.validateFile(file);

      dispatch(clearError('resume'));
      dispatch(setLoading({ type: 'resume', value: true }));
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 200);

      const fileInfo = {
        file,
        name: file.name,
        size: pdfService.formatFileSize(file.size),
        type: pdfService.getFileType(file.name),
        uploadedAt: new Date().toISOString(),
      };

      dispatch(setResumeFile(fileInfo));

      console.log('Extracting resume data...');
      const extractedData = await pdfService.extractResumeData(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      dispatch(setExtractedInfo(extractedData));

      message.success('Resume uploaded and processed successfully!');

      if (extractedData.name && extractedData.email && extractedData.phone) {
        setTimeout(() => {
          dispatch(setCurrentStep('interview'));
        }, 1500);
      } else {
        setTimeout(() => {
          dispatch(setCurrentStep('profile'));
        }, 1500);
      }

    } catch (error) {
      console.error('File upload error:', error);
      message.error(error.message);
      dispatch(setError({ type: 'resume', error: error.message }));
      setUploadProgress(0);

      dispatch(setResumeFile(null));
      dispatch(setExtractedInfo({ name: '', email: '', phone: '' }));
    } finally {
      dispatch(setLoading({ type: 'resume', value: false }));
    }

    return false;
  };

  const handleClearResume = () => {
    console.log('Clearing resume data...');
    dispatch(clearCurrentCandidate());
    dispatch(clearError('resume'));
    setUploadProgress(0);
    message.info('Resume cleared. You can upload a new file.');
  };

  const handleRetry = () => {
    if (resume && resume.file) {
      console.log('Retrying file processing...');
      handleFileUpload(resume.file);
    }
  };

  const uploadProps = {
    name: 'resume',
    multiple: false,
    accept: '.pdf',
    beforeUpload: handleFileUpload,
    showUploadList: false,
  };

  const isProcessing = loading.resume || uploadProgress > 0;

  return (
    <div className="resume-upload">
      <Card className="upload-card">
        <div className="upload-content">
          <Title level={2} className="upload-title">
            Upload Your Resume
          </Title>

          <Paragraph className="upload-description">
            Please upload your resume in PDF format. Our system will extract your 
            basic information and generate personalized interview questions.
          </Paragraph>

          {!resume && !isProcessing && (
            <div className="upload-section">
              <Dragger {...uploadProps} className="upload-dragger">
                <div className="upload-icon-container">
                  <UploadOutlined className="upload-icon" />
                </div>
                <div className="upload-text-container">
                  <p className="upload-main-text">
                    Click or drag your resume to this area to upload
                  </p>
                  <p className="upload-hint-text">
                    Support for PDF files up to 5MB
                  </p>
                </div>
              </Dragger>
            </div>
          )}

          {isProcessing && (
            <div className="upload-processing">
              <Spin 
                indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />}
                tip="Processing your resume..."
              />
              {uploadProgress > 0 && (
                <Progress 
                  percent={uploadProgress} 
                  status={uploadProgress === 100 ? 'success' : 'active'}
                  strokeWidth={8}
                  style={{ marginTop: 24, maxWidth: 350 }}
                />
              )}
            </div>
          )}

          {resume && !isProcessing && (
            <div className="upload-success">
              <div className="success-icon">
                <CheckCircleOutlined style={{ fontSize: 56, color: '#52c41a' }} />
              </div>

              <Title level={4} style={{ color: '#52c41a', margin: '16px 0' }}>
                Resume Uploaded Successfully!
              </Title>

              <Card className="file-info" size="small">
                <div className="file-detail">
                  <FileTextOutlined style={{ color: '#1890ff' }} />
                  <span>{resume.name}</span>
                </div>
                <div className="file-meta">
                  <Text type="secondary">
                    {resume.type} • {resume.size}
                  </Text>
                </div>
              </Card>

              {(extractedInfo.name || extractedInfo.email || extractedInfo.phone) ? (
                <>
                  <Divider />
                  <div className="extracted-info">
                    <Title level={5} style={{ marginBottom: 16 }}>
                      ✅ Extracted Information:
                    </Title>
                    <ul>
                      {extractedInfo.name && (
                        <li><strong>Name:</strong> {extractedInfo.name}</li>
                      )}
                      {extractedInfo.email && (
                        <li><strong>Email:</strong> {extractedInfo.email}</li>
                      )}
                      {extractedInfo.phone && (
                        <li><strong>Phone:</strong> {extractedInfo.phone}</li>
                      )}
                    </ul>
                  </div>
                </>
              ) : (
                <Alert
                  message="Information Extraction"
                  description="We couldn't extract all information automatically. You'll be asked to complete your profile next."
                  type="warning"
                  showIcon
                  style={{ margin: '20px 0', textAlign: 'left' }}
                />
              )}

              <div className="upload-buttons">
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={handleRetry}
                  type="default"
                  size="large"
                >
                  Retry Processing
                </Button>
                <Button 
                  icon={<DeleteOutlined />}
                  onClick={handleClearResume}
                  type="default"
                  size="large"
                  danger
                >
                  Clear & Upload New
                </Button>
              </div>
            </div>
          )}

          {errors.resume && (
            <div className="upload-error">
              <Alert
                message="Upload Error"
                description={errors.resume}
                type="error"
                showIcon
                action={
                  <Button 
                    size="small" 
                    type="text"
                    onClick={() => dispatch(clearError('resume'))}
                  >
                    Dismiss
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ResumeUpload;