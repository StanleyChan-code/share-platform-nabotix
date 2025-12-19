import ApplicationList from '@/components/admin/ApplicationList';

const ApplicationsTab = () => {
  return (
    <div className="space-y-6">
      <ApplicationList variant="my-applications" title="我的申请记录" />
    </div>
  );
};

export default ApplicationsTab;