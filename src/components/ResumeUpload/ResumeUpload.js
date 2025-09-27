// src/components/ResumeUpload/ResumeUpload.js - FIXED CANDIDATE CREATION
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { 
  Card, 
  Upload, 
  Button, 
  Typography, 
  message, 
  Progress,
  List,
  Tag
} from 'antd';
import { 
  UploadOutlined, 
  FileTextOutlined, 
  CheckCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';

import { pdfService } from '../../services/pdfService';
import { 
  setResumeFile, 
  setExtractedInfo,
  createCandidate,
  setCurrentCandidate
} from '../../store/slices/candidateSlice';
import { setCurrentStep } from '../../store/slices/uiSlice';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const ResumeUpload = () => {
  const dispatch = useDispatch();
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedInfo, setExtractedInfoState] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (file) => {
    try {
      setUploading(true);
      setUploadProgress(10);

      console.log('📄 Starting file upload and processing...');

      // Validate file
      pdfService.validateFile(file);
      setUploadProgress(30);

      // Set file in Redux
      dispatch(setResumeFile({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        uploadedAt: new Date().toISOString()
      }));

      setUploadedFile(file);
      setUploadProgress(50);

      console.log('🔍 Extracting resume data...');

      // Extract resume data
      const extractedData = await pdfService.extractResumeData(file);
      setUploadProgress(80);

      console.log('✅ Extracted data:', extractedData);

      // Save extracted info to Redux
      dispatch(setExtractedInfo(extractedData));
      setExtractedInfoState(extractedData);

      // CREATE CANDIDATE RECORD - THIS WAS MISSING!
      console.log('👤 Creating candidate record...');

      const candidateData = {
        name: extractedData.name || 'Unknown Candidate',
        email: extractedData.email || 'no-email@provided.com',
        phone: extractedData.phone || 'No phone provided',
        resumeFileName: file.name,
        resumeSize: file.size,
        uploadedAt: new Date().toISOString(),
        status: 'resume-uploaded',
        extractedInfo: extractedData
      };

      // Create candidate in Redux store
      dispatch(createCandidate(candidateData));

      // Set as current candidate
      dispatch(setCurrentCandidate(candidateData));

      setUploadProgress(100);

      message.success('Resume uploaded and candidate created successfully!');

      // Move to profile completion step
      setTimeout(() => {
        dispatch(setCurrentStep('profile'));
      }, 1000);

    } catch (error) {
      console.error('❌ Upload error:', error);
      message.error(error.message || 'Failed to process resume');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const customRequest = ({ file, onSuccess }) => {
    handleFileUpload(file).then(() => {
      setUploading(false);
      onSuccess();
    }).catch(() => {
      setUploading(false);
    });
  };

  const beforeUpload = (file) => {
    try {
      pdfService.validateFile(file);
      return true;
    } catch (error) {
      message.error(error.message);
      return false;
    }
  };

  const handleRetryProcessing = () => {
    if (uploadedFile) {
      handleFileUpload(uploadedFile);
    }
  };

  const handleClearAndUploadNew = () => {
    setUploadedFile(null);
    setExtractedInfoState(null);
    setUploadProgress(0);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Title level={2} style={{ color: '#1890ff' }}>
            Upload Your Resume
          </Title>
          <Text type="secondary">
            Please upload your resume in PDF format. Our system will extract 
            your basic information and generate personalized interview questions.
          </Text>
        </div>

        {!uploadedFile ? (
          <Dragger
            name="resume"
            multiple={false}
            accept=".pdf"
            customRequest={customRequest}
            beforeUpload={beforeUpload}
            disabled={uploading}
            style={{
              padding: '40px',
              backgroundColor: uploading ? '#f5f5f5' : '#fafafa'
            }}
          >
            <p className="ant-upload-drag-icon">
              <FileTextOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text" style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {uploading ? 'Processing your resume...' : 'Click or drag file to this area to upload'}
            </p>
            <p className="ant-upload-hint" style={{ fontSize: '14px' }}>
              Support for PDF files only. Maximum file size: 10MB
            </p>
          </Dragger>
        ) : (
          <div>
            <div style={{ 
              background: '#f6ffed', 
              border: '1px solid #b7eb8f',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '24px', marginBottom: '8px' }} />
              <Title level={4} style={{ color: '#52c41a', margin: '8px 0' }}>
                Resume Uploaded Successfully!
              </Title>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                <FileTextOutlined />
                <Text strong>{uploadedFile.name}</Text>
                <Text type="secondary">• {pdfService.formatFileSize(uploadedFile.size)}</Text>
              </div>
            </div>

            {uploading && (
              <Progress 
                percent={uploadProgress} 
                status="active"
                style={{ marginBottom: '20px' }}
              />
            )}

            {extractedInfo && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                  <Text strong>Extracted Information:</Text>
                </div>

                <List 
                  size="small"
                  bordered
                  style={{ marginBottom: '20px' }}
                >
                  <List.Item>
                    <Text strong>Name:</Text> {extractedInfo.name}
                  </List.Item>
                  <List.Item>
                    <Text strong>Email:</Text> {extractedInfo.email}
                  </List.Item>
                  <List.Item>
                    <Text strong>Phone:</Text> {extractedInfo.phone}
                  </List.Item>
                </List>

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <Text type="secondary">
                    ✅ Candidate record created successfully!
                  </Text>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
              <Button 
                icon={<ReloadOutlined />}
                onClick={handleRetryProcessing}
                disabled={uploading}
              >
                Retry Processing
              </Button>
              <Button 
                icon={<UploadOutlined />}
                onClick={handleClearAndUploadNew}
                disabled={uploading}
              >
                Clear & Upload New
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ResumeUpload;