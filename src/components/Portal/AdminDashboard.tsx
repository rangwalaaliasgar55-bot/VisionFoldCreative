import React, { useState } from 'react';
import { PortalLayout } from './PortalLayout';
import { MessagesTab } from './admin/MessagesTab';
import { PortfolioTab } from './admin/PortfolioTab';
import { ClientsTab } from './admin/ClientsTab';
import { ProjectsTab } from './admin/ProjectsTab';
import { InvoicesTab } from './admin/InvoicesTab';
import { ExpensesTab } from './admin/ExpensesTab';
import { SettingsTab } from './admin/SettingsTab';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

const TABS = [
  { id: 'messages', label: 'Inquiries' },
  { id: 'projects', label: 'Projects' },
  { id: 'clients', label: 'Clients' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'settings', label: 'Site Settings' },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('messages');

  return (
    <PortalLayout tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} onNavigate={onNavigate}>
      {activeTab === 'messages' && <MessagesTab />}
      {activeTab === 'projects' && <ProjectsTab />}
      {activeTab === 'clients' && <ClientsTab />}
      {activeTab === 'invoices' && <InvoicesTab />}
      {activeTab === 'portfolio' && <PortfolioTab />}
      {activeTab === 'expenses' && <ExpensesTab />}
      {activeTab === 'settings' && <SettingsTab />}
    </PortalLayout>
  );
};
