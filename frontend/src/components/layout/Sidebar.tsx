import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, 
  BookOpen, 
  HelpCircle, 
  FileText, 
  GraduationCap, 
  Users, 
  Settings, 
  LogOut,
  X
} from 'lucide-react';
import ScorixLogo from '../common/ScorixLogo';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, end: true },
    { name: 'Courses', href: '/dashboard/courses', icon: BookOpen },
    { name: 'Questions', href: '/dashboard/questions', icon: HelpCircle },
    { name: 'Tests', href: '/dashboard/tests', icon: FileText },
    { name: 'Grading', href: '/dashboard/grading', icon: GraduationCap },
    { name: 'Student Answers', href: '/dashboard/answers', icon: Users },
    { name: 'Profile', href: '/dashboard/profile', icon: Settings },
  ];

  const studentNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, end: true },
    { name: 'My Courses', href: '/dashboard/courses', icon: BookOpen },
    { name: 'Tests', href: '/dashboard/tests', icon: FileText },
    { name: 'My Answers', href: '/dashboard/answers', icon: Users },
    { name: 'Profile', href: '/dashboard/profile', icon: Settings },
  ];

  const adminNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, end: true },
    { name: 'All Courses', href: '/dashboard/courses', icon: BookOpen },
    { name: 'All Questions', href: '/dashboard/questions', icon: HelpCircle },
    { name: 'All Tests', href: '/dashboard/tests', icon: FileText },
    { name: 'Grading', href: '/dashboard/grading', icon: GraduationCap },
    { name: 'All Answers', href: '/dashboard/answers', icon: Users },
    { name: 'Profile', href: '/dashboard/profile', icon: Settings },
  ];

  const getNavigation = () => {
    switch (user?.role) {
      case 'student':
        return studentNavigation;
      case 'admin':
        return adminNavigation;
      default:
        return navigation;
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${open ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-dark-950 bg-opacity-75" onClick={() => setOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-dark-900">
          <div className="flex h-16 items-center justify-between px-4 border-b border-dark-800">
            <div className="flex items-center">
              <ScorixLogo size="sm" />
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {getNavigation().map((item) => (
              <div
                key={item.name}
                onClick={() => setOpen(false)}
              >
                <NavLink
                  to={item.href}
                  end={item.end}
                  className={({ isActive }) => 
                    `sidebar-item ${isActive ? 'active' : ''}`
                  }
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  <span>{item.name}</span>
                </NavLink>
              </div>
            ))}
          </nav>
          <div className="border-t border-dark-800 p-4">
            <button
              onClick={handleLogout}
              className="sidebar-item w-full text-left"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-dark-800 bg-dark-900">
          <div className="flex h-16 items-center px-4 border-b border-dark-800">
            <ScorixLogo size="sm" />
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {getNavigation().map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.end}
                className={({ isActive }) => 
                  `sidebar-item ${isActive ? 'active' : ''}`
                }
              >
                <item.icon className="mr-3 h-5 w-5" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-dark-800 p-4">
            <button
              onClick={handleLogout}
              className="sidebar-item w-full text-left"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
