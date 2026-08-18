import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { AcademicPage } from './pages/AcademicPage';
import { StudentsPage } from './pages/StudentsPage';
import { AttendancePage } from './pages/AttendancePage';
import { GradesPage } from './pages/GradesPage';
import { FeesPage } from './pages/FeesPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { LibraryPage } from './pages/LibraryPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="academic" element={<AcademicPage />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="grades" element={<GradesPage />} />
              <Route path="fees" element={<FeesPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="library" element={<LibraryPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};
