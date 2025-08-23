import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  HelpCircle, 
  BookOpen,
  Filter,
  Search
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
  const [formData, setFormData] = useState<QuestionCreate>({
    question: '',
    sample_answer: '',
    marking_scheme: [''],
    course_id: '',
    difficulty_level: 'medium',
    points: 1
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [questionsRes, coursesRes] = await Promise.all([
        questionsAPI.getTeacherQuestions(),
        coursesAPI.getTeacherCourses(),
      ]);
      
      setQuestions(questionsRes.data);
      setCourses(coursesRes.data);
      
      // Set default course if available
      if (coursesRes.data.length > 0 && !formData.course_id) {
        setFormData(prev => ({ ...prev, course_id: coursesRes.data[0].id }));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to fetch questions and courses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    try {
      await questionsAPI.createQuestion(formData);
      toast.success('Question created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to create question:', error);
      toast.error('Failed to create question');
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
      await questionsAPI.deleteQuestion(questionId);
      toast.success('Question deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to delete question:', error);
      toast.error('Failed to delete question');
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

  // Get course name by ID
  const getCourseName = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.title : 'Unknown Course';
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
          <h1 className="text-2xl font-bold text-white">Question Management</h1>
          <p className="text-gray-300">Create and manage questions for your courses</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Question
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Course Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Filter by Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="input-field"
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
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search Questions
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search questions or answers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Questions Grid */}
      {filteredQuestions.length === 0 ? (
        <div className="text-center py-12">
          <HelpCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-white">No questions found</h3>
          <p className="mt-1 text-sm text-gray-400">
            {selectedCourseId === 'all' 
              ? 'Create your first question to get started.'
              : 'No questions found for this course.'
            }
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Question
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredQuestions.map((question) => (
            <div key={question.id} className="card hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-600 text-white">
                        {getCourseName(question.course_id)}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        question.difficulty_level === 'easy' ? 'bg-green-600 text-white' :
                        question.difficulty_level === 'medium' ? 'bg-yellow-600 text-white' :
                        'bg-red-600 text-white'
                      }`}>
                        {question.difficulty_level}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                        {question.points} pts
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-3">
                      {question.question}
                    </h3>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-1">Sample Answer:</h4>
                    <p className="text-sm text-gray-300 line-clamp-2">
                      {question.sample_answer}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-1">Marking Scheme:</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {question.marking_scheme.slice(0, 2).map((item, index) => (
                        <li key={index} className="line-clamp-1">• {item}</li>
                      ))}
                      {question.marking_scheme.length > 2 && (
                        <li className="text-gray-400">+{question.marking_scheme.length - 2} more items</li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(question)}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="btn-danger flex items-center justify-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Question Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-900 rounded-lg p-6 w-full max-w-2xl mx-4 border border-dark-700 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 text-white">Create New Question</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Course *
                </label>
                <select
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  className="input-field w-full"
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Question *
                </label>
                <textarea
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="input-field w-full"
                  placeholder="Enter your question here..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Sample Answer *
                </label>
                <textarea
                  value={formData.sample_answer}
                  onChange={(e) => setFormData({ ...formData, sample_answer: e.target.value })}
                  className="input-field w-full"
                  placeholder="Provide a sample answer..."
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Difficulty Level
                </label>
                <select
                  value={formData.difficulty_level}
                  onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value as any })}
                  className="input-field w-full"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Points
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                  className="input-field w-full"
                  placeholder="1"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Marking Scheme *
                  </label>
                  <button
                    type="button"
                    onClick={addMarkingSchemeItem}
                    className="text-primary-500 hover:text-primary-400 text-sm"
                  >
                    + Add Item
                  </button>
                </div>
                
                {/* Marking Scheme Hints */}
                <div className="mb-4 p-3 bg-dark-800 rounded-lg border border-dark-700">
                  <button
                    type="button"
                    onClick={() => setShowHints(!showHints)}
                    className="w-full flex items-center justify-between mb-2 text-left"
                  >
                    <h5 className="text-sm font-medium text-white">Marking Scheme Rules & Hints:</h5>
                    <span className="text-xs text-primary-400 font-medium">
                      {showHints ? 'Click to collapse' : 'Click to expand'}
                    </span>
                  </button>
                  {showHints && (
                    <div className="space-y-2 text-xs text-gray-300">
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-primary-400 font-medium">• Mentions:</span>
                          <span>Use <code className="bg-dark-700 px-1 rounded">[mentions: "concept", "theory"]</code> to check if specific terms are included</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-primary-400 font-medium">• Contains:</span>
                          <span>Use <code className="bg-dark-700 px-1 rounded">[contains: "key phrase"]</code> to verify essential content is present</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-primary-400 font-medium">• Semantic:</span>
                          <span>Use <code className="bg-dark-700 px-1 rounded">[semantic: "concept explanation"]</code> to check meaning similarity</span>
                        </div>
                      </div>
                      <div className="mt-2 p-2 bg-dark-700 rounded text-gray-400">
                        <strong>Examples:</strong><br/>
                        • <code className="bg-dark-600 px-1 rounded">[mentions: "photosynthesis", "chlorophyll"]</code><br/>
                        • <code className="bg-dark-600 px-1 rounded">[contains: "energy conversion process"]</code><br/>
                        • <code className="bg-dark-600 px-1 rounded">[semantic: "plants convert light to chemical energy"]</code>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  {formData.marking_scheme.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateMarkingSchemeItem(index, e.target.value)}
                        className="input-field flex-1"
                        placeholder={`Marking scheme item ${index + 1} (e.g., [mentions: "key term"] or [contains: "essential content"])`}
                        required
                      />
                      {formData.marking_scheme.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMarkingSchemeItem(index)}
                          className="text-red-500 hover:text-red-400 p-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateQuestion}
                disabled={!formData.question || !formData.sample_answer || !formData.course_id || formData.marking_scheme.some(item => !item.trim())}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                Create Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {showEditModal && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-900 rounded-lg p-6 w-full max-w-2xl mx-4 border border-dark-700 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 text-white">Edit Question</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Course
                </label>
                <select
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  className="input-field w-full"
                  required
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Question *
                </label>
                <textarea
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="input-field w-full"
                  placeholder="Enter your question here..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Sample Answer *
                </label>
                <textarea
                  value={formData.sample_answer}
                  onChange={(e) => setFormData({ ...formData, sample_answer: e.target.value })}
                  className="input-field w-full"
                  placeholder="Provide a sample answer..."
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Difficulty Level
                </label>
                <select
                  value={formData.difficulty_level}
                  onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value as any })}
                  className="input-field w-full"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Points
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                  className="input-field w-full"
                  placeholder="1"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Marking Scheme *
                  </label>
                  <button
                    type="button"
                    onClick={addMarkingSchemeItem}
                    className="text-primary-500 hover:text-primary-400 text-sm"
                  >
                    + Add Item
                  </button>
                </div>
                
                {/* Marking Scheme Hints */}
                <div className="mb-4 p-3 bg-dark-800 rounded-lg border border-dark-700">
                  <h5 className="text-sm font-medium text-white mb-2">Marking Scheme Rules & Hints:</h5>
                  <div className="space-y-2 text-xs text-gray-300">
                    <div className="flex items-start gap-2">
                      <span className="text-primary-400 font-medium">• Mentions:</span>
                      <span>Use <code className="bg-dark-700 px-1 rounded">[mentions: "concept", "theory"]</code> to check if specific terms are included</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary-400 font-medium">• Contains:</span>
                      <span>Use <code className="bg-dark-700 px-1 rounded">[contains: "key phrase"]</code> to verify essential content is present</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary-400 font-medium">• Semantic:</span>
                      <span>Use <code className="bg-dark-700 px-1 rounded">[semantic: "concept explanation"]</code> to check meaning similarity</span>
                    </div>
                    <div className="mt-2 p-2 bg-dark-700 rounded text-gray-400">
                      <strong>Examples:</strong><br/>
                      • <code className="bg-dark-600 px-1 rounded">[mentions: "photosynthesis", "chlorophyll"]</code><br/>
                      • <code className="bg-dark-600 px-1 rounded">[contains: "energy conversion process"]</code><br/>
                      • <code className="bg-dark-600 px-1 rounded">[semantic: "plants convert light to chemical energy"]</code>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {formData.marking_scheme.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateMarkingSchemeItem(index, e.target.value)}
                        className="input-field flex-1"
                        placeholder={`Marking scheme item ${index + 1} (e.g., [mentions: "key term"] or [contains: "essential content"])`}
                        required
                      />
                      {formData.marking_scheme.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMarkingSchemeItem(index)}
                          className="text-red-500 hover:text-red-400 p-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedQuestion(null);
                  resetForm();
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateQuestion}
                disabled={!formData.question || !formData.sample_answer || formData.marking_scheme.some(item => !item.trim())}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                Update Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionManagement;
