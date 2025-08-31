import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';
import TeacherDashboard from './dashboard/TeacherDashboard';
import StudentDashboard from './dashboard/StudentDashboard';
import AdminDashboard from './dashboard/AdminDashboard';
import CourseManagement from './courses/CourseManagement';
import StudentCourses from './courses/StudentCourses';
import QuestionManagement from './questions/QuestionManagement';
import TestManagement from './tests/TestManagement';
import StudentTests from './tests/StudentTests';
import GradingInterface from './grading/GradingInterface';
import StudentAnswers from './answers/StudentAnswers';
import Profile from './profile/Profile';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return null;
  }

  const getDashboardContent = () => {
    switch (user.role) {
      case 'teacher':
        return <TeacherDashboard />;
      case 'student':
        return <StudentDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <TeacherDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={getDashboardContent()} />
              <Route path="/courses" element={
                user.role === 'student' ? <StudentCourses /> : <CourseManagement />
              } />
              <Route path="/questions" element={
                user.role !== 'student' ? <QuestionManagement /> : null
              } />
              <Route path="/tests" element={
                user.role === 'student' ? <StudentTests /> : <TestManagement />
              } />
              <Route path="/grading" element={
                user.role !== 'student' ? <GradingInterface /> : null
              } />
              <Route path="/answers" element={<StudentAnswers />} />
              <Route path="/profile" element={<Profile />} />
              
              {/* Dashboard-specific routes to match sidebar navigation */}
              <Route path="/dashboard" element={getDashboardContent()} />
              <Route path="/dashboard/courses" element={
                user.role === 'student' ? <StudentCourses /> : <CourseManagement />
              } />
              <Route path="/dashboard/questions" element={
                user.role !== 'student' ? <QuestionManagement /> : null
              } />
              <Route path="/dashboard/tests" element={
                user.role === 'student' ? <StudentTests /> : <TestManagement />
              } />
              <Route path="/dashboard/grading" element={
                user.role !== 'student' ? <GradingInterface /> : null
              } />
              <Route path="/dashboard/answers" element={<StudentAnswers />} />
              <Route path="/dashboard/profile" element={<Profile />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
