
import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import ProfileSection from '@/components/ProfileSection';
import ProjectInvite from '@/components/ProjectInvite';

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-600">Manage your account and project settings</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileSection />
          <ProjectInvite />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
