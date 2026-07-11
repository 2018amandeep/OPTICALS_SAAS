import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export const metadata = {
  title: 'Dashboard - OptiFlow',
  description: 'Manage your patients and optical prescriptions',
};

export default function SubDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
