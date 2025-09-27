// src/components/IntervieweeTab/ProfileCompletion.js
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Form, Input, Button, Typography, Space, Alert } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { updateCandidateInfo } from '../../store/slices/candidateSlice';
import { setCurrentStep } from '../../store/slices/uiSlice';

const { Title, Text } = Typography;

const ProfileCompletion = () => {
  const dispatch = useDispatch();
  const { extractedInfo, missingFields } = useSelector(state => state.candidate);
  const [form] = Form.useForm();

  const handleSubmit = (values) => {
    // Update missing fields
    Object.keys(values).forEach(field => {
      if (values[field]) {
        dispatch(updateCandidateInfo({ field, value: values[field] }));
      }
    });

    // Move to interview step
    dispatch(setCurrentStep('interview'));
  };

  return (
    <div className="profile-completion">
      <Card className="completion-card">
        <Title level={2}>Complete Your Profile</Title>
        <Text type="secondary">
          We need some additional information before starting your interview.
        </Text>

        {missingFields.length > 0 && (
          <Alert
            message="Missing Information"
            description={`Please provide: ${missingFields.join(', ')}`}
            type="warning"
            style={{ margin: '20px 0' }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={extractedInfo}
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: !extractedInfo.name, message: 'Please enter your name' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Enter your full name"
              disabled={!!extractedInfo.name}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: !extractedInfo.email, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="Enter your email address"
              disabled={!!extractedInfo.email}
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[{ required: !extractedInfo.phone, message: 'Please enter your phone number' }]}
          >
            <Input 
              prefix={<PhoneOutlined />} 
              placeholder="Enter your phone number"
              disabled={!!extractedInfo.phone}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block>
              Start Interview
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ProfileCompletion;