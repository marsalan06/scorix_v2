import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  HelpCircle, 
  FileText, 
  GraduationCap, 
  Plus,
  Users
} from 'lucide-react';
import { coursesAPI, questionsAPI, testsAPI } from '../../services/api';
import { Course, Question, Test } from '../../types';

const TeacherDashboard: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [coursesRes, questionsRes, testsRes] = await Promise.all([
        coursesAPI.getTeacherCourses(),
        questionsAPI.getTeacherQuestions(),
        testsAPI.getTeacherTests(),
      ]);
      
      setCourses(coursesRes.data);
      setQuestions(questionsRes.data);
      setTests(testsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      name: 'Total Courses',
      value: courses.length,
      icon: BookOpen,
      color: 'bg-blue-500',
      href: '/dashboard/courses',
    },
    {
      name: 'Total Questions',
      value: questions.length,
      icon: HelpCircle,
      color: 'bg-green-500',
      href: '/dashboard/questions',
    },
    {
      name: 'Total Tests',
      value: tests.length,
      icon: FileText,
      color: 'bg-purple-500',
      href: '/dashboard/tests',
    },
    {
      name: 'Students Enrolled',
      value: courses.reduce((acc, course) => acc + course.student_ids.length, 0),
      icon: Users,
      color: 'bg-orange-500',
      href: '/dashboard/courses',
    },
  ];

  const quickActions = [
    {
      name: 'Create Course',
      description: 'Add a new course for your students',
      icon: Plus,
      href: '/dashboard/courses/new',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'Create Question',
      description: 'Add a new question with marking scheme',
      icon: Plus,
      href: '/dashboard/questions/new',
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      name: 'Create Test',
      description: 'Build a new test with questions',
      icon: Plus,
      href: '/dashboard/tests/new',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      name: 'Grade Answers',
      description: 'Use AI to grade student submissions',
      icon: GraduationCap,
      href: '/dashboard/grading',
      color: 'bg-orange-600 hover:bg-orange-700',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, Teacher!</h1>
        <p className="text-primary-100 mt-2">
          Manage your courses, create questions, and grade student answers with AI-powered assistance.
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
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
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

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Courses */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Courses</h3>
          {courses.length > 0 ? (
            <div className="space-y-3">
              {courses.slice(0, 3).map((course) => (
                <div key={course.id} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                  <div>
                    <h4 className="font-medium text-white">{course.title}</h4>
                    <p className="text-sm text-gray-300">{course.subject}</p>
                  </div>
                  <span className="text-sm text-gray-400">{course.student_ids.length} students</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No courses yet</p>
          )}
        </div>

        {/* Recent Questions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Questions</h3>
          {questions.length > 0 ? (
            <div className="space-y-3">
              {questions.slice(0, 3).map((question) => (
                <div key={question.id} className="p-3 bg-dark-800 rounded-lg">
                  <h4 className="font-medium text-white line-clamp-2">{question.question}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-300 capitalize">{question.difficulty_level}</span>
                    <span className="text-sm text-gray-400">{question.points} points</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No questions yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
