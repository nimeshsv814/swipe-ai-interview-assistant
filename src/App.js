// src/App.js - FIXED VERSION
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ConfigProvider, Layout, Tabs, Button } from 'antd';
import { UserOutlined, DashboardOutlined, ReloadOutlined } from '@ant-design/icons';

import IntervieweeTab from './components/IntervieweeTab/IntervieweeTab';
import InterviewerDashboard from './components/InterviewerTab/InterviewerDashboard';
import WelcomeBackModal from './components/common/WelcomeBackModal';
import { setActiveTab, setShowWelcomeModal } from './store/slices/uiSlice';

import './App.css';

const { Header, Content } = Layout;
const { TabPane } = Tabs;

const App = () => {
  const dispatch = useDispatch();
  const { activeTab, showWelcomeModal } = useSelector(state => state.ui);
  const { currentCandidate } = useSelector(state => state.candidate);
  const { isActive, isCompleted } = useSelector(state => state.interview);

  useEffect(() => {
    // Check if there's an interrupted session
    if (currentCandidate && isActive && !isCompleted) {
      dispatch(setShowWelcomeModal(true));
    }
  }, [currentCandidate, isActive, isCompleted, dispatch]);

  const handleTabChange = (key) => {
    dispatch(setActiveTab(key));
  };

  const handleRestart = () => {
    window.location.reload();
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <Layout className="app-layout">
        <Header className="app-header">
          <div className="header-content">
            <h1 className="app-title">Swipe AI-Interview Assistant</h1>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRestart}
              type="text"
              className="restart-btn"
            >
              Restart Session
            </Button>
          </div>
        </Header>

        <Content className="app-content">
          <div className="content-wrapper">
            <Tabs 
              activeKey={activeTab}
              onChange={handleTabChange}
              size="large"
              className="main-tabs"
            >
              <TabPane
                tab={
                  <span>
                    <UserOutlined />
                    Interviewee
                  </span>
                }
                key="interviewee"
              >
                <IntervieweeTab />
              </TabPane>

              <TabPane
                tab={
                  <span>
                    <DashboardOutlined />
                    Interviewer Dashboard
                  </span>
                }
                key="interviewer"
              >
                <InterviewerDashboard />
              </TabPane>
            </Tabs>
          </div>
        </Content>

        <WelcomeBackModal 
          visible={showWelcomeModal}
          onClose={() => dispatch(setShowWelcomeModal(false))}
        />
      </Layout>
    </ConfigProvider>
  );
};

export default App;