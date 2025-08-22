import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserLogin } from '../../types';
import { Eye, EyeOff, Lock, GraduationCap, UserCheck, Plus, Check } from 'lucide-react';
import ScorixLogo from '../common/ScorixLogo';
import toast from 'react-hot-toast';

type UserRole = 'tutor' | 'learner' | 'create';

const Login: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('tutor');
  const [formData, setFormData] = useState<UserLogin>({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Handle redirect using useEffect
  useEffect(() => {
    if (shouldRedirect) {
      navigate('/register');
      // Reset the flag after navigation
      setShouldRedirect(false);
    }
  }, [shouldRedirect, navigate]);

  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      setShouldRedirect(false);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that a role is selected
    if (selectedRole === 'create') {
      toast.error('Please select your role (Tutor or Learner) before logging in');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await login(formData);
      
      if (result.success && result.userRole) {
        // Validate role match
        const expectedRole = selectedRole === 'tutor' ? 'teacher' : 'student';
        const actualRole = result.userRole;
        
        if (expectedRole !== actualRole) {
          // Role mismatch - show error and don't redirect
          toast.error(`Role mismatch! You selected "${selectedRole === 'tutor' ? 'Tutor' : 'Learner'}" but your account is registered as a "${actualRole === 'teacher' ? 'Teacher' : 'Student'}". Please select the correct role.`);
          setLoading(false);
          return;
        }
        
        // Role matches - proceed to dashboard
        toast.success('Login successful!');
        navigate('/dashboard');
      } else if (result.shouldRedirectToRegister) {
        toast.error(result.message || 'User not found. Please create an account first.');
        setShouldRedirect(true);
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
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
              type="button"
              onClick={() => handleRoleSelect('tutor')}
              className={`btn-role ${selectedRole === 'tutor' ? 'active' : ''}`}
            >
              <UserCheck className="w-5 h-5" />
              <span>I am a tutor</span>
            </button>
            
            <button
              type="button"
              onClick={() => handleRoleSelect('learner')}
              className={`btn-role ${selectedRole === 'learner' ? 'active' : ''}`}
            >
              <GraduationCap className="w-5 h-5" />
              <span>I am a learner</span>
            </button>
            
            <button
              type="button"
              onClick={() => handleRoleSelect('create')}
              className={`btn-role ${selectedRole === 'create' ? 'active' : ''}`}
            >
              <Plus className="w-5 h-5" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Selected Role Display */}
          {selectedRole !== 'create' && (
            <div className="text-center p-3 bg-dark-800 rounded-lg border border-accent">
              <p className="text-sm text-gray-300">
                Login as: <span className="text-accent font-semibold">
                  {selectedRole === 'tutor' ? 'Teacher' : 'Student'}
                </span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {selectedRole === 'tutor' 
                  ? 'Access teacher features: courses, questions, grading'
                  : 'Access student features: enrollments, submissions, tests'
                }
              </p>
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-white mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserCheck className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="input-field pl-12"
                  placeholder="Type your username"
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
              <p className="text-sm text-gray-400 mt-2">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="text-accent hover:underline"
                >
                  Register here
                </Link>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Note: Use your username, not your email address
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Make sure to select the correct role that matches your account type
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
