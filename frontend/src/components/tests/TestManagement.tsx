import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Clock,
  X,
  Copy,
  Users
} from 'lucide-react';
import { testsAPI, coursesAPI, questionsAPI } from '../../services/api';
import { Test, TestCreate, TestUpdate, Course, Question } from '../../types';
import toast from 'react-hot-toast';

const TestManagement: React.FC = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<TestCreate>({
    title: '',
    description: '',
    course_id: '',
    duration_minutes: 60,
    total_points: 100,
    is_active: true,
    question_ids: []
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [testsRes, coursesRes, questionsRes] = await Promise.all([
        testsAPI.getTeacherTests(),
        coursesAPI.getTeacherCourses(),
        questionsAPI.getTeacherQuestions(),
      ]);
      
      setTests(testsRes.data ?? []);
      setCourses(coursesRes.data ?? []);
      setQuestions(questionsRes.data ?? []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to fetch tests and courses');
    } finally {
      setLoading(false);
    }
  }, []);

  // Set default course when courses are loaded
  useEffect(() => {
    if (courses.length > 0 && !formData.course_id) {
      setFormData(prev => ({ ...prev, course_id: courses[0].id }));
    }
  }, [courses, formData.course_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateTest = async () => {
    try {
      await testsAPI.createTest(formData);
      
      toast.success('Test created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Failed to create test:', error);
      toast.error('Failed to create test');
    }
  };

  const handleUpdateTest = async () => {
    if (!selectedTest) return;
    
    try {
      const updateData: TestUpdate = {
        title: formData.title || selectedTest.title,
        description: formData.description || selectedTest.description,
        duration_minutes: formData.duration_minutes || selectedTest.duration_minutes,
        total_points: formData.total_points || selectedTest.total_points,
        is_active: formData.is_active !== undefined ? formData.is_active : selectedTest.is_active,
        question_ids: formData.question_ids || selectedTest.question_ids
      };
      
      await testsAPI.updateTest(selectedTest.id, updateData);
      
      toast.success('Test updated successfully');
      setShowEditModal(false);
      setSelectedTest(null);
      resetForm();
      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Failed to update test:', error);
      toast.error('Failed to update test');
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!window.confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
      return;
    }

    try {
      await testsAPI.deleteTest(testId);
      
      toast.success('Test deleted successfully');
      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete test:', error);
      toast.error('Failed to delete test');
    }
  };

  const openEditModal = (test: Test) => {
    setSelectedTest(test);
    setFormData({
      title: test.title,
      description: test.description || '',
      course_id: test.course_id,
      duration_minutes: test.duration_minutes,
      total_points: test.total_points,
      is_active: test.is_active,
      question_ids: test.question_ids
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      course_id: courses.length > 0 ? courses[0].id : '',
      duration_minutes: 60,
      total_points: 100,
      is_active: true,
      question_ids: []
    });
  };

  // Filter tests based on selected course and search term
  const filteredTests = tests.filter(test => {
    const matchesCourse = selectedCourseId === 'all' || test.course_id === selectedCourseId;
    const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (test.description && test.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCourse && matchesSearch;
  });

  // Helper function to get course name by ID
  const getCourseName = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.title : 'Unknown Course';
  };

  // Helper function to get questions for a test
  const getTestQuestions = (questionIds: string[]) => {
    return questions.filter(q => questionIds.includes(q.id));
  };

  // Helper function to calculate total points for a test
  const calculateTotalPoints = (questionIds: string[]) => {
    const testQuestions = getTestQuestions(questionIds);
    return testQuestions.reduce((total, q) => total + q.points, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-dark-900 rounded-xl border border-dark-800 shadow-lg">
        <div className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold text-white">Test Management</h1>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <FileText className="h-4 w-4" />
                  {tests.length} tests
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Users className="h-4 w-4" />
                  {courses.length} courses
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary px-6 py-2 text-sm font-semibold flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Test
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-dark-900 rounded-xl p-4 border border-dark-800 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          {/* Course Filter */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-400 mb-2">Course</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="input-field w-full bg-dark-800 border-dark-700 focus:border-primary-500 text-sm py-2"
            >
              <option value="all">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-400 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search tests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field w-full bg-dark-800 border-dark-700 focus:border-primary-500 text-sm py-2"
            />
          </div>

          {/* Results Count */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Showing</span>
            <span className="font-bold text-white">{filteredTests.length}</span>
            <span className="text-sm text-gray-400">tests</span>
          </div>
        </div>
      </div>

      {/* Compact Test Tiles */}
      {filteredTests.length === 0 ? (
        <div className="text-center py-12 bg-dark-900 rounded-xl border border-dark-800">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">No tests found</h3>
          <p className="text-gray-400 mb-4 max-w-md mx-auto">
            {selectedCourseId === 'all' 
              ? 'Create your first test to start building assessments for your students.'
              : 'No tests found for this course. Start building your test bank!'
            }
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary px-4 py-2 text-sm"
          >
            Create Your First Test
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTests.map((test) => (
            <div 
              key={test.id}
              className="bg-dark-900 rounded-lg border border-dark-800 transition-all duration-200 hover:shadow-lg hover:border-primary-500/50 group"
            >
              {/* Compact Test Tile */}
              <div className="p-3">
                {/* Metadata Row */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-600 text-white">
                    {getCourseName(test.course_id)}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                    test.is_active 
                      ? 'bg-green-600 text-green-800 border-green-200' 
                      : 'bg-gray-600 text-gray-800 border-gray-200'
                  }`}>
                    {test.is_active ? '🟢' : '⚪'}
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                    {calculateTotalPoints(test.question_ids)}
                  </span>
                </div>
                
                {/* Test Title - Clamped */}
                <h3 className="text-sm font-medium text-white leading-tight line-clamp-2 mb-3 group-hover:text-primary-300 transition-colors">
                  {test.title}
                </h3>
                
                {/* Test Stats - Compact */}
                <div className="flex items-center gap-3 mb-3 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {test.duration_minutes}m
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {test.question_ids.length} Q
                  </div>
                </div>
                
                {/* Quick Actions - Always visible */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-800">
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(test)}
                      className="p-1.5 text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 rounded transition-colors relative group/btn"
                      title="Edit Test"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap z-10">
                        Edit
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(test.title);
                        toast.success('Test title copied to clipboard');
                      }}
                      className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors relative group/btn"
                      title="Copy Test Title"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap z-10">
                        Copy
                      </span>
                    </button>
                  </div>
                  <button
                    onClick={() => handleDeleteTest(test.id)}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors relative group/btn"
                    title="Delete Test"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap z-10">
                      Delete
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Test Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-dark-700 shadow-2xl">
            <div className="sticky top-0 bg-dark-900 border-b border-dark-800 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Create New Test</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-white p-2 hover:bg-dark-800 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Course Selection */}
              <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  Course *
                </label>
                <select
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  className="input-field w-full bg-dark-700 border-dark-600 focus:border-primary-500"
                  required
                >
                  <option value="">Select a course...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Test Title */}
              <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  Test Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field w-full bg-dark-700 border-dark-600 focus:border-primary-500"
                  placeholder="Enter test title..."
                  required
                />
              </div>

              {/* Description */}
              <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field w-full bg-dark-700 border-dark-600 focus:border-primary-500"
                  placeholder="Enter test description..."
                  rows={3}
                />
              </div>

              {/* Test Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    className="input-field w-full bg-dark-700 border-dark-600 focus:border-primary-500"
                    placeholder="60"
                  />
                </div>

                <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Total Points
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.total_points}
                    onChange={(e) => setFormData({ ...formData, total_points: parseInt(e.target.value) })}
                    className="input-field w-full bg-dark-700 border-dark-600 focus:border-primary-500"
                    placeholder="100"
                  />
                </div>
              </div>

              {/* Question Selection */}
              <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  Select Questions *
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {questions
                    .filter(q => q.course_id === formData.course_id)
                    .map((question) => (
                      <label key={question.id} className="flex items-center gap-3 p-2 hover:bg-dark-700 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.question_ids.includes(question.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                question_ids: [...prev.question_ids, question.id]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                question_ids: prev.question_ids.filter(id => id !== question.id)
                              }));
                            }
                          }}
                          className="rounded border-dark-600 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm text-white line-clamp-2">{question.question}</div>
                          <div className="text-xs text-gray-400">
                            {question.difficulty_level} • {question.points} pts
                          </div>
                        </div>
                      </label>
                    ))}
                </div>
                {formData.course_id && questions.filter(q => q.course_id === formData.course_id).length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No questions available for this course. Create questions first.
                  </div>
                )}
              </div>

              {/* Active Status */}
              <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-dark-600 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-semibold text-gray-200">Active Test</span>
                  <span className="text-xs text-gray-500">Students can take this test when active</span>
                </label>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-dark-900 border-t border-dark-800 p-6 rounded-b-2xl">
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="btn-secondary flex-1 py-3 text-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTest}
                  disabled={!formData.title || !formData.course_id || formData.question_ids.length === 0}
                  className="btn-primary flex-1 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Test
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Test Modal */}
      {showEditModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-dark-700 shadow-2xl">
            <div className="sticky top-0 bg-dark-900 border-b border-dark-800 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Edit Test</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedTest(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-white p-2 hover:bg-dark-800 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Course Selection */}
              <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  Course *
                </label>
                <select
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  className="input-field w-full bg-dark-700 border-dark-600 focus:border-primary-500"
                  required
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Test Title */}
              <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  Test Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field w-full bg-dark-700 border-dark-600 focus:border-primary-500"
                  placeholder="Enter test title..."
                  required
                />
              </div>

              {/* Description */}
              <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field w-full bg-dark-700 border-dark-600 focus:border-primary-500"
                  placeholder="Enter test description..."
                  rows={3}
                />
              </div>

              {/* Test Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    className="input-field w-full bg-dark-700 border-dark-600 focus:border-primary-500"
                    placeholder="60"
                  />
                </div>

                <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Total Points
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.total_points}
                    onChange={(e) => setFormData({ ...formData, total_points: parseInt(e.target.value) })}
                    className="input-field w-full bg-dark-700 border-dark-600 focus:border-primary-500"
                    placeholder="100"
                  />
                </div>
              </div>

              {/* Question Selection */}
              <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  Select Questions *
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {questions
                    .filter(q => q.course_id === formData.course_id)
                    .map((question) => (
                      <label key={question.id} className="flex items-center gap-3 p-2 hover:bg-dark-700 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.question_ids.includes(question.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                question_ids: [...prev.question_ids, question.id]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                question_ids: prev.question_ids.filter(id => id !== question.id)
                              }));
                            }
                          }}
                          className="rounded border-dark-600 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm text-white line-clamp-2">{question.question}</div>
                          <div className="text-xs text-gray-400">
                            {question.difficulty_level} • {question.points} pts
                          </div>
                        </div>
                      </label>
                    ))}
                </div>
              </div>

              {/* Active Status */}
              <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-dark-600 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-semibold text-gray-200">Active Test</span>
                  <span className="text-xs text-gray-500">Students can take this test when active</span>
                </label>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-dark-900 border-t border-dark-800 p-6 rounded-b-2xl">
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedTest(null);
                    resetForm();
                  }}
                  className="btn-secondary flex-1 py-3 text-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTest}
                  disabled={!formData.title || formData.question_ids.length === 0}
                  className="btn-primary flex-1 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update Test
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestManagement;
