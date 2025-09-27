// src/components/InterviewerTab/InterviewerDashboard.js
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Card, 
  Table, 
  Typography, 
  Space, 
  Tag, 
  Button, 
  Input, 
  Modal,
  Descriptions,
  Timeline,
  Progress
} from 'antd';
import { 
  SearchOutlined, 
  EyeOutlined, 
  TrophyOutlined,
  UserOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DashboardOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;

const InterviewerDashboard = () => {
  const { candidatesList } = useSelector(state => state.candidate);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Filter candidates based on search
  const filteredCandidates = candidatesList.filter(candidate =>
    candidate.name.toLowerCase().includes(searchText.toLowerCase()) ||
    candidate.email.toLowerCase().includes(searchText.toLowerCase())
  );

  // Sort by score (highest first)
  const sortedCandidates = filteredCandidates.sort((a, b) => (b.score || 0) - (a.score || 0));

  const getStatusTag = (status) => {
    const statusConfig = {
      'completed': { color: 'success', icon: <CheckCircleOutlined /> },
      'in-progress': { color: 'processing', icon: <ClockCircleOutlined /> },
      'pending': { color: 'default', icon: <UserOutlined /> }
    };

    const config = statusConfig[status] || statusConfig['pending'];
    return (
      <Tag color={config.color} icon={config.icon}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Tag>
    );
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    if (score >= 40) return '#fa8c16';
    return '#ff4d4f';
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      sorter: (a, b) => (a.score || 0) - (b.score || 0),
      render: (score) => (
        <Space>
          <Text strong style={{ color: getScoreColor(score) }}>
            {score || 0}/100
          </Text>
          <Progress 
            percent={score || 0} 
            size="small" 
            strokeColor={getScoreColor(score)}
            showInfo={false}
            style={{ width: 60 }}
          />
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      filters: [
        { text: 'Completed', value: 'completed' },
        { text: 'In Progress', value: 'in-progress' },
        { text: 'Pending', value: 'pending' }
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => new Date(date || Date.now()).toLocaleDateString(),
      sorter: (a, b) => new Date(a.date || 0) - new Date(b.date || 0),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedCandidate(record);
            setDetailModalVisible(true);
          }}
        >
          View Details
        </Button>
      )
    }
  ];

  return (
    <div className="interviewer-dashboard">
      <div className="dashboard-header">
        <Title level={2}>
          <DashboardOutlined /> Interviewer Dashboard
        </Title>
        <Text type="secondary">
          Manage and review candidate interviews
        </Text>
      </div>

      <Card className="controls-card">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div className="dashboard-stats">
            <Space size="large">
              <div className="stat-item">
                <Text strong>Total Candidates: </Text>
                <Text>{candidatesList.length}</Text>
              </div>
              <div className="stat-item">
                <Text strong>Completed: </Text>
                <Text>{candidatesList.filter(c => c.status === 'completed').length}</Text>
              </div>
              <div className="stat-item">
                <Text strong>In Progress: </Text>
                <Text>{candidatesList.filter(c => c.status === 'in-progress').length}</Text>
              </div>
            </Space>
          </div>

          <Search
            placeholder="Search candidates by name or email"
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Space>
      </Card>

      <Card title="Candidates List" className="candidates-table-card">
        <Table
          columns={columns}
          dataSource={sortedCandidates}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} candidates`
          }}
        />
      </Card>

      {/* Candidate Detail Modal */}
      <Modal
        title={
          <Space>
            <UserOutlined />
            {selectedCandidate?.name} - Interview Details
          </Space>
        }
        visible={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedCandidate && (
          <div className="candidate-detail">
            <Descriptions title="Candidate Information" bordered>
              <Descriptions.Item label="Name">{selectedCandidate.name}</Descriptions.Item>
              <Descriptions.Item label="Email">{selectedCandidate.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{selectedCandidate.phone}</Descriptions.Item>
              <Descriptions.Item label="Status">{getStatusTag(selectedCandidate.status)}</Descriptions.Item>
              <Descriptions.Item label="Final Score">
                <Space>
                  <Text strong style={{ color: getScoreColor(selectedCandidate.score) }}>
                    {selectedCandidate.score || 0}/100
                  </Text>
                  <TrophyOutlined style={{ color: getScoreColor(selectedCandidate.score) }} />
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Interview Date">
                <Space>
                  <CalendarOutlined />
                  {new Date(selectedCandidate.date || Date.now()).toLocaleString()}
                </Space>
              </Descriptions.Item>
            </Descriptions>

            {selectedCandidate.summary && (
              <Card title="AI Evaluation Summary" style={{ marginTop: 16 }}>
                <Text>{selectedCandidate.summary}</Text>
              </Card>
            )}

            {selectedCandidate.interview && selectedCandidate.interview.length > 0 && (
              <Card title="Interview Questions & Answers" style={{ marginTop: 16 }}>
                <Timeline>
                  {selectedCandidate.interview.map((qa, index) => (
                    <Timeline.Item key={index}>
                      <div className="qa-item">
                        <Text strong>Q{index + 1}: </Text>
                        <Text>{qa.question}</Text>
                        <br />
                        <Text strong>Answer: </Text>
                        <Text>{qa.answer}</Text>
                        <br />
                        <Space style={{ marginTop: 8 }}>
                          <Tag color={qa.difficulty === 'easy' ? 'green' : qa.difficulty === 'medium' ? 'orange' : 'red'}>
                            {qa.difficulty?.toUpperCase()}
                          </Tag>
                          <Text strong>Score: {qa.score}/100</Text>
                          <Text type="secondary">Time: {qa.timeSpent}s</Text>
                        </Space>
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InterviewerDashboard;