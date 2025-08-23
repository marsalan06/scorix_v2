import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  HelpCircle, 
  FileText, 
  GraduationCap,
  Settings,
  Shield,
  TrendingUp
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const stats = [
    {
      name: 'Total Users',
      value: '150+',
      icon: Users,
      color: 'bg-blue-500',
      href: '/dashboard/users',
    },
    {
      name: 'Total Courses',
      value: '25+',
      icon: BookOpen,
      color: 'bg-green-500',
      href: '/dashboard/courses',
    },
    {
      name: 'Total Questions',
      value: '500+',
      icon: HelpCircle,
      color: 'bg-purple-500',
      href: '/dashboard/questions',
    },
    {
      name: 'Total Tests',
      value: '100+',
      icon: FileText,
      color: 'bg-orange-500',
      href: '/dashboard/tests',
    },
  ];

  const quickActions = [
    {
      name: 'User Management',
      description: 'Manage all users and their roles',
      icon: Users,
      href: '/dashboard/users',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'System Settings',
      description: 'Configure system-wide settings',
      icon: Settings,
      href: '/dashboard/settings',
      color: 'bg-gray-600 hover:bg-gray-700',
    },
    {
      name: 'Analytics',
      description: 'View system analytics and reports',
      icon: TrendingUp,
      href: '/dashboard/analytics',
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      name: 'Security',
      description: 'Manage security and permissions',
      icon: Shield,
      href: '/dashboard/security',
      color: 'bg-red-600 hover:bg-red-700',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-purple-100 mt-2">
          Full system access and management capabilities for the Scorix platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="card hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">{stat.name}</p>
                <p className="text-2xl font-semibold text-white">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Administrative Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className={`${action.color} text-white p-4 rounded-lg hover:shadow-lg transition-all`}
            >
              <div className="flex items-center">
                <action.icon className="h-8 w-8 mr-3" />
                <div>
                  <h3 className="font-semibold">{action.name}</h3>
                  <p className="text-sm opacity-90">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">System Health</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-white">API Status</span>
              </div>
              <span className="text-sm text-green-400 font-medium">Healthy</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-white">Database</span>
              </div>
              <span className="text-sm text-green-400 font-medium">Connected</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-white">AI Grading</span>
              </div>
              <span className="text-sm text-green-400 font-medium">Active</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Recent System Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-dark-800 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm text-white">New user registration</p>
                <p className="text-xs text-gray-400">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-dark-800 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm text-white">Course created</p>
                <p className="text-xs text-gray-400">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-dark-800 rounded-lg">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm text-white">AI grading completed</p>
                <p className="text-xs text-gray-400">1 hour ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/dashboard/courses"
            className="flex items-center p-3 border border-dark-700 rounded-lg hover:bg-dark-800 transition-colors"
          >
            <BookOpen className="h-5 w-5 text-blue-400 mr-3" />
            <span className="text-sm font-medium text-white">Manage Courses</span>
          </Link>
          <Link
            to="/dashboard/questions"
            className="flex items-center p-3 border border-dark-700 rounded-lg hover:bg-dark-800 transition-colors"
          >
            <HelpCircle className="h-5 w-5 text-green-400 mr-3" />
            <span className="text-sm font-medium text-white">Manage Questions</span>
          </Link>
          <Link
            to="/dashboard/grading"
            className="flex items-center p-3 border border-dark-700 rounded-lg hover:bg-dark-800 transition-colors"
          >
            <GraduationCap className="h-5 w-5 text-purple-400 mr-3" />
            <span className="text-sm font-medium text-white">Grading System</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
