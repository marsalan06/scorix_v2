import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserLogin } from '../../types';
import { Eye, EyeOff, Lock, Mail, GraduationCap, UserCheck, Plus, Check } from 'lucide-react';
import ScorixLogo from '../common/ScorixLogo';

type UserRole = 'tutor' | 'learner' | 'create';

const Login: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('tutor');
  const [formData, setFormData] = useState<UserLogin>({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const success = await login(formData);
    if (success) {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'create') {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Login Form */}
      <div className="w-1/2 bg-dark-950 flex items-center justify-center p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-start">
            <ScorixLogo size="md" />
          </div>

          {/* Heading */}
          <div className="text-center">
            <h1 className="heading-primary">
              Continue your learning journey with Scorix!
            </h1>
          </div>

          {/* Role Selection Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleRoleSelect('tutor')}
              className={`btn-role ${selectedRole === 'tutor' ? 'active' : ''}`}
            >
              <UserCheck className="w-5 h-5" />
              <span>Sign in as a tutor</span>
            </button>
            
            <button
              onClick={() => handleRoleSelect('learner')}
              className={`btn-role ${selectedRole === 'learner' ? 'active' : ''}`}
            >
              <GraduationCap className="w-5 h-5" />
              <span>Sign in as a learner</span>
            </button>
            
            <button
              onClick={() => handleRoleSelect('create')}
              className={`btn-role ${selectedRole === 'create' ? 'active' : ''}`}
            >
              <Plus className="w-5 h-5" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-white mb-2">
                Registered email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="email"
                  required
                  className="input-field pl-12"
                  placeholder="Type your email"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input-field pl-12 pr-12"
                  placeholder="Type your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex justify-center items-center space-x-2 py-3"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-dark-950"></div>
                ) : (
                  <>
                    <span>Sign In</span>
                    <Check className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-400">
                Forgot password?{' '}
                <Link
                  to="/forgot-password"
                  className="text-accent hover:underline"
                >
                  click here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Right Section - Illustration */}
      <div className="w-1/2 bg-peach-100 flex items-center justify-center p-12">
        <div className="text-center">
          <div className="relative">
            {/* Student with backpack and books */}
            <div className="w-64 h-64 bg-gradient-to-br from-peach-200 to-peach-300 rounded-full flex items-center justify-center mb-8">
              <div className="text-6xl">👩‍🎓</div>
            </div>
            
            {/* Globe background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-200 rounded-full opacity-60"></div>
            
            {/* Educational elements */}
            <div className="absolute bottom-0 right-0 flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-500 rounded-full"></div>
              <div className="w-6 h-6 bg-gray-600 rounded"></div>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-dark-800 mb-2">
            Start Your Learning Journey
          </h3>
          <p className="text-dark-600">
            Access courses, take quizzes, and grow with AI-powered feedback
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
