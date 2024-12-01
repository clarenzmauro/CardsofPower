import React, { useState } from 'react';
import './DevPage.css';
import WorkshopEntries from './WorkshopEntries';
import UsersEntries from './UsersEntries';
import ReportsEntries from './ReportsEntries';
import MailEntries from './MailEntries';

const DevPage = () => {
  const [activeTab, setActiveTab] = useState('gameData');

  const tabs = [
    { id: 'gameData', label: 'Game Data' },
    { id: 'usersData', label: 'Users Data' },
    { id: 'workshop', label: 'Workshop' },
    { id: 'reports', label: 'Reports' },
    { id: 'mail', label: 'Mail' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'workshop':
        return <WorkshopEntries />;
      case 'usersData':
        return <UsersEntries />;
      case 'reports':
        return <ReportsEntries />;
      case 'mail':
        return <MailEntries />;
      default:
        return <div>Content for {activeTab}</div>;
    }
  };

  return (
    <div>
      <div className="nav-container">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="content-area">
        {renderContent()}
      </div>
    </div>
  );
};

export default DevPage;
