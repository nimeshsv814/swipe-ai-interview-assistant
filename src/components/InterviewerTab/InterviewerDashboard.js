// src/components/InterviewerTab/InterviewerDashboard.js - FIXED DATA DISPLAY
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Card, 
  Table, 
  Typography, 
  Tag, 
  Button, 
  Modal, 
  Descriptions,
  List,
  Empty,
  Space,
  Input,
  Select,
  Statistic,
  Row,
  Col
} from 'antd';
import { 
  UserOutlined, 
  TrophyOutlined, 
  ClockCircleOutlined,
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined
} from '@ant-design/icons';

import { loadCandidatesFromStorage } from '../../store/slices/candidateSlice';

const { Title, Text } = Typography;
const { Option } = Select;

const InterviewerDashboard = () => {
  const dispatch = useDispatch();
  const { candidatesList = [] } = useSelector(state => state.candidate || {});

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Load candidates on component mount
  useEffect(() => {
    console.log('📊 Loading dashboard data...');
    console.log('Current candidates in Redux:', candidatesList);

    // Try to load from localStorage if Redux is empty
    if (candidatesList.length === 0) {
      const persistedData = localStorage.getItem('persist:root');
      if (persistedData) {
        try {
          const parsed = JSON.parse(persistedData);
          if (parsed.candidate) {
            const candidateData = JSON.parse(parsed.candidate);
            if (candidateData.candidatesList && candidateData.candidatesList.length > 0) {
              console.log('📥 Loading candidates from localStorage:', candidateData.candidatesList);
              dispatch(loadCandidatesFromStorage(candidateData.candidatesList));
            }
          }
        } catch (error) {
          console.error('Error loading persisted data:', error);
        }
      }
    }
  }, [dispatch, candidatesList.length]);

  // Filter and search candidates
  const filteredCandidates = candidatesList.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'completed' && candidate.status === 'interview-completed') ||
                         (statusFilter === 'pending' && candidate.status !== 'interview-completed');

    return matchesSearch && matchesStatus;
  });

  // Sort by final score (completed interviews first, then by score)
  const sortedCandidates = filteredCandidates.sort((a, b) => {
    // Completed interviews first
    if (a.status === 'interview-completed' && b.status !== 'interview-completed') return -1;
    if (b.status === 'interview-completed' && a.status !== 'interview-completed') return 1;

    // Then by score (highest first)
    const aScore = a.finalScore || 0;
    const bScore = b.finalScore || 0;
    return bScore - aScore;
  });

  const handleViewDetails = (candidate) => {
    setSelectedCandidate(candidate);
    setShowDetails(true);
  };

  const getStatusTag = (status, finalScore) => {
    if (status === 'interview-completed') {
      const color = finalScore >= 80 ? 'green' : 
                   finalScore >= 60 ? 'blue' : 
                   finalScore >= 40 ? 'orange' : 'red';
      return <Tag color={color}>Completed ({finalScore}%)</Tag>;
    }
    return <Tag color="orange">Pending</Tag>;
  };

  const getPerformanceLabel = (score) => {
    if (score >= 80) return { label: 'Excellent', color: 'green' };
    if (score >= 60) return { label: 'Good', color: 'blue' };
    if (score >= 40) return { label: 'Fair', color: 'orange' };
    return { label: 'Needs Improvement', color: 'red' };
  };

  // Calculate dashboard statistics
  const totalCandidates = candidatesList.length;
  const completedInterviews = candidatesList.filter(c => c.status === 'interview-completed').length;
  const pendingInterviews = totalCandidates - completedInterviews;
  const averageScore = completedInterviews > 0 ? 
    Math.round(candidatesList.filter(c => c.finalScore).reduce((sum, c) => sum + c.finalScore, 0) / completedInterviews) : 0;

  const columns = [
    {
      title: 'Rank',
      key: 'rank',
      width: 60,
      render: (_, __, index) => (
        <div style={{ textAlign: 'center' }}>
          {index < 3 ? (
            <TrophyOutlined style={{ 
              color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32',
              fontSize: '16px'
            }} />
          ) : (
            <Text type="secondary">{index + 1}</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Candidate',
      key: 'candidate',
      render: (candidate) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{candidate.name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{candidate.email}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{candidate.phone}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 150,
      render: (candidate) => getStatusTag(candidate.status, candidate.finalScore),
    },
    {
      title: 'Score',
      key: 'score',
      width: 100,
      sorter: (a, b) => (a.finalScore || 0) - (b.finalScore || 0),
      render: (candidate) => {
        if (candidate.finalScore !== undefined) {
          const performance = getPerformanceLabel(candidate.finalScore);
          return (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: performance.color }}>
                {candidate.finalScore}%
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>
                {performance.label}
              </div>
            </div>
          );
        }
        return <Text type="secondary">-</Text>;
      },
    },
    {
      title: 'Interview Date',
      key: 'date',
      width: 120,
      render: (candidate) => {
        if (candidate.interviewCompletedAt) {
          const date = new Date(candidate.interviewCompletedAt);
          return (
            <div>
              <div>{date.toLocaleDateString()}</div>
              <div style={{ fontSize: '11px', color: '#666' }}>
                {date.toLocaleTimeString()}
              </div>
            </div>
          );
        }
        return <Text type="secondary">Not completed</Text>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (candidate) => (
        <Button 
          type="primary" 
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(candidate)}
        >
          View
        </Button>
      ),
    },
  ];

  const refreshData = () => {
    window.location.reload();
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <UserOutlined style={{ marginRight: '8px' }} />
          Interviewer Dashboard
        </Title>
        <Text type="secondary">
          Manage and review candidate interviews
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Candidates"
              value={totalCandidates}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Completed Interviews"
              value={completedInterviews}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Interviews"
              value={pendingInterviews}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Average Score"
              value={averageScore}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: averageScore >= 70 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Search */}
      <Card style={{ marginBottom: '20px' }}>
        <Space>
          <Input
            placeholder="Search candidates..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 200 }}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            prefix={<FilterOutlined />}
          >
            <Option value="all">All Status</Option>
            <Option value="completed">Completed</Option>
            <Option value="pending">Pending</Option>
          </Select>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={refreshData}
          >
            Refresh
          </Button>
        </Space>
      </Card>

      {/* Candidates Table */}
      <Card>
        {sortedCandidates.length > 0 ? (
          <Table
            columns={columns}
            dataSource={sortedCandidates}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="middle"
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                No candidates found
                <br />
                <Text type="secondary">Complete some interviews to see results here</Text>
              </span>
            }
          >
            <Button type="primary" onClick={refreshData}>
              Refresh Data
            </Button>
          </Empty>
        )}
      </Card>

      {/* Candidate Details Modal */}
      <Modal
        title={
          <div>
            <UserOutlined style={{ marginRight: '8px' }} />
            {selectedCandidate?.name} - Interview Details
          </div>
        }
        visible={showDetails}
        onCancel={() => setShowDetails(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setShowDetails(false)}>
            Close
          </Button>
        ]}
      >
        {selectedCandidate && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Name">{selectedCandidate.name}</Descriptions.Item>
              <Descriptions.Item label="Email">{selectedCandidate.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{selectedCandidate.phone}</Descriptions.Item>
              <Descriptions.Item label="Resume">
                {selectedCandidate.resumeFileName || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {getStatusTag(selectedCandidate.status, selectedCandidate.finalScore)}
              </Descriptions.Item>
              <Descriptions.Item label="Final Score">
                {selectedCandidate.finalScore ? selectedCandidate.finalScore + '%' : 'N/A'}
              </Descriptions.Item>
            </Descriptions>

            {selectedCandidate.interviewResults && (
              <div style={{ marginTop: '20px' }}>
                <Title level={4}>Interview Summary</Title>
                <Text>{selectedCandidate.interviewResults.finalSummary}</Text>

                {selectedCandidate.interviewResults.interviewData && 
                 selectedCandidate.interviewResults.interviewData.questions && (
                  <div style={{ marginTop: '16px' }}>
                    <Title level={5}>Questions & Answers</Title>
                    <List
                      size="small"
                      bordered
                      dataSource={selectedCandidate.interviewResults.interviewData.questions}
                      renderItem={(question, index) => {
                        const answer = selectedCandidate.interviewResults.interviewData.answers?.[index];
                        return (
                          <List.Item>
                            <div style={{ width: '100%' }}>
                              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                                Q{index + 1}: {question.question || question}
                              </div>
                              {answer && (
                                <div>
                                  <div style={{ marginBottom: '4px' }}>
                                    <Text type="secondary">Answer: </Text>
                                    {answer.answer}
                                  </div>
                                  <div>
                                    <Tag color={answer.score >= 70 ? 'green' : answer.score >= 50 ? 'orange' : 'red'}>
                                      Score: {answer.score}%
                                    </Tag>
                                    <Tag>{answer.difficulty}</Tag>
                                  </div>
                                </div>
                              )}
                            </div>
                          </List.Item>
                        );
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Debug Info (only show in development) */}
      {process.env.NODE_ENV === 'development' && (
        <Card style={{ marginTop: '20px', background: '#f0f0f0' }} size="small">
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Debug: {candidatesList.length} candidates in Redux store
          </Text>
        </Card>
      )}
    </div>
  );
};

export default InterviewerDashboard;