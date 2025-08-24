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
  Copy
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
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);
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
      
      // Normalize questions with stable UI keys
      const rawQs = questionsRes.data ?? [];
      const normalizedQs = rawQs.map((q: any, i: number) => ({
        ...q,
        _uiKey: buildUiKey(q, i),
      }));
      setQuestions(normalizedQs);
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
      // const course = courses.find(c => c.id === formData.course_id);
      // Calculate count inline to avoid dependency issues
      // const calculatedCount = course?.question_count !== undefined 
      //   ? course.question_count 
      //   : questions.filter(q => q.course_id === formData.course_id).length;
    }
  }, [formData.course_id, courses, questions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateQuestion = async () => {
    try {
      setIsUpdatingCount(true);
      
      await questionsAPI.createQuestion(formData);
      
      // Add the new question to local state immediately for instant feedback
      
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
      
      // Give the new question a UI key
      (newQuestion as any)._uiKey = buildUiKey(newQuestion, questions.length);
      
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
      
      // Update local state instead of refetching to preserve expansion state
      setQuestions(prevQuestions => 
        prevQuestions.map(q => 
          q.id === selectedQuestion.id 
            ? { ...q, ...updateData, updated_at: new Date().toISOString() }
            : q
        )
      );
      

      
      toast.success('Question updated successfully');
      setShowEditModal(false);
      setSelectedQuestion(null);
      resetForm();
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
      }
      

      
      toast.success('Question deleted successfully');
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

  // Helper function to build stable UI keys that can't collide
  const buildUiKey = (q: any, i: number) => {
    // be defensive about shapes: id/_id, course_id/course?.id
    const id = q.id ?? q._id ?? `noid`;
    const courseId =
      q.course_id ??
      (typeof q.course === 'object' ? q.course?.id : q.course) ??
      `nocourse`;
    return `${String(courseId)}::${String(id)}::${i}`; // index keeps keys unique even if above collide
  };

  // Helper function to get UI key
  const getUiKey = (q: any) => (q as any)._uiKey as string;
  
  // Helper function to open view modal
  const openViewModal = (question: Question) => {
    setViewingQuestion(question);
    setShowViewModal(true);
  };



  // Get course name by ID
  const getCourseName = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.title : 'Unknown Course';
  };



  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search questions"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    <div className="space-y-4">
      {/* Slim Toolbar Header */}
      <div className="bg-dark-900 rounded-xl border border-dark-800 shadow-lg">
        <div className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold text-white">Question Management</h1>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <BookOpen className="h-4 w-4" />
                  {courses.length} courses
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <HelpCircle className="h-4 w-4" />
                  {questions.length} questions
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary px-6 py-2 text-sm font-semibold flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Question
            </button>
          </div>
        </div>
      </div>

      {/* Compact Filters */}
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search questions... (Press / to focus)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field w-full pl-10 bg-dark-800 border-dark-700 focus:border-primary-500 text-sm py-2"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 bg-dark-700 px-2 py-1 rounded">
                /
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Showing</span>
            <span className="font-bold text-white">{filteredQuestions.length}</span>
            <span className="text-sm text-gray-400">questions</span>
          </div>
        </div>
      </div>

      {/* Compact Question Tiles */}
      {filteredQuestions.length === 0 ? (
        <div className="text-center py-12 bg-dark-900 rounded-xl border border-dark-800">
          <HelpCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">No questions found</h3>
          <p className="text-gray-400 mb-4 max-w-md mx-auto">
            {selectedCourseId === 'all' 
              ? 'Create your first question to get started with AI-powered grading.'
              : 'No questions found for this course. Start building your question bank!'
            }
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary px-4 py-2 text-sm"
          >
            Create Your First Question
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredQuestions.map((question) => {
            const key = getUiKey(question);
            
            return (
              <div 
                key={key}
                className="bg-dark-900 rounded-lg border border-dark-800 transition-all duration-200 hover:shadow-lg hover:border-primary-500/50 group"
              >
                {/* Compact Question Tile */}
                <div className="p-3">
                {/* Metadata Row */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-600 text-white">
                    {getCourseName(question.course_id)}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyInfo(question.difficulty_level).color}`}>
                    {getDifficultyInfo(question.difficulty_level).icon}
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                    {question.points}
                  </span>
                </div>
                
                {/* Question Title - Clamped */}
                <h3 className="text-sm font-medium text-white leading-tight line-clamp-2 mb-3 group-hover:text-primary-300 transition-colors">
                  {question.question}
                </h3>
                
                {/* Quick Actions - Always visible */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-800">
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openViewModal(question);
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors relative group/btn"
                      title="View Question"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap z-10">
                        View
                      </span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(question);
                      }}
                      className="p-1.5 text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 rounded transition-colors relative group/btn"
                      title="Edit Question"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap z-10">
                        Edit
                      </span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(question.question);
                        toast.success('Question copied to clipboard');
                      }}
                      className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors relative group/btn"
                      title="Copy Question"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap z-10">
                        Copy
                      </span>
                    </button>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteQuestion(question.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors relative group/btn"
                    title="Delete Question"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap z-10">
                      Delete
                    </span>
                  </button>
                </div>
              </div>
            </div>
            );
          })}
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

      {/* View Question Modal */}
      {showViewModal && viewingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-dark-700 shadow-2xl">
            <div className="sticky top-0 bg-dark-900 border-b border-dark-800 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Question Details</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setViewingQuestion(null);
                    }}
                    className="text-gray-400 hover:text-white p-2 hover:bg-dark-800 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Course Info */}
              <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                <div className="flex items-center gap-3 mb-3">
                  <BookOpen className="h-6 w-6 text-primary-500" />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-200">Course</h4>
                    <p className="text-xs text-gray-500">Question belongs to this course</p>
                  </div>
                </div>
                <div className="text-white font-medium">
                  {getCourseName(viewingQuestion.course_id)}
                </div>
              </div>

              {/* Question */}
              <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                <h4 className="text-sm font-semibold text-gray-200 mb-3">Question</h4>
                <div className="text-white text-lg leading-relaxed">
                  {viewingQuestion.question}
                </div>
              </div>

              {/* Sample Answer */}
              <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                <h4 className="text-sm font-semibold text-gray-200 mb-3">Sample Answer</h4>
                <div className="text-gray-300 text-base leading-relaxed">
                  {viewingQuestion.sample_answer}
                </div>
              </div>

              {/* Question Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                  <h4 className="text-sm font-semibold text-gray-200 mb-2">Difficulty</h4>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyInfo(viewingQuestion.difficulty_level).color}`}>
                    {getDifficultyInfo(viewingQuestion.difficulty_level).icon} {viewingQuestion.difficulty_level}
                  </div>
                </div>
                <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                  <h4 className="text-sm font-semibold text-gray-200 mb-2">Points</h4>
                  <div className="text-white text-lg font-semibold">
                    {viewingQuestion.points}
                  </div>
                </div>
                <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                  <h4 className="text-sm font-semibold text-gray-200 mb-2">Created</h4>
                  <div className="text-gray-300 text-sm">
                    {new Date(viewingQuestion.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Marking Scheme */}
              <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                <h4 className="text-sm font-semibold text-gray-200 mb-3">Marking Scheme ({viewingQuestion.marking_scheme.length} rules)</h4>
                <div className="space-y-2">
                  {viewingQuestion.marking_scheme.map((item, index) => (
                    <div key={index} className="text-gray-300 text-sm bg-dark-700 p-3 rounded border-l-2 border-primary-500">
                      • {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-dark-900 border-t border-dark-800 p-6 rounded-b-2xl">
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingQuestion(null);
                  }}
                  className="btn-secondary flex-1 py-3 text-lg"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingQuestion(null);
                    openEditModal(viewingQuestion);
                  }}
                  className="btn-primary flex-1 py-3 text-lg"
                >
                  Edit Question
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
