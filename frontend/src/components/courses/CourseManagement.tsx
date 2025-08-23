import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  BookOpen, 
  Calendar,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { coursesAPI } from '../../services/api';
import { Course, CourseCreate, CourseUpdate } from '../../types';
import toast from 'react-hot-toast';

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [enrollStudentId, setEnrollStudentId] = useState('');
  const [formData, setFormData] = useState<CourseCreate>({
    title: '',
    description: '',
    subject: '',
    academic_year: new Date().getFullYear().toString()
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await coursesAPI.getTeacherCourses();
      setCourses(response.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    try {
      await coursesAPI.createCourse(formData);
      toast.success('Course created successfully');
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        subject: '',
        academic_year: new Date().getFullYear().toString()
      });
      fetchCourses();
    } catch (error) {
      console.error('Failed to create course:', error);
      toast.error('Failed to create course');
    }
  };

  const handleUpdateCourse = async () => {
    if (!selectedCourse) return;
    
    try {
      const updateData: CourseUpdate = {
        title: formData.title || selectedCourse.title,
        description: formData.description || selectedCourse.description,
        subject: formData.subject || selectedCourse.subject,
        academic_year: formData.academic_year || selectedCourse.academic_year
      };
      
      await coursesAPI.updateCourse(selectedCourse.id, updateData);
      toast.success('Course updated successfully');
      setShowEditModal(false);
      setSelectedCourse(null);
      fetchCourses();
    } catch (error) {
      console.error('Failed to update course:', error);
      toast.error('Failed to update course');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      await coursesAPI.deleteCourse(courseId);
      toast.success('Course deleted successfully');
      fetchCourses();
    } catch (error) {
      console.error('Failed to delete course:', error);
      toast.error('Failed to delete course');
    }
  };

  const handleEnrollStudent = async () => {
    if (!selectedCourse || !enrollStudentId.trim()) return;

    try {
      await coursesAPI.enrollStudent(selectedCourse.id, enrollStudentId.trim());
      toast.success('Student enrolled successfully');
      setShowEnrollModal(false);
      setEnrollStudentId('');
      setSelectedCourse(null);
      fetchCourses();
    } catch (error) {
      console.error('Failed to enroll student:', error);
      toast.error('Failed to enroll student');
    }
  };

  const handleUnenrollStudent = async (courseId: string, studentId: string) => {
    if (!window.confirm('Are you sure you want to remove this student from the course?')) {
      return;
    }

    try {
      await coursesAPI.unenrollStudent(courseId, studentId);
      toast.success('Student removed successfully');
      fetchCourses();
    } catch (error) {
      console.error('Failed to remove student:', error);
      toast.error('Failed to remove student');
    }
  };

  const openEditModal = (course: Course) => {
    setSelectedCourse(course);
    setFormData({
      title: course.title,
      description: course.description || '',
      subject: course.subject,
      academic_year: course.academic_year
    });
    setShowEditModal(true);
  };

  const openEnrollModal = (course: Course) => {
    setSelectedCourse(course);
    setShowEnrollModal(true);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Course Management</h1>
          <p className="text-gray-300">Create and manage your courses</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Course
        </button>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-white">No courses</h3>
          <p className="mt-1 text-sm text-gray-300">Get started by creating your first course.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Course
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="card hover:shadow-md transition-shadow">
              <div className="overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-300 mb-3">
                      {course.description || 'No description provided'}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
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
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Users className="h-4 w-4" />
                    {course.student_ids.length} students enrolled
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => openEditModal(course)}
                    className="btn-secondary w-full flex items-center justify-center px-3 py-3 text-sm group relative"
                    title="Edit Course"
                  >
                    <Edit className="h-4 w-4" />
                    <span className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-dark-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap -top-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
                      Edit
                    </span>
                  </button>
                  <button
                    onClick={() => openEnrollModal(course)}
                    className="btn-secondary w-full flex items-center justify-center px-3 py-3 text-sm group relative"
                    title="Enroll Student"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-dark-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap -top-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
                      Enroll
                    </span>
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="btn-danger w-full flex items-center justify-center px-3 py-3 text-sm group relative"
                    title="Delete Course"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-dark-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap -top-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
                      Delete
                    </span>
                  </button>
                </div>

                {/* Student List */}
                {course.student_ids.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Enrolled Students:</h4>
                    <div className="space-y-1">
                      {course.student_ids.map((studentId, index) => (
                        <div key={studentId} className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Student {index + 1}</span>
                          <button
                            onClick={() => handleUnenrollStudent(course.id, studentId)}
                            className="text-red-400 hover:text-red-300 flex items-center gap-1"
                          >
                            <UserMinus className="h-3 w-3" />
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-900 rounded-lg p-6 w-full max-w-md mx-4 border border-dark-700">
            <h2 className="text-xl font-semibold mb-4 text-white">Create New Course</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field w-full"
                  placeholder="Course title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field w-full"
                  placeholder="Course description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="input-field w-full"
                  placeholder="e.g., Mathematics, Physics"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Academic Year *
                </label>
                <input
                  type="text"
                  value={formData.academic_year}
                  onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                  className="input-field w-full"
                  placeholder="e.g., 2025"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCourse}
                disabled={!formData.title || !formData.subject || !formData.academic_year}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                Create Course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-900 rounded-lg p-6 w-full max-w-md mx-4 border border-dark-700">
            <h2 className="text-xl font-semibold mb-4 text-white">Edit Course</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field w-full"
                  placeholder="Course title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field w-full"
                  placeholder="Course description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="input-field w-full"
                  placeholder="e.g., Mathematics, Physics"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Academic Year *
                </label>
                <input
                  type="text"
                  value={formData.academic_year}
                  onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                  className="input-field w-full"
                  placeholder="e.g., 2025"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCourse}
                disabled={!formData.title || !formData.subject || !formData.academic_year}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                Update Course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enroll Student Modal */}
      {showEnrollModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-900 rounded-lg p-6 w-full max-w-md mx-4 border border-dark-700">
            <h2 className="text-xl font-semibold mb-4 text-white">Enroll Student</h2>
            <p className="text-gray-300 mb-4">
              Enter the student ID to enroll them in "{selectedCourse.title}"
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Student ID *
                </label>
                <input
                  type="text"
                  value={enrollStudentId}
                  onChange={(e) => setEnrollStudentId(e.target.value)}
                  className="input-field w-full"
                  placeholder="Enter student ID"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEnrollModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleEnrollStudent}
                disabled={!enrollStudentId.trim()}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                Enroll Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;
