import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Clock, 
  BookOpen, 
  Play,
  CheckCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { coursesAPI, testsAPI, questionsAPI, studentAnswersAPI } from '../../services/api';
import { Course, Test, Question } from '../../types';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

// Extended test type with course information
type TestWithCourse = Test & {
  course_title: string;
  course_subject: string;
  submitted?: boolean;
};

const StudentTests: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [tests, setTests] = useState<TestWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Test taking state
  const [selectedTest, setSelectedTest] = useState<TestWithCourse | null>(null);
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [testAnswers, setTestAnswers] = useState<Record<string, string>>({});
  const [showTestModal, setShowTestModal] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const coursesRes = await coursesAPI.getStudentCourses();
        setCourses(coursesRes.data ?? []);
        
        // Fetch tests for all courses the student is enrolled in
        if (coursesRes.data && coursesRes.data.length > 0) {
          const allTests = [];
          for (const course of coursesRes.data) {
            try {
              const testsRes = await testsAPI.getCourseTests(course.id);
              if (testsRes.data) {
                // Add course info to each test
                const testsWithCourse = testsRes.data.map((test: Test) => ({
                  ...test,
                  course_title: course.title,
                  course_subject: course.subject
                }));
                allTests.push(...testsWithCourse);
              }
            } catch (error) {
              console.error(`Failed to fetch tests for course ${course.id}:`, error);
            }
          }
          setTests(allTests);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to fetch courses and tests');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Start test and fetch questions
  const startTest = async (test: TestWithCourse) => {
    try {
      setTestLoading(true);
      setSelectedTest(test);
      
      // Fetch questions for the test
      const questionsRes = await questionsAPI.getCourseQuestions(test.course_id);
      const testQuestions = questionsRes.data?.filter((q: Question) => 
        test.question_ids.includes(q.id)
      ) || [];
      
      setTestQuestions(testQuestions);
      setTestAnswers({});
      setTestSubmitted(false);
      setTimeRemaining(test.duration_minutes * 60); // Convert to seconds
      setShowTestModal(true);
      
      // Initialize answers
      const initialAnswers: Record<string, string> = {};
      testQuestions.forEach((q: Question) => {
        initialAnswers[q.id] = '';
      });
      setTestAnswers(initialAnswers);
      
    } catch (error) {
      console.error('Failed to start test:', error);
      toast.error('Failed to start test');
    } finally {
      setTestLoading(false);
    }
  };

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && showTestModal && !testSubmitted) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Auto-submit when time runs out
            submitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, showTestModal, testSubmitted]);

  // Submit test answers
  const submitTest = async () => {
    if (!selectedTest || testSubmitted) return;
    
    try {
      setTestLoading(true);
      
      const testAnswerData = {
        test_id: selectedTest.id,
        course_id: selectedTest.course_id,
        student_name: user?.first_name + ' ' + user?.last_name || "Student",
        student_roll_no: user?.username || "Roll Number",
        question_answers: testAnswers
      };
      
      await studentAnswersAPI.submitTestAnswers(testAnswerData);
      
      setTestSubmitted(true);
      toast.success('Test submitted successfully!');
      
      // Refresh tests to show updated status
      const testsRes = await testsAPI.getCourseTests(selectedTest.course_id);
      setTests(prev => prev.map(t => 
        t.id === selectedTest.id ? { ...t, submitted: true } : t
      ));
      
    } catch (error) {
      console.error('Failed to submit test:', error);
      toast.error('Failed to submit test');
    } finally {
      setTestLoading(false);
    }
  };

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Close test modal
  const closeTestModal = () => {
    setShowTestModal(false);
    setSelectedTest(null);
    setTestQuestions([]);
    setTestAnswers({});
    setTestSubmitted(false);
    setTimeRemaining(0);
  };

  // Filter tests by status
  const pendingTests = tests.filter(test => test.is_active);
  const completedTests = tests.filter(test => !test.is_active || test.submitted);

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">My Tests</h1>
              <p className="text-gray-300">View and take your pending tests</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <FileText className="h-4 w-4" />
                {pendingTests.length} pending
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <CheckCircle className="h-4 w-4" />
                {completedTests.length} completed
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Tests */}
      <div className="bg-dark-900 rounded-xl border border-dark-800 shadow-lg">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-400" />
            Pending Tests ({pendingTests.length})
          </h2>
          
          {pendingTests.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No pending tests</h3>
              <p className="text-gray-400">All your tests are completed or not yet available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingTests.map((test) => (
                <div key={test.id} className="bg-dark-800 rounded-lg border border-dark-700 hover:border-primary-500/50 transition-all duration-200">
                  <div className="p-4">
                    {/* Test Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
                          {test.title}
                        </h3>
                        <p className="text-sm text-gray-400 mb-2">
                          {test.course_title} • {test.course_subject}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-600 text-white">
                        Active
                      </span>
                    </div>
                    
                    {/* Test Details */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="text-center p-2 bg-dark-700 rounded border border-dark-600">
                        <div className="text-lg font-bold text-blue-400">{test.duration_minutes}</div>
                        <div className="text-xs text-blue-400">Minutes</div>
                      </div>
                      <div className="text-center p-2 bg-dark-700 rounded border border-dark-600">
                        <div className="text-lg font-bold text-green-400">{test.question_ids?.length || 0}</div>
                        <div className="text-xs text-green-400">Questions</div>
                      </div>
                    </div>
                    
                    {/* Test Description */}
                    {test.description && (
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                        {test.description}
                      </p>
                    )}
                    
                    {/* Action Button */}
                    <button
                      onClick={() => startTest(test)}
                      className="w-full btn-primary py-2 px-4 text-sm flex items-center justify-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Start Test
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Completed Tests */}
      {completedTests.length > 0 && (
        <div className="bg-dark-900 rounded-xl border border-dark-800 shadow-lg">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              Completed Tests ({completedTests.length})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedTests.map((test) => (
                <div key={test.id} className="bg-dark-800 rounded-lg border border-dark-700 opacity-75">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
                          {test.title}
                        </h3>
                        <p className="text-sm text-gray-400 mb-2">
                          {test.course_title} • {test.course_subject}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-600 text-white">
                        Completed
                      </span>
                    </div>
                    
                    <div className="text-center py-4">
                      <CheckCircle className="mx-auto h-8 w-8 text-green-400 mb-2" />
                      <p className="text-sm text-gray-400">Test completed</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Test Taking Modal */}
      {showTestModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-dark-700 shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-dark-900 border-b border-dark-800 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedTest.title}</h2>
                  <p className="text-sm text-gray-400">Course: {selectedTest.course_title}</p>
                </div>
                <button
                  onClick={closeTestModal}
                  className="text-gray-400 hover:text-white p-2 hover:bg-dark-800 rounded-lg transition-colors"
                >
                  <Clock className="h-5 w-5" />
                </button>
              </div>
              
              {/* Test Info Bar */}
              <div className="flex items-center justify-between bg-dark-800 rounded-lg p-3">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span className={timeRemaining < 300 ? 'text-red-400 font-semibold' : 'text-white'}>
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <FileText className="h-4 w-4" />
                    {testQuestions.length} questions
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <CheckCircle className="h-4 w-4" />
                    {Object.values(testAnswers).filter(a => a.trim()).length} answered
                  </div>
                </div>
                
                {!testSubmitted && (
                  <button
                    onClick={submitTest}
                    disabled={testLoading}
                    className="btn-primary px-4 py-2 text-sm"
                  >
                    {testLoading ? 'Submitting...' : 'Submit Test'}
                  </button>
                )}
              </div>
            </div>
            
            {/* Test Content */}
            <div className="p-6">
              {testSubmitted ? (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-16 w-16 text-green-400 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Test Submitted!</h3>
                  <p className="text-gray-400 mb-4">Your answers have been submitted successfully.</p>
                  <button
                    onClick={closeTestModal}
                    className="btn-secondary px-6 py-2"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {testQuestions.map((question, index) => (
                    <div key={question.id} className="bg-dark-800 rounded-lg p-4 border border-dark-700">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white text-sm font-medium">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-2">{question.question}</h4>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {question.difficulty_level}
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              {question.points} points
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <textarea
                        value={testAnswers[question.id] || ''}
                        onChange={(e) => setTestAnswers(prev => ({
                          ...prev,
                          [question.id]: e.target.value
                        }))}
                        placeholder="Type your answer here..."
                        className="w-full p-3 bg-dark-700 border border-dark-600 rounded text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none resize-none"
                        rows={4}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTests;
