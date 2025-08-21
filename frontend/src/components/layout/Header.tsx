import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, Bell, User } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="bg-dark-900 shadow-sm border-b border-dark-800">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-dark-800"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Page title */}
        <div className="flex-1 lg:flex-none">
          <h1 className="text-xl font-semibold text-white">Scorix Dashboard</h1>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="p-2 text-gray-400 hover:text-white hover:bg-dark-800 rounded-md">
            <Bell className="h-5 w-5" />
          </button>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 p-2 text-sm text-gray-300 hover:text-white hover:bg-dark-800 rounded-md"
            >
              <div className="h-8 w-8 bg-primary-500 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <span className="hidden sm:block font-medium">
                {user?.first_name} {user?.last_name}
              </span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-dark-800 rounded-md shadow-lg py-1 z-50 border border-dark-700">
                <div className="px-4 py-2 text-sm text-gray-300 border-b border-dark-700">
                  <div className="font-medium text-white">{user?.first_name} {user?.last_name}</div>
                  <div className="text-gray-400 capitalize">{user?.role}</div>
                </div>
                <a
                  href="/dashboard/profile"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-700 hover:text-white"
                >
                  Your Profile
                </a>
                <a
                  href="/dashboard/settings"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-700 hover:text-white"
                >
                  Settings
                </a>
                <div className="border-t border-dark-700">
                  <button
                    onClick={() => logout()}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-dark-700 hover:text-white"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
