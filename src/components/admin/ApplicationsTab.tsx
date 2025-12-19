import React from 'react';
import ApplicationList from './ApplicationList';

const ApplicationsTab: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <ApplicationList variant="my-applications" title="我的申请记录" />
    </div>
  );
};

export default ApplicationsTab;