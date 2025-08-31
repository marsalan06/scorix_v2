import React, { useState, useEffect, useCallback } from 'react';
import { 
  Eye, 
  FileText, 
  BookOpen, 
  Users, 
  Calendar,
  Search,
  Filter,
  Download,
  RefreshCw,
  X
} from 'lucide-react';
import { studentAnswersAPI, coursesAPI, testsAPI } from '../../services/api';
import { StudentAnswer, TestAnswer, Course, Test } from '../../types';
import toast from 'react-hot-toast';

const StudentAnswers: React.FC = () => {
  const [studentAnswers, setStudentAnswers] = useState<StudentAnswer[]>([]);
  const [testAnswers, setTestAnswers] = useState<TestAnswer[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [selectedTestId, setSelectedTestId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'course' | 'test'>('course');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<StudentAnswer | TestAnswer | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [coursesRes, testsRes] = await Promise.all([
        coursesAPI.getTeacherCourses(),
        testsAPI.getTeacherTests(),
      ]);
      
      setCourses(coursesRes.data ?? []);
      setTests(testsRes.data ?? []);
      
      if (coursesRes.data && coursesRes.data.length > 0) {
        setSelectedCourseId(coursesRes.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to fetch courses and tests');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCourseAnswers = useCallback(async (courseId: string) => {
    if (courseId === 'all') return;
    
    try {
      const response = await studentAnswersAPI.getCourseAnswers(courseId);
      setStudentAnswers(response.data ?? []);
    } catch (error) {
      console.error('Failed to fetch course answers:', error);
      toast.error('Failed to fetch course answers');
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (viewMode === 'course' && selectedCourseId !== 'all') {
      fetchCourseAnswers(selectedCourseId);
    }
  }, [viewMode, selectedCourseId, fetchCourseAnswers]);

  // Helper function to get course name by ID
  const getCourseName = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.title : 'Unknown Course';
  };

  // Helper function to get test name by ID
  const getTestName = (testId: string) => {
    const test = tests.find(t => t.id === testId);
    return test ? test.title : 'Unknown Test';
  };

  // Filter answers based on search term
  const filteredAnswers = viewMode === 'course' 
    ? studentAnswers.filter(answer => 
        answer.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        answer.student_roll_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        answer.answer.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : testAnswers.filter(answer => 
        answer.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        answer.student_roll_no.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const openAnswerModal = (answer: StudentAnswer | TestAnswer) => {
    setSelectedAnswer(answer);
    setShowAnswerModal(true);
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
      <div className="bg-dark-900 rounded-xl border border-dark-800 shadow-lg">
        <div className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <h1 className="text-2xl font-bold text-white">Student Answers</h1>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Users className="h-4 w-4" />
                  {viewMode === 'course' ? studentAnswers.length : testAnswers.length} answers
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <BookOpen className="h-4 w-4" />
                  {courses.length} courses
                </div>
              </div>
            </div>
            <button
              onClick={() => fetchData()}
              className="btn-secondary px-4 py-2 text-sm font-semibold flex items-center gap-2 self-start lg:self-center"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-dark-900 rounded-xl border border-dark-800 shadow-lg">
        <div className="p-4">
          {/* View Mode and Course Selection - Aligned horizontally */}
          <div className="flex flex-col lg:flex-row lg:items-end gap-6 mb-4">
            {/* View Mode Toggle */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400">View Mode</label>
              <div className="flex bg-dark-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('course')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'course'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <BookOpen className="h-4 w-4 inline mr-2" />
                  Course Answers
                </button>
                <button
                  onClick={() => setViewMode('test')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'test'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <FileText className="h-4 w-4 inline mr-2" />
                  Test Submissions
                </button>
              </div>
            </div>

            {/* Course Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400">
                {viewMode === 'course' ? 'Course' : 'Course'}
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="input-field w-full bg-dark-800 border-dark-700 focus:border-primary-500 text-sm py-2 min-w-[200px]"
              >
                <option value="all">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Test Selection (only for test mode) */}
            {viewMode === 'test' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-400">Test</label>
                <select
                  value={selectedTestId}
                  onChange={(e) => setSelectedTestId(e.target.value)}
                  className="input-field w-full bg-dark-800 border-dark-700 focus:border-primary-500 text-sm py-2 min-w-[200px]"
                >
                  <option value="all">All Tests</option>
                  {tests
                    .filter(test => selectedCourseId === 'all' || test.course_id === selectedCourseId)
                    .map((test) => (
                      <option key={test.id} value={test.id}>
                        {test.title}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          {/* Search - Aligned with controls above */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name, roll number, or answer content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field w-full pl-10 bg-dark-800 border-dark-700 focus:border-primary-500 text-sm py-2"
            />
          </div>
        </div>
      </div>

      {/* Answers Display */}
      <div className="bg-dark-900 rounded-xl border border-dark-800 shadow-lg">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              {viewMode === 'course' ? 'Course Answers' : 'Test Submissions'}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Filter className="h-4 w-4" />
              <span>{filteredAnswers.length} of {viewMode === 'course' ? studentAnswers.length : testAnswers.length} results</span>
            </div>
          </div>

          {filteredAnswers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">No answers found</h3>
              <p className="text-gray-400">
                {searchTerm 
                  ? 'No answers match your search criteria'
                  : 'No student answers available for the selected filters'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAnswers.map((answer, index) => (
                <div 
                  key={index}
                  className="bg-dark-800 rounded-lg p-4 border border-dark-700 hover:border-primary-500/50 transition-all duration-200 cursor-pointer"
                  onClick={() => openAnswerModal(answer)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{answer.student_name}</span>
                        <span className="text-xs text-gray-400">({answer.student_roll_no})</span>
                      </div>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-sm text-gray-300">
                        {viewMode === 'course' 
                          ? getCourseName((answer as StudentAnswer).course_id)
                          : getTestName((answer as TestAnswer).test_id)
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {new Date(answer.created_at).toLocaleDateString()}
                      </span>
                      <Eye className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  
                  {viewMode === 'course' ? (
                    <div className="bg-dark-700 rounded p-3">
                      <div className="text-xs text-gray-400 mb-1">Answer Preview:</div>
                      <div className="text-sm text-white line-clamp-2">
                        {(answer as StudentAnswer).answer}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">
                      {Object.keys((answer as TestAnswer).question_answers).length} questions answered
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Answer Detail Modal */}
      {showAnswerModal && selectedAnswer && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-dark-700 shadow-2xl">
            <div className="sticky top-0 bg-dark-900 border-b border-dark-800 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Answer Details</h2>
                <button
                  onClick={() => setShowAnswerModal(false)}
                  className="text-gray-400 hover:text-white p-2 hover:bg-dark-800 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Student Info */}
              <div className="bg-dark-800 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Student Name</div>
                    <div className="text-white font-medium">{selectedAnswer.student_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Roll Number</div>
                    <div className="text-white font-medium">{selectedAnswer.student_roll_no}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Submitted</div>
                    <div className="text-white font-medium">
                      {new Date(selectedAnswer.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Answer Content */}
              {viewMode === 'course' ? (
                <div className="bg-dark-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-2">Question ID</div>
                  <div className="text-white font-mono text-sm mb-4">
                    {(selectedAnswer as StudentAnswer).question_id}
                  </div>
                  
                  <div className="text-sm text-gray-400 mb-2">Student Answer</div>
                  <div className="bg-dark-700 rounded p-3">
                    <div className="text-white whitespace-pre-wrap">
                      {(selectedAnswer as StudentAnswer).answer}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-dark-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-2">Test ID</div>
                  <div className="text-white font-mono text-sm mb-4">
                    {(selectedAnswer as TestAnswer).test_id}
                  </div>
                  
                  <div className="text-sm text-gray-400 mb-2">Question Answers</div>
                  <div className="space-y-3">
                    {Object.entries((selectedAnswer as TestAnswer).question_answers).map(([questionId, answer], index) => (
                      <div key={questionId} className="bg-dark-700 rounded p-3">
                        <div className="text-xs text-gray-400 mb-1">Q{index + 1} (ID: {questionId})</div>
                        <div className="text-white">{answer}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAnswers;
