import React, { useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  FileText, 
  BookOpen,
  Zap,
  Target,
  BarChart3,
  X
} from 'lucide-react';
import { gradingAPI, coursesAPI, testsAPI } from '../../services/api';
import { Course, Test, GradingResult, TestGradingResult, GradeThresholds } from '../../types';
import toast from 'react-hot-toast';

const GradingInterface: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [selectedCourseForTest, setSelectedCourseForTest] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [gradingResults, setGradingResults] = useState<GradingResult[]>([]);
  const [testGradingResults, setTestGradingResults] = useState<TestGradingResult[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [gradeThresholds, setGradeThresholds] = useState<GradeThresholds | null>(null);
  const [showThresholdsModal, setShowThresholdsModal] = useState(false);
  const [thresholdsForm, setThresholdsForm] = useState<GradeThresholds>({
    A: 90,
    B: 80,
    C: 70,
    D: 60,
    F: 0
  });

  const fetchData = useCallback(async () => {
    try {
      const [coursesRes, testsRes, thresholdsRes] = await Promise.all([
        coursesAPI.getTeacherCourses(),
        testsAPI.getTeacherTests(),
        gradingAPI.getGradeThresholds(),
      ]);
      
      setCourses(coursesRes.data ?? []);
      setTests(testsRes.data ?? []);
      if (thresholdsRes.data) {
        setGradeThresholds(thresholdsRes.data);
        setThresholdsForm(thresholdsRes.data);
      }
      
      if (coursesRes.data && coursesRes.data.length > 0) {
        setSelectedCourseId(coursesRes.data[0].id);
        setSelectedCourseForTest(coursesRes.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to fetch courses and tests');
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGradeCourse = async () => {
    if (!selectedCourseId) {
      toast.error('Please select a course to grade');
      return;
    }

    try {
      setLoading(true);
      const response = await gradingAPI.gradeCourse(selectedCourseId);
      setGradingResults(response.data ?? []);
      setTestGradingResults([]); // Clear test results
      
      if (response.data && response.data.length > 0) {
        toast.success(`Successfully graded ${response.data.length} answers`);
      } else {
        toast.success('No answers found to grade for this course');
      }
    } catch (error) {
      console.error('Failed to grade course:', error);
      toast.error('Failed to grade course answers');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeTest = async () => {
    if (!selectedTestId) {
      toast.error('Please select a test to grade');
      return;
    }

    try {
      setLoading(true);
      const response = await gradingAPI.gradeTest(selectedTestId);
      setTestGradingResults(response.data ?? []);
      setGradingResults([]); // Clear course results
      
      if (response.data && response.data.length > 0) {
        toast.success(`Successfully graded ${response.data.length} test submissions`);
      } else {
        toast.success('No test submissions found to grade');
      }
    } catch (error) {
      console.error('Failed to grade test:', error);
      toast.error('Failed to grade test');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateThresholds = async () => {
    try {
      await gradingAPI.updateGradeThresholds(thresholdsForm);
      setGradeThresholds(thresholdsForm);
      setShowThresholdsModal(false);
      toast.success('Grade thresholds updated successfully');
    } catch (error) {
      console.error('Failed to update grade thresholds:', error);
      toast.error('Failed to update grade thresholds');
    }
  };

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

  // Helper function to get grade color
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'B': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'C': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'D': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'F': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  // Calculate statistics
  const calculateStats = (results: GradingResult[] | TestGradingResult[]) => {
    if (results.length === 0) return null;

    const scores = results.map(r => 'overall_score' in r ? r.overall_score : r.score);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);

    const gradeDistribution: Record<string, number> = {};
    results.forEach(r => {
      const grade = 'overall_grade' in r ? r.overall_grade : r.grade;
      gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
    });

    return { avgScore, maxScore, minScore, gradeDistribution };
  };

  const courseStats = calculateStats(gradingResults);
  const testStats = calculateStats(testGradingResults);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-dark-900 rounded-xl border border-dark-800 shadow-lg">
        <div className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex items-center gap-6">
                <h1 className="text-2xl font-bold text-white">AI Grading Interface</h1>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Zap className="h-4 w-4" />
                    AI-Powered
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Target className="h-4 w-4" />
                    Semantic Analysis
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>

      {/* Compact Grading Controls */}
      <div className="bg-dark-900 rounded-xl border border-dark-800 shadow-lg">
        <div className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-lg font-semibold text-white">Grading Controls</h3>
            <button
              onClick={() => setShowThresholdsModal(true)}
              className="btn-secondary px-3 py-1.5 text-sm font-medium flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Grade Thresholds
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Course Grading */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-gray-300">Course Grading</span>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="input-field flex-1 bg-dark-800 border-dark-700 focus:border-primary-500 text-sm py-2"
                >
                  <option value="">Select course...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleGradeCourse}
                  disabled={!selectedCourseId || loading}
                  className="btn-primary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Grade
                </button>
              </div>
            </div>

            {/* Test Grading */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-gray-300">Test Grading</span>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedCourseForTest}
                  onChange={(e) => {
                    setSelectedCourseForTest(e.target.value);
                    setSelectedTestId('');
                  }}
                  className="input-field flex-1 bg-dark-800 border-dark-700 focus:border-primary-500 text-sm py-2"
                >
                  <option value="">Course...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedTestId}
                  onChange={(e) => setSelectedTestId(e.target.value)}
                  disabled={!selectedCourseForTest}
                  className="input-field flex-1 bg-dark-800 border-dark-700 focus:border-primary-500 text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {selectedCourseForTest ? 'Test...' : 'Course first'}
                  </option>
                  {tests
                    .filter(test => test.course_id === selectedCourseForTest)
                    .map((test) => (
                      <option key={test.id} value={test.id}>
                        {test.title}
                      </option>
                    ))}
                </select>
                <button
                  onClick={handleGradeTest}
                  disabled={!selectedTestId || loading}
                  className="btn-primary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Grade
                </button>
              </div>
              {selectedCourseForTest && tests.filter(test => test.course_id === selectedCourseForTest).length === 0 && (
                <p className="text-xs text-gray-500">No tests available</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Compact Results Display */}
      {(gradingResults.length > 0 || testGradingResults.length > 0) && (
        <div className="bg-dark-900 rounded-xl border border-dark-800 shadow-lg">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Grading Results</h3>

            {/* Compact Statistics */}
            {(courseStats || testStats) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-dark-800 rounded-lg p-3 border border-dark-700">
                  <div className="text-xs text-gray-400 mb-1">Avg Score</div>
                  <div className="text-lg font-bold text-white">
                    {((courseStats || testStats)?.avgScore || 0).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-dark-800 rounded-lg p-3 border border-dark-700">
                  <div className="text-xs text-gray-400 mb-1">Highest</div>
                  <div className="text-lg font-bold text-green-400">
                    {(courseStats || testStats)?.maxScore || 0}%
                  </div>
                </div>
                <div className="bg-dark-800 rounded-lg p-3 border border-dark-700">
                  <div className="text-xs text-gray-400 mb-1">Lowest</div>
                  <div className="text-lg font-bold text-red-400">
                    {(courseStats || testStats)?.minScore || 0}%
                  </div>
                </div>
                <div className="bg-dark-800 rounded-lg p-3 border border-dark-700">
                  <div className="text-xs text-gray-400 mb-1">Total</div>
                  <div className="text-lg font-bold text-blue-400">
                    {gradingResults.length + testGradingResults.length}
                  </div>
                </div>
              </div>
            )}

            {/* Course Grading Results */}
            {gradingResults.length > 0 && (
              <div className="mb-6">
                <h4 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-400" />
                  Course Results
                </h4>
                <div className="space-y-2">
                  {gradingResults.map((result, index) => (
                    <div key={index} className="bg-dark-800 rounded-lg p-3 border border-dark-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-white">{result.student_name}</span>
                          <span className="text-gray-400">({result.student_roll_no})</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-300">{getCourseName(result.course_id)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getGradeColor(result.grade)}`}>
                            {result.grade}
                          </span>
                          <span className="text-base font-bold text-white">{result.score.toFixed(1)}%</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <div className="text-gray-400">Points</div>
                          <div className="text-white font-medium">{result.points_earned.toFixed(1)}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Matched</div>
                          <div className="text-green-400">
                            {result.matched_rules.length > 0 ? result.matched_rules.length : '0'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Missed</div>
                          <div className="text-red-400">
                            {result.missed_rules.length > 0 ? result.missed_rules.length : '0'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Test Grading Results */}
            {testGradingResults.length > 0 && (
              <div>
                <h4 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-400" />
                  Test Results
                </h4>
                <div className="space-y-2">
                  {testGradingResults.map((result, index) => (
                    <div key={index} className="bg-dark-800 rounded-lg p-3 border border-dark-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-white">{result.student_name}</span>
                          <span className="text-gray-400">({result.student_roll_no})</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-300">{getTestName(result.test_id)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getGradeColor(result.overall_grade)}`}>
                            {result.overall_grade}
                          </span>
                          <span className="text-base font-bold text-white">{result.overall_score.toFixed(1)}%</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
                        <div>
                          <div className="text-gray-400">Points</div>
                          <div className="text-white font-medium">{result.total_points_earned.toFixed(1)}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Questions</div>
                          <div className="text-white font-medium">{result.question_results.length}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Test ID</div>
                          <div className="text-white font-medium text-xs">{result.test_id.slice(0, 8)}...</div>
                        </div>
                      </div>

                      {/* Compact Question Results */}
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-300 mb-1">Questions:</div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                          {result.question_results.map((qResult, qIndex) => (
                            <div key={qIndex} className="bg-dark-700 rounded p-2 text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-gray-300">Q{qIndex + 1}</span>
                                <span className={`px-1 py-0.5 rounded text-xs font-medium border ${getGradeColor(qResult.grade)}`}>
                                  {qResult.grade}
                                </span>
                              </div>
                              <div className="text-gray-400 text-xs">
                                {qResult.score.toFixed(1)}% • {qResult.points_earned.toFixed(1)} pts
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grade Thresholds Modal */}
      {showThresholdsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 rounded-2xl w-full max-w-md border border-dark-700 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Grade Thresholds</h2>
                <button
                  onClick={() => setShowThresholdsModal(false)}
                  className="text-gray-400 hover:text-white p-2 hover:bg-dark-800 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  Set the minimum percentage required for each letter grade. These thresholds are used by the AI grading system.
                </p>
                
                {Object.entries(thresholdsForm).map(([grade, threshold]) => (
                  <div key={grade} className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center text-sm font-bold text-primary-400">
                      {grade}
                    </span>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Minimum Score for Grade {grade}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={threshold}
                        onChange={(e) => setThresholdsForm(prev => ({
                          ...prev,
                          [grade]: parseInt(e.target.value)
                        }))}
                        className="input-field w-full bg-dark-800 border-dark-700 focus:border-primary-500 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowThresholdsModal(false)}
                  className="btn-secondary flex-1 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateThresholds}
                  className="btn-primary flex-1 py-2"
                >
                  Update Thresholds
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradingInterface;
