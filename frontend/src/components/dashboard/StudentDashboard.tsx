import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  FileText, 
  Clock, 
  CheckCircle
} from 'lucide-react';
import { coursesAPI, testsAPI, studentAnswersAPI } from '../../services/api';
import { Course, Test, StudentAnswer } from '../../types';
import toast from 'react-hot-toast';

const StudentDashboard: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [coursesRes, answersRes] = await Promise.all([
          coursesAPI.getStudentCourses(),
          studentAnswersAPI.getStudentAnswers(),
        ]);
        
        setCourses(coursesRes.data ?? []);
        setAnswers(answersRes.data ?? []);
        
        // Fetch tests for all student's courses
        if (coursesRes.data && coursesRes.data.length > 0) {
          const allTests = [];
          for (const course of coursesRes.data) {
            try {
              const testsRes = await testsAPI.getCourseTests(course.id);
              if (testsRes.data) {
                allTests.push(...testsRes.data);
              }
            } catch (error) {
              console.error(`Failed to fetch tests for course ${course.id}:`, error);
            }
          }
          setTests(allTests);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = [
    {
      name: 'Enrolled Courses',
      value: courses.length,
      icon: BookOpen,
      color: 'bg-blue-500',
      href: '/dashboard/courses',
    },
    {
      name: 'Available Tests',
      value: tests.filter(test => test.is_active).length,
      icon: FileText,
      color: 'bg-green-500',
      href: '/dashboard/tests',
    },
    {
      name: 'Submitted Answers',
      value: answers.length,
      icon: CheckCircle,
      color: 'bg-purple-500',
      href: '/dashboard/answers',
    },
    {
      name: 'Pending Tests',
      value: tests.filter(test => test.is_active).length, // Simplified for now
      icon: Clock,
      color: 'bg-orange-500',
      href: '/dashboard/tests',
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
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome, Student!</h1>
        <p className="text-green-100 mt-2">
          Access your courses, take tests, and view your progress with AI-powered feedback.
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

      {/* Enrolled Courses */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Your Courses</h2>
          <Link
            to="/dashboard/courses"
            className="text-primary-500 hover:text-primary-400 text-sm font-medium"
          >
            View all courses →
          </Link>
        </div>
        
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div key={course.id} className="border border-dark-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{course.title}</h3>
                    <p className="text-sm text-gray-300 mt-1">{course.subject}</p>
                    <p className="text-xs text-gray-400 mt-1">Academic Year: {course.academic_year}</p>
                  </div>
                  <BookOpen className="h-5 w-5 text-gray-400" />
                </div>
                {course.description && (
                  <p className="text-sm text-gray-300 mt-2 line-clamp-2">{course.description}</p>
                )}
                <div className="mt-3 pt-3 border-t border-dark-700">
                  <Link
                    to={`/dashboard/courses/${course.id}`}
                    className="text-primary-500 hover:text-primary-400 text-sm font-medium"
                  >
                    View Course →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-white">No courses enrolled</h3>
            <p className="mt-1 text-sm text-gray-400">Get started by enrolling in a course.</p>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tests */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Tests</h3>
          {tests.length > 0 ? (
            <div className="space-y-3">
              {tests.slice(0, 3).map((test) => (
                <div key={test.id} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                  <div>
                    <h4 className="font-medium text-white">{test.title}</h4>
                    <p className="text-sm text-gray-300">{test.duration_minutes} minutes</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-400">{test.total_points} points</span>
                    <div className="flex items-center mt-1">
                      {test.is_active ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-600 text-white">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-dark-700 text-gray-300">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No tests available</p>
          )}
        </div>

        {/* Recent Submissions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Submissions</h3>
          {answers.length > 0 ? (
            <div className="space-y-3">
              {answers.slice(0, 3).map((answer) => (
                <div key={answer.id} className="p-3 bg-dark-800 rounded-lg">
                  <h4 className="font-medium text-white line-clamp-2">{answer.answer}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-300">Question ID: {answer.question_id}</span>
                    <span className="text-sm text-gray-400">
                      {new Date(answer.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No submissions yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
