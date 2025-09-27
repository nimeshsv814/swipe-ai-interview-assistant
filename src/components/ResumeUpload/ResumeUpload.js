// src/components/ResumeUpload/ResumeUpload.js - ALWAYS EDITABLE AFTER EXTRACTION
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { 
  Card, 
  Upload, 
  Button, 
  Typography, 
  message, 
  Progress,
  Form,
  Input,
  Alert,
  Space,
  Divider,
  Row,
  Col,
  Steps
} from 'antd';
import { 
  UploadOutlined, 
  FileTextOutlined, 
  CheckCircleOutlined,
  EditOutlined,
  SaveOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  ArrowRightOutlined
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
const { Step } = Steps;

const ResumeUpload = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const [currentStep, setCurrentStepState] = useState(0);
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

      // Extract data from resume
      const extractedData = await pdfService.extractResumeData(file);
      setUploadProgress(80);

      console.log('✅ Extraction result:', extractedData);

      // Save extracted info to Redux
      dispatch(setExtractedInfo(extractedData));
      setExtractedInfoState(extractedData);

      // Pre-fill form with extracted data
      form.setFieldsValue({
        name: extractedData.name || '',
        email: extractedData.email || '',
        phone: extractedData.phone || ''
      });

      setUploadProgress(100);

      // ALWAYS move to edit step - regardless of extraction success
      setCurrentStepState(1);
      message.success('Resume processed! Please review and edit your information below.');

    } catch (error) {
      console.error('❌ Upload error:', error);
      message.error(error.message || 'Failed to process resume');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (values) => {
    try {
      console.log('💾 Saving profile information:', values);

      // Validate required fields
      if (!values.name?.trim() || !values.email?.trim() || !values.phone?.trim()) {
        message.error('Please fill in all required fields');
        return;
      }

      // Clean and format the data
      const cleanedData = {
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim()
      };

      // Ensure phone has +91 prefix if needed
      if (cleanedData.phone.length === 10 && cleanedData.phone.match(/^[6-9]/)) {
        cleanedData.phone = '+91' + cleanedData.phone;
      }

      console.log('👤 Creating candidate with final data:', cleanedData);

      const candidateData = {
        id: Date.now().toString(),
        name: cleanedData.name,
        email: cleanedData.email,
        phone: cleanedData.phone,
        resumeFileName: uploadedFile?.name || 'resume.pdf',
        resumeSize: uploadedFile?.size || 0,
        uploadedAt: new Date().toISOString(),
        status: 'profile-completed',
        extractedInfo: cleanedData,
        originalExtraction: extractedInfo, // Keep original for reference
        isEdited: JSON.stringify(cleanedData) !== JSON.stringify(extractedInfo)
      };

      // Create candidate in Redux store
      dispatch(createCandidate(candidateData));
      dispatch(setCurrentCandidate(candidateData));

      message.success('Profile saved successfully! Starting interview...');

      // Move to interview step
      setTimeout(() => {
        dispatch(setCurrentStep('interview'));
      }, 1000);

    } catch (error) {
      console.error('❌ Profile save error:', error);
      message.error('Failed to save profile information');
    }
  };

  const customRequest = ({ file, onSuccess }) => {
    handleFileUpload(file).then(() => {
      onSuccess();
    }).catch(() => {
      // Error already handled in handleFileUpload
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

  const handleStartOver = () => {
    setCurrentStepState(0);
    setUploadedFile(null);
    setExtractedInfoState(null);
    setUploadProgress(0);
    form.resetFields();
  };

  const getExtractionStatus = () => {
    if (!extractedInfo) return null;

    const foundFields = [];
    const missingFields = [];

    if (extractedInfo.name) foundFields.push('name');
    else missingFields.push('name');

    if (extractedInfo.email) foundFields.push('email'); 
    else missingFields.push('email');

    if (extractedInfo.phone) foundFields.push('phone');
    else missingFields.push('phone');

    if (foundFields.length === 3) {
      return {
        type: 'success',
        message: 'All information extracted successfully',
        description: 'We found your name, email, and phone number. Please review and edit if needed.'
      };
    } else if (foundFields.length > 0) {
      return {
        type: 'warning', 
        message: `Partial extraction: Found ${foundFields.join(', ')}`,
        description: `Please complete the missing fields: ${missingFields.join(', ')}`
      };
    } else {
      return {
        type: 'info',
        message: 'Manual input required',
        description: 'Please enter all your information manually.'
      };
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px' }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Title level={2} style={{ color: '#1890ff' }}>
            Resume Upload & Profile Setup
          </Title>
          <Text type="secondary">
            Upload your resume and review/edit your information before starting the interview
          </Text>
        </div>

        {/* Progress Steps */}
        <Steps current={currentStep} style={{ marginBottom: '30px' }}>
          <Step title="Upload Resume" icon={<FileTextOutlined />} />
          <Step title="Review & Edit" icon={<EditOutlined />} />
          <Step title="Start Interview" icon={<ArrowRightOutlined />} />
        </Steps>

        {/* Step 1: File Upload */}
        {currentStep === 0 && (
          <div>
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
                <br />
                <Text type="secondary">After upload, you'll be able to review and edit all extracted information</Text>
              </p>
            </Dragger>

            {uploading && (
              <div style={{ marginTop: '20px' }}>
                <Progress 
                  percent={uploadProgress} 
                  status="active"
                  format={percent => `${percent}% - ${
                    percent < 30 ? 'Uploading...' :
                    percent < 80 ? 'Extracting information...' : 
                    'Almost done...'
                  }`}
                />
              </div>
            )}
          </div>
        )}

        {/* Step 2: Review & Edit Information */}
        {currentStep === 1 && (
          <div>
            {/* File Upload Success Info */}
            <div style={{ 
              background: '#f6ffed', 
              border: '1px solid #b7eb8f',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px', marginRight: '8px' }} />
              <Text strong>Resume Uploaded: </Text>
              <Text>{uploadedFile?.name}</Text>
              <Text type="secondary"> • {pdfService.formatFileSize(uploadedFile?.size || 0)}</Text>
            </div>

            {/* Extraction Status */}
            {extractedInfo && (
              <Alert
                {...getExtractionStatus()}
                showIcon
                style={{ marginBottom: '20px' }}
              />
            )}

            {/* Always Show Editable Form */}
            <Card 
              title={
                <span>
                  <EditOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                  Review & Edit Your Information
                </span>
              }
              size="small" 
              style={{ background: '#fafafa' }}
            >
              <Alert
                message="Editable Fields"
                description="Please review all information below. You can edit any field before proceeding to the interview."
                type="info"
                showIcon
                style={{ marginBottom: '20px' }}
              />

              <Form
                form={form}
                layout="vertical"
                onFinish={handleSaveProfile}
                size="large"
              >
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      name="name"
                      label={
                        <span>
                          <UserOutlined style={{ marginRight: '4px', color: '#1890ff' }} />
                          Full Name
                        </span>
                      }
                      rules={[
                        { required: true, message: 'Please enter your full name' },
                        { min: 2, message: 'Name must be at least 2 characters' },
                        { max: 50, message: 'Name cannot exceed 50 characters' }
                      ]}
                    >
                      <Input 
                        placeholder="Enter your full name"
                        prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                        size="large"
                      />
                    </Form.Item>
                  </Col>

                  <Col span={24}>
                    <Form.Item
                      name="email"
                      label={
                        <span>
                          <MailOutlined style={{ marginRight: '4px', color: '#1890ff' }} />
                          Email Address
                        </span>
                      }
                      rules={[
                        { required: true, message: 'Please enter your email address' },
                        { type: 'email', message: 'Please enter a valid email address' }
                      ]}
                    >
                      <Input 
                        placeholder="Enter your email address"
                        prefix={<MailOutlined style={{ color: '#1890ff' }} />}
                        size="large"
                      />
                    </Form.Item>
                  </Col>

                  <Col span={24}>
                    <Form.Item
                      name="phone"
                      label={
                        <span>
                          <PhoneOutlined style={{ marginRight: '4px', color: '#1890ff' }} />
                          Phone Number
                        </span>
                      }
                      rules={[
                        { required: true, message: 'Please enter your phone number' },
                        { 
                          validator: (_, value) => {
                            if (!value) return Promise.resolve();

                            const cleaned = value.replace(/[^\d+]/g, '');
                            const patterns = [
                              /^\+91[6-9]\d{9}$/,
                              /^91[6-9]\d{9}$/,
                              /^[6-9]\d{9}$/
                            ];

                            const isValid = patterns.some(pattern => pattern.test(cleaned));

                            if (isValid) {
                              return Promise.resolve();
                            } else {
                              return Promise.reject(new Error('Please enter a valid Indian mobile number'));
                            }
                          }
                        }
                      ]}
                    >
                      <Input 
                        placeholder="Enter phone number (e.g., +919876543210 or 9876543210)"
                        prefix={<PhoneOutlined style={{ color: '#1890ff' }} />}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider />

                <div style={{ textAlign: 'center' }}>
                  <Space size="middle">
                    <Button size="large" onClick={handleStartOver}>
                      Upload Different File
                    </Button>
                    <Button 
                      type="primary" 
                      htmlType="submit"
                      icon={<SaveOutlined />}
                      size="large"
                      style={{
                        height: '44px',
                        paddingLeft: '32px',
                        paddingRight: '32px',
                        fontWeight: 'bold'
                      }}
                    >
                      Save & Start Interview
                    </Button>
                  </Space>
                </div>
              </Form>
            </Card>

            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && extractedInfo && (
              <Card size="small" style={{ marginTop: '16px', background: '#f0f0f0' }}>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  <strong>Debug Info:</strong><br />
                  Extraction Method: {extractedInfo.extractionMethod}<br />
                  Original Data: {JSON.stringify({
                    name: extractedInfo.name || 'not found',
                    email: extractedInfo.email || 'not found', 
                    phone: extractedInfo.phone || 'not found'
                  })}
                </Text>
              </Card>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ResumeUpload;