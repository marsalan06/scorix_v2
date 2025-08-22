import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Calendar, 
  FileText,
  Clock
} from 'lucide-react';
import { coursesAPI, testsAPI } from '../../services/api';
import { Course, Test } from '../../types';
import toast from 'react-hot-toast';

const StudentCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const [coursesRes, testsRes] = await Promise.all([
        coursesAPI.getStudentCourses(),
        testsAPI.getTeacherTests(), // This will need to be filtered for student's courses
      ]);
      
      setCourses(coursesRes.data);
      setTests(testsRes.data);
    } catch (error) {
      console.error('Failed to fetch student data:', error);
      toast.error('Failed to fetch course data');
    } finally {
      setLoading(false);
    }
  };

  // Filter tests for courses the student is enrolled in
  const getTestsForCourse = (courseId: string) => {
    return tests.filter(test => test.course_id === courseId && test.is_active);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
        <p className="text-gray-600">View your enrolled courses and available tests</p>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No courses enrolled</h3>
          <p className="mt-1 text-sm text-gray-500">You haven't been enrolled in any courses yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const courseTests = getTestsForCourse(course.id);
            const activeTests = courseTests.filter(test => test.is_active);
            
            return (
              <div key={course.id} className="card hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {course.description || 'No description provided'}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {course.subject}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {course.academic_year}
                      </div>
                    </div>
                  </div>

                  {/* Course Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {activeTests.length}
                      </div>
                      <div className="text-xs text-blue-600">Active Tests</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {courseTests.length}
                      </div>
                      <div className="text-xs text-green-600">Total Tests</div>
                    </div>
                  </div>

                  {/* Available Tests */}
                  {activeTests.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Available Tests
                      </h4>
                      <div className="space-y-2">
                        {activeTests.slice(0, 3).map((test) => (
                          <div key={test.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                            <span className="text-gray-700">{test.title}</span>
                            <div className="flex items-center gap-1 text-gray-500">
                              <Clock className="h-3 w-3" />
                              {test.duration_minutes}m
                            </div>
                          </div>
                        ))}
                        {activeTests.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{activeTests.length - 3} more tests
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Course Actions */}
                  <div className="flex gap-2">
                    <button className="btn-primary flex-1 flex items-center justify-center gap-2">
                      <FileText className="h-4 w-4" />
                      View Tests
                    </button>
                    <button className="btn-secondary flex-1 flex items-center justify-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Course Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Stats */}
      {courses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card text-center">
            <div className="text-3xl font-bold text-blue-600">{courses.length}</div>
            <div className="text-sm text-gray-600">Enrolled Courses</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-green-600">
              {tests.filter(test => test.is_active && courses.some(course => course.id === test.course_id)).length}
            </div>
            <div className="text-sm text-gray-600">Available Tests</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-purple-600">
              {courses.reduce((acc, course) => acc + course.student_ids.length, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Students</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-orange-600">
              {courses.length > 0 ? Math.round(courses.reduce((acc, course) => acc + course.student_ids.length, 0) / courses.length) : 0}
            </div>
            <div className="text-sm text-gray-600">Avg. Class Size</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCourses;
