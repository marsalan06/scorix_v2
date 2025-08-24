import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  HelpCircle, 
  BookOpen,
  Search,
  Eye,
  Star,
  Tag,
  X,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { questionsAPI, coursesAPI } from '../../services/api';
import { Question, QuestionCreate, QuestionUpdate, Course } from '../../types';
import toast from 'react-hot-toast';

const QuestionManagement: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showHints, setShowHints] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isUpdatingCount, setIsUpdatingCount] = useState(false);
  const [questionCreated, setQuestionCreated] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<QuestionCreate>({
    question: '',
    sample_answer: '',
    marking_scheme: [''],
    course_id: '',
    difficulty_level: 'medium',
    points: 1
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [questionsRes, coursesRes] = await Promise.all([
        questionsAPI.getTeacherQuestions(),
        coursesAPI.getTeacherCourses(),
      ]);
      
      setQuestions(questionsRes.data);
      setCourses(coursesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to fetch questions and courses');
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies to prevent infinite loops

  // Set default course when courses are loaded
  useEffect(() => {
    if (courses.length > 0 && !formData.course_id) {
      setFormData(prev => ({ ...prev, course_id: courses[0].id }));
    }
  }, [courses, formData.course_id]);

  // Debug: Log when course preview should update
  useEffect(() => {
    if (formData.course_id) {
      const course = courses.find(c => c.id === formData.course_id);
      // Calculate count inline to avoid dependency issues
      const calculatedCount = course?.question_count !== undefined 
        ? course.question_count 
        : questions.filter(q => q.course_id === formData.course_id).length;
      console.log('Course preview debug - course_id:', formData.course_id, 'course:', course, 'backend_question_count:', course?.question_count, 'calculated_count:', calculatedCount);
    }
  }, [formData.course_id, courses, questions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateQuestion = async () => {
    try {
      setIsUpdatingCount(true);
      console.log('Creating question for course:', formData.course_id);
      console.log('Current courses state:', courses);
      
      await questionsAPI.createQuestion(formData);
      
      // Add the new question to local state immediately for instant feedback
      console.log('Adding new question locally for course:', formData.course_id);
      
      // Also add the new question to the local questions state for immediate feedback
      const newQuestion: Partial<Question> = {
        id: `temp-${Date.now()}`, // Temporary ID
        question: formData.question,
        sample_answer: formData.sample_answer,
        marking_scheme: formData.marking_scheme,
        course_id: formData.course_id,
        difficulty_level: formData.difficulty_level || 'medium',
        points: formData.points || 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setQuestions(prevQuestions => [newQuestion as Question, ...prevQuestions]);
      
      toast.success('Question created successfully');
      setQuestionCreated(true);
      
      // Show the updated count briefly before closing the modal
      setTimeout(() => {
        setShowCreateModal(false);
        // Don't reset form immediately to avoid interfering with the count display
        setTimeout(() => {
          resetForm();
          setQuestionCreated(false);
        }, 100);
      }, 3000); // Keep modal open for 3 seconds to show the updated count
      
    } catch (error) {
      console.error('Failed to create question:', error);
      toast.error('Failed to create question');
    } finally {
      setIsUpdatingCount(false);
    }
  };

  const handleUpdateQuestion = async () => {
    if (!selectedQuestion) return;
    
    try {
      const updateData: QuestionUpdate = {
        question: formData.question || selectedQuestion.question,
        sample_answer: formData.sample_answer || selectedQuestion.sample_answer,
        marking_scheme: formData.marking_scheme || selectedQuestion.marking_scheme,
        difficulty_level: formData.difficulty_level || selectedQuestion.difficulty_level,
        points: formData.points || selectedQuestion.points
      };
      
      await questionsAPI.updateQuestion(selectedQuestion.id, updateData);
      toast.success('Question updated successfully');
      setShowEditModal(false);
      setSelectedQuestion(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to update question:', error);
      toast.error('Failed to update question');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    try {
      setIsUpdatingCount(true);
      // Find the question to get its course_id before deleting
      const questionToDelete = questions.find(q => q.id === questionId);
      
      await questionsAPI.deleteQuestion(questionId);
      
      // Remove the question from local state immediately for instant feedback
      if (questionToDelete) {
        setQuestions(prevQuestions => 
          prevQuestions.filter(q => q.id !== questionId)
        );
        console.log('Removed question from local state:', questionId);
      }
      
      toast.success('Question deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to delete question:', error);
      toast.error('Failed to delete question');
    } finally {
      setIsUpdatingCount(false);
    }
  };

  const openEditModal = (question: Question) => {
    setSelectedQuestion(question);
    setFormData({
      question: question.question,
      sample_answer: question.sample_answer,
      marking_scheme: question.marking_scheme,
      course_id: question.course_id,
      difficulty_level: question.difficulty_level,
      points: question.points
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      question: '',
      sample_answer: '',
      marking_scheme: [''],
      course_id: courses.length > 0 ? courses[0].id : '',
      difficulty_level: 'medium',
      points: 1
    });
    setCurrentStep(1);
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return formData.course_id; // Only require course selection to proceed
      case 2:
        return formData.question && formData.sample_answer; // Require question and answer
      case 3:
        return formData.difficulty_level && (formData.points || 0) > 0; // Require settings
      case 4:
        return formData.marking_scheme.length > 0 && formData.marking_scheme.every(item => item.trim()); // Require marking scheme
      default:
        return true;
    }
  };

  const addMarkingSchemeItem = () => {
    setFormData(prev => ({
      ...prev,
      marking_scheme: [...prev.marking_scheme, '']
    }));
  };

  const removeMarkingSchemeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      marking_scheme: prev.marking_scheme.filter((_, i) => i !== index)
    }));
  };

  const updateMarkingSchemeItem = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      marking_scheme: prev.marking_scheme.map((item, i) => i === index ? value : item)
    }));
  };

  // Filter questions based on selected course and search term
  const filteredQuestions = questions.filter(question => {
    const matchesCourse = selectedCourseId === 'all' || question.course_id === selectedCourseId;
    const matchesSearch = question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.sample_answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCourse && matchesSearch;
  });

  // Helper function to get question count for a course
  const getQuestionCountForCourse = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    // If backend provides question_count, use it
    if (course?.question_count !== undefined) {
      return course.question_count;
    }
    // Otherwise, calculate it from local questions
    return questions.filter(q => q.course_id === courseId).length;
  };

  // Helper functions for expandable questions
  const toggleQuestionExpansion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const isQuestionExpanded = (questionId: string) => expandedQuestions.has(questionId);

  // Get course name by ID
  const getCourseName = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.title : 'Unknown Course';
  };

  // Get difficulty color and icon
  const getDifficultyInfo = (level: string) => {
    switch (level) {
      case 'easy':
        return { color: 'bg-green-100 text-green-800 border-green-200', icon: '🟢' };
      case 'medium':
        return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '🟡' };
      case 'hard':
        return { color: 'bg-red-100 text-red-800 border-red-200', icon: '🔴' };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '⚪' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-dark-800 to-dark-900 rounded-xl p-8 border border-dark-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Question Management</h1>
            <p className="text-gray-300 text-lg">Create and manage questions for your courses with AI-powered grading</p>
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {courses.length} courses available
              </div>
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                {questions.length} questions created
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3"
          >
            <Plus className="h-6 w-6" />
            Create Question
          </button>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-dark-900 rounded-xl p-6 border border-dark-800 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Course Filter */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-200 mb-3">
              Filter by Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="input-field w-full bg-dark-800 border-dark-700 focus:border-primary-500"
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
            <label className="block text-sm font-semibold text-gray-200 mb-3">
              Search Questions
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search questions or answers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field w-full pl-12 bg-dark-800 border-dark-700 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-end">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{filteredQuestions.length}</div>
              <div className="text-sm text-gray-400">Questions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Questions Grid */}
      {filteredQuestions.length === 0 ? (
        <div className="text-center py-16 bg-dark-900 rounded-xl border border-dark-800">
          <HelpCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No questions found</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {selectedCourseId === 'all' 
              ? 'Create your first question to get started with AI-powered grading.'
              : 'No questions found for this course. Start building your question bank!'
            }
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary px-6 py-3 text-lg"
          >
            Create Your First Question
          </button>
        </div>
      ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredQuestions.map((question) => (
                <div key={question.id} className="bg-dark-900 rounded-xl border border-dark-800 hover:border-dark-700 transition-all duration-200 hover:shadow-xl overflow-hidden">
                  {/* Question Header - Always Visible */}
                  <div className="p-4 border-b border-dark-800">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-600 text-white">
                            {getCourseName(question.course_id)}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyInfo(question.difficulty_level).color}`}>
                            {getDifficultyInfo(question.difficulty_level).icon} {question.difficulty_level}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                            {question.points} pts
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-white leading-relaxed line-clamp-2 mb-3">
                          {question.question}
                        </h3>
                        
                        {/* Quick Actions Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleQuestionExpansion(question.id)}
                              className="text-xs text-gray-400 hover:text-primary-400 px-2 py-1 rounded hover:bg-dark-800 transition-colors flex items-center gap-1"
                            >
                              {isQuestionExpanded(question.id) ? (
                                <>
                                  <ChevronUp className="h-3 w-3" />
                                  Collapse
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3 w-3" />
                                  Expand
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => openEditModal(question)}
                              className="text-xs text-gray-400 hover:text-primary-400 px-2 py-1 rounded hover:bg-dark-800 transition-colors flex items-center gap-1"
                            >
                              <Edit className="h-3 w-3" />
                              Edit
                            </button>
                          </div>
                          <button
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                                                  {/* Expandable Content */}
                  <div className={`border-t border-dark-800 overflow-hidden transition-all duration-300 ease-in-out ${
                    isQuestionExpanded(question.id) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="p-4 space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Sample Answer
                        </h4>
                        <div className="max-h-32 overflow-y-auto bg-dark-800 p-3 rounded-lg border border-dark-700 hover:border-dark-600 transition-colors duration-200 scrollable-content">
                          <p className="text-gray-300 text-sm leading-relaxed pr-2">
                            {question.sample_answer}
                          </p>
                          {question.sample_answer.length > 200 && (
                            <div className="text-xs text-gray-500 mt-2 text-center italic">
                              ↕️ Scroll to see more
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Marking Scheme ({question.marking_scheme.length} rules)
                        </h4>
                        <div className="max-h-32 overflow-y-auto space-y-2 border border-dark-700 rounded-lg p-2 hover:border-dark-600 transition-colors duration-200 scrollable-content">
                          {question.marking_scheme.map((item, index) => (
                            <div key={index} className="text-sm text-gray-400 bg-dark-800 p-2 rounded border-l-2 border-primary-500">
                            • {item}
                            </div>
                          ))}
                          {question.marking_scheme.length > 3 && (
                            <div className="text-xs text-gray-500 text-center italic py-1">
                              ↕️ Scroll to see all rules
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Create Question Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 rounded-2xl w-full max-w-4xl max-h-[85vh] border border-dark-700 shadow-2xl flex flex-col">
            {/* Step Indicator */}
            <div className="bg-dark-800 border-b border-dark-700 p-4 rounded-t-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Create New Question</h2>
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
              
              {/* Step Progress */}
              <div className="flex items-center justify-between">
                {[
                  { number: 1, title: 'Course', icon: '📚' },
                  { number: 2, title: 'Content', icon: '📝' },
                  { number: 3, title: 'Settings', icon: '⚙️' },
                  { number: 4, title: 'Grading', icon: '🎯' }
                ].map((step, index) => (
                  <div key={step.number} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                      currentStep >= step.number 
                        ? 'border-primary-500 bg-primary-500 text-white' 
                        : 'border-dark-600 text-gray-400'
                    }`}>
                      {currentStep > step.number ? '✓' : step.number}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-300">{step.title}</div>
                      <div className="text-xs text-gray-500">{step.icon}</div>
                    </div>
                    {index < 3 && (
                      <div className={`w-16 h-0.5 mx-4 transition-all duration-200 ${
                        currentStep > step.number ? 'bg-primary-500' : 'bg-dark-600'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Step Content */}
            <div className="p-4 pb-6 overflow-y-auto flex-1">
              {/* Step 1: Course Selection */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 bg-opacity-10 rounded-full text-primary-400 text-sm font-medium mb-3">
                      Step 1 of 4
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Select Course</h3>
                    <p className="text-gray-400">Choose which course this question belongs to</p>
                  </div>
                  
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative bg-dark-800 rounded-2xl p-4 border border-dark-700 hover:border-primary-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-primary-400" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-200">Course Selection *</label>
                          <p className="text-xs text-gray-500">Choose which course this question belongs to</p>
                        </div>
                      </div>
                      <select
                        value={formData.course_id}
                        onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                        className="w-full bg-dark-700/50 border-2 border-dark-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 hover:border-dark-500"
                        required
                      >
                        <option value="">🎯 Select a course to get started...</option>
                        {courses.map((course) => (
                          <option key={course.id} value={course.id}>
                            📚 {course.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Course Preview */}
                  {formData.course_id && (
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative bg-gradient-to-r from-dark-800 to-dark-700 rounded-2xl p-4 border border-green-500/30 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                              <BookOpen className="h-6 w-6 text-green-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-200">Selected Course</h4>
                              <p className="text-xs text-gray-500">You're all set to create questions for this course</p>
                            </div>
                          </div>
                          <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                          </div>
                        </div>
                        <div className="bg-dark-900/50 rounded-xl p-3 border border-dark-600">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="text-white font-semibold text-lg">
                                {courses.find(c => c.id === formData.course_id)?.title}
                              </div>
                              <div className="text-gray-400 text-sm mt-1">
                                {courses.find(c => c.id === formData.course_id)?.subject} • {courses.find(c => c.id === formData.course_id)?.academic_year}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500 mb-1">Questions</div>
                              <div className={`text-2xl font-bold text-green-400 transition-all duration-500 ${
                                isUpdatingCount ? 'scale-110 text-green-300 animate-pulse' : questionCreated ? 'scale-105 text-green-300' : ''
                              }`}>
                                {getQuestionCountForCourse(formData.course_id)}
                              </div>
                              {isUpdatingCount && (
                                <div className="text-xs text-green-400 mt-1 animate-pulse">
                                  Updating...
                                </div>
                              )}
                              {questionCreated && (
                                <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                  +1 Added!
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Question Content */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 bg-opacity-10 rounded-full text-primary-400 text-sm font-medium mb-2">
                      Step 2 of 4
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Question Content</h3>
                    <p className="text-gray-400">Write your question and provide a sample answer</p>
                  </div>
                  
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative bg-dark-800 rounded-2xl p-4 border border-dark-700 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                          <HelpCircle className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-200">Question *</label>
                          <p className="text-xs text-gray-500">Write a clear and engaging question for your students</p>
                        </div>
                      </div>
                      <div className="relative">
                        <textarea
                          value={formData.question}
                          onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                          className="w-full bg-dark-700/50 border-2 border-dark-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 hover:border-dark-500 resize-none"
                          placeholder="💭 What would you like to ask your students? Be specific and clear..."
                          rows={3}
                          required
                        />
                        <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                          {formData.question.length}/500
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative bg-dark-800 rounded-2xl p-4 border border-dark-700 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                          <div className="w-5 h-5 bg-purple-400 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-200">Sample Answer *</label>
                          <p className="text-xs text-gray-500">Provide an ideal answer that students can reference</p>
                        </div>
                      </div>
                      <div className="relative">
                        <textarea
                          value={formData.sample_answer}
                          onChange={(e) => setFormData({ ...formData, sample_answer: e.target.value })}
                          className="w-full bg-dark-700/50 border-2 border-dark-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 hover:border-dark-500 resize-none"
                          placeholder="✨ Write a comprehensive sample answer that demonstrates the expected level of detail and understanding..."
                          rows={2}
                          required
                        />
                        <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                          {formData.sample_answer.length}/300
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Course Context */}
                  <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                    <h4 className="text-sm font-semibold text-gray-200 mb-2">Course Context</h4>
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-6 w-6 text-primary-500" />
                      <div>
                        <div className="text-white font-medium">
                          {courses.find(c => c.id === formData.course_id)?.title}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {courses.find(c => c.id === formData.course_id)?.subject} • {courses.find(c => c.id === formData.course_id)?.academic_year}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Question Settings */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 bg-opacity-10 rounded-full text-primary-400 text-sm font-medium mb-2">
                      Step 3 of 4
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Question Settings</h3>
                    <p className="text-gray-400">Configure difficulty level and scoring</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative bg-dark-800 rounded-2xl p-4 border border-dark-700 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                            <Star className="h-5 w-5 text-yellow-400" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-200">Difficulty Level</label>
                            <p className="text-xs text-gray-500">Set the complexity of your question</p>
                          </div>
                        </div>
                        <select
                          value={formData.difficulty_level}
                          onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value as any })}
                          className="w-full bg-dark-700/50 border-2 border-dark-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-200 hover:border-dark-500"
                        >
                          <option value="easy">🟢 Easy - Basic understanding</option>
                          <option value="medium">🟡 Medium - Applied knowledge</option>
                          <option value="hard">🔴 Hard - Advanced analysis</option>
                        </select>
                      </div>
                    </div>

                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative bg-dark-800 rounded-2xl p-4 border border-dark-700 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                            <Tag className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-200">Points</label>
                            <p className="text-xs text-gray-500">Assign value to this question</p>
                          </div>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            value={formData.points}
                            onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                            className="w-full bg-dark-700/50 border-2 border-dark-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 hover:border-dark-500"
                            placeholder="5"
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 bg-dark-800 px-2 py-1 rounded">
                            pts
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Question Preview */}
                  <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                    <h4 className="text-sm font-semibold text-gray-200 mb-2">Question Preview</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-600 text-white">
                          {courses.find(c => c.id === formData.course_id)?.title || 'Course'}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyInfo(formData.difficulty_level || 'medium').color}`}>
                          {getDifficultyInfo(formData.difficulty_level || 'medium').icon} {formData.difficulty_level || 'medium'}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600 text-white">
                          {formData.points || 1} pts
                        </span>
                      </div>
                      <div className="text-gray-300 text-sm">
                        <strong>Q:</strong> {formData.question || 'Your question will appear here...'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Marking Scheme & Review */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 bg-opacity-10 rounded-full text-primary-400 text-sm font-medium mb-2">
                      Step 4 of 4
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Marking Scheme & Review</h3>
                    <p className="text-gray-400">Define grading rules and review your question</p>
                  </div>
                  
                  {/* Marking Scheme Section */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative bg-dark-800 rounded-2xl p-4 border border-dark-700 hover:border-red-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                            <div className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-200">Marking Rules *</label>
                            <p className="text-xs text-gray-500">Define how answers will be evaluated</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={addMarkingSchemeItem}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 px-4 py-2 rounded-xl border border-red-500/30 hover:border-red-500/50 transition-all duration-200 flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Rule
                        </button>
                      </div>
                    
                      {/* Marking Scheme Hints */}
                      <div className="mb-4 p-3 bg-dark-700 rounded-lg border border-dark-600">
                        <button
                          type="button"
                          onClick={() => setShowHints(!showHints)}
                          className="w-full flex items-center justify-between text-left"
                        >
                          <h5 className="text-sm font-semibold text-white">Marking Scheme Rules & Hints</h5>
                          <span className="text-xs text-primary-400 font-medium">
                            {showHints ? 'Click to collapse' : 'Click to expand'}
                          </span>
                        </button>
                        {showHints && (
                          <div className="space-y-3 text-xs text-gray-300 mt-4">
                            <div className="grid grid-cols-1 gap-3">
                              <div className="flex items-start gap-2">
                                <span className="text-primary-400 font-medium">• Mentions:</span>
                                <span>Use <code className="bg-dark-600 px-1 rounded">[mentions: "concept", "theory"]</code> to check if specific terms are included</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="text-primary-400 font-medium">• Contains:</span>
                                <span>Use <code className="bg-dark-600 px-1 rounded">[contains: "key phrase"]</code> to verify essential content is present</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="text-primary-400 font-medium">• Semantic:</span>
                                <span>Use <code className="bg-dark-600 px-1 rounded">[semantic: "concept explanation"]</code> to check meaning similarity</span>
                              </div>
                            </div>
                            <div className="mt-3 p-3 bg-dark-600 rounded text-gray-400">
                              <strong>Examples:</strong><br/>
                              • <code className="bg-dark-500 px-1 rounded">[mentions: "photosynthesis", "chlorophyll"]</code><br/>
                              • <code className="bg-dark-500 px-1 rounded">[contains: "energy conversion process"]</code><br/>
                              • <code className="bg-dark-500 px-1 rounded">[semantic: "plants convert light to chemical energy"]</code>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        {formData.marking_scheme.map((item, index) => (
                          <div key={index} className="group/item relative">
                            <div className="bg-dark-700/50 rounded-xl p-4 border border-dark-600 hover:border-red-500/30 transition-all duration-200">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center text-xs text-red-400 font-medium">
                                  {index + 1}
                                </div>
                                <input
                                  type="text"
                                  value={item}
                                  onChange={(e) => updateMarkingSchemeItem(index, e.target.value)}
                                  className="flex-1 bg-transparent border-none text-white placeholder-gray-400 focus:outline-none focus:ring-0 text-sm"
                                  placeholder="🎯 Enter marking rule (e.g., 'mentions key concept', 'contains formula', 'semantic understanding')..."
                                  required
                                />
                                {formData.marking_scheme.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeMarkingSchemeItem(index)}
                                    className="opacity-0 group-hover/item:opacity-100 text-red-400 hover:text-red-400 hover:bg-red-500/20 p-2 rounded-lg transition-all duration-200"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {formData.marking_scheme.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                              <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                                <div className="w-4 h-4 bg-red-400 rounded-full"></div>
                              </div>
                            </div>
                            <p className="text-sm">No marking rules yet</p>
                            <p className="text-xs text-gray-600 mt-1">Add rules to define how answers will be graded</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Review Section */}
                  <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                    <h4 className="text-sm font-semibold text-gray-200 mb-3">Question Summary</h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-600 text-white">
                          {courses.find(c => c.id === formData.course_id)?.title || 'Course'}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyInfo(formData.difficulty_level || 'medium').color}`}>
                          {getDifficultyInfo(formData.difficulty_level || 'medium').icon} {formData.difficulty_level || 'medium'}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600 text-white">
                          {formData.points || 1} pts
                        </span>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-gray-300 mb-2">Question:</div>
                        <div className="text-gray-300 text-sm bg-dark-700 p-3 rounded-lg">{formData.question}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-gray-300 mb-2">Sample Answer:</div>
                        <div className="text-gray-300 text-sm bg-dark-700 p-3 rounded-lg">{formData.sample_answer}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-gray-300 mb-2">Marking Scheme ({formData.marking_scheme.length} rules):</div>
                        <div className="space-y-2">
                          {formData.marking_scheme.map((item, index) => (
                            <div key={index} className="text-gray-300 text-sm bg-dark-700 p-2 rounded border-l-2 border-primary-500">
                              • {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-dark-900 border-t border-dark-800 p-4 rounded-b-2xl flex-shrink-0">
              <div className="flex gap-4">
                {currentStep === 1 ? (
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="btn-secondary flex-1 py-3 text-lg"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    onClick={prevStep}
                    className="btn-secondary flex-1 py-3 text-lg flex items-center justify-center gap-2"
                  >
                    ← Previous
                  </button>
                )}
                
                {currentStep < 4 ? (
                  <button
                    onClick={nextStep}
                    disabled={!canProceedToNext()}
                    className="btn-primary flex-1 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={handleCreateQuestion}
                    disabled={!formData.question || !formData.sample_answer || !formData.course_id || formData.marking_scheme.some(item => !item.trim())}
                    className="btn-primary flex-1 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Create Question
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Edit Question Modal */}
      {showEditModal && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-dark-700 shadow-2xl">
            <div className="sticky top-0 bg-dark-900 border-b border-dark-800 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Edit Question</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedQuestion(null);
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
                  Course
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

              {/* Question Input */}
              <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  Question *
                </label>
                <textarea
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="input-field w-full bg-dark-700 border-dark-600 focus:border-primary-500"
                  placeholder="Enter your question here..."
                  rows={4}
                  required
                />
              </div>

              {/* Sample Answer */}
              <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  Sample Answer *
                </label>
                <textarea
                  value={formData.sample_answer}
                  onChange={(e) => setFormData({ ...formData, sample_answer: e.target.value })}
                  className="input-field w-full bg-dark-700 border-dark-600 focus:border-primary-500"
                  placeholder="Provide a sample answer..."
                  rows={3}
                  required
                />
              </div>

              {/* Question Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Difficulty Level
                  </label>
                  <select
                    value={formData.difficulty_level}
                    onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value as any })}
                    className="input-field w-full bg-dark-700 border-dark-600 focus:border-primary-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Points
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                    className="input-field w-full bg-dark-700 border-dark-600 focus:border-primary-500"
                    placeholder="1"
                  />
                </div>
              </div>

              {/* Marking Scheme */}
              <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-semibold text-gray-200">
                    Marking Scheme *
                  </label>
                  <button
                    type="button"
                    onClick={addMarkingSchemeItem}
                    className="text-primary-500 hover:text-primary-400 text-sm font-medium hover:bg-primary-500 hover:bg-opacity-10 px-3 py-1 rounded-lg transition-colors"
                  >
                    + Add Rule
                  </button>
                </div>
                
                {/* Marking Scheme Hints */}
                <div className="mb-6 p-4 bg-dark-700 rounded-lg border border-dark-600">
                  <button
                    type="button"
                    onClick={() => setShowHints(!showHints)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <h5 className="text-sm font-semibold text-white">Marking Scheme Rules & Hints</h5>
                    <span className="text-xs text-primary-400 font-medium">
                      {showHints ? 'Click to collapse' : 'Click to expand'}
                    </span>
                  </button>
                  {showHints && (
                    <div className="space-y-3 text-xs text-gray-300 mt-4">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-start gap-2">
                          <span className="text-primary-400 font-medium">• Mentions:</span>
                          <span>Use <code className="bg-dark-600 px-1 rounded">[mentions: "concept", "theory"]</code> to check if specific terms are included</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-primary-400 font-medium">• Contains:</span>
                          <span>Use <code className="bg-dark-600 px-1 rounded">[contains: "key phrase"]</code> to verify essential content is present</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-primary-400 font-medium">• Semantic:</span>
                          <span>Use <code className="bg-dark-600 px-1 rounded">[semantic: "concept explanation"]</code> to check meaning similarity</span>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-dark-600 rounded text-gray-400">
                        <strong>Examples:</strong><br/>
                        • <code className="bg-dark-500 px-1 rounded">[mentions: "photosynthesis", "chlorophyll"]</code><br/>
                        • <code className="bg-dark-500 px-1 rounded">[contains: "energy conversion process"]</code><br/>
                        • <code className="bg-dark-500 px-1 rounded">[semantic: "plants convert light to chemical energy"]</code>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  {formData.marking_scheme.map((item, index) => (
                    <div key={index} className="flex gap-3">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateMarkingSchemeItem(index, e.target.value)}
                        className="input-field flex-1 bg-dark-700 border-dark-600 focus:border-primary-500"
                        placeholder={`Marking scheme rule ${index + 1} (e.g., [mentions: "key term"] or [contains: "essential content"])`}
                        required
                      />
                      {formData.marking_scheme.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMarkingSchemeItem(index)}
                          className="text-red-500 hover:text-red-400 p-2 hover:bg-red-500 hover:bg-opacity-10 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-dark-900 border-t border-dark-800 p-6 rounded-b-2xl">
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedQuestion(null);
                    resetForm();
                  }}
                  className="btn-secondary flex-1 py-3 text-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateQuestion}
                  disabled={!formData.question || !formData.sample_answer || formData.marking_scheme.some(item => !item.trim())}
                  className="btn-primary flex-1 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update Question
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionManagement;
