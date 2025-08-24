import axios from 'axios';

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log detailed error information for debugging
    if (error.response) {
      console.error('API Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    
    // Only handle 401 errors for authenticated requests (not for login attempts)
    if (error.response?.status === 401 && error.config?.url !== '/auth/login') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials: { username: string; password: string }) =>
    api.post('/auth/login', credentials),
  register: (userData: any) => api.post('/auth/register', userData),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (profileData: any) => api.patch('/users/profile', profileData),
};

export const coursesAPI = {
  getTeacherCourses: () => api.get('/courses/teacher'),
  getStudentCourses: () => api.get('/courses/student'),
  getCourse: (id: string) => api.get(`/courses/${id}`),
  createCourse: (courseData: any) => api.post('/courses', courseData),
  updateCourse: (id: string, courseData: any) => api.put(`/courses/${id}`, courseData),
  deleteCourse: (id: string) => api.delete(`/courses/${id}`),
  enrollStudent: (courseId: string, studentId: string) =>
    api.post(`/courses/${courseId}/enroll`, { course_id: courseId, student_id: studentId }),
  unenrollStudent: (courseId: string, studentId: string) =>
    api.delete(`/courses/${courseId}/unenroll/${studentId}`),
};

export const questionsAPI = {
  getCourseQuestions: (courseId: string) => api.get(`/questions/course/${courseId}`),
  getTeacherQuestions: () => api.get('/questions'),
  getQuestion: (id: string) => api.get(`/questions/${id}`),
  createQuestion: (questionData: any) => api.post('/questions', questionData),
  updateQuestion: (id: string, questionData: any) => api.put(`/questions/${id}`, questionData),
  deleteQuestion: (id: string) => api.delete(`/questions/${id}`),
};

export const testsAPI = {
  getCourseTests: (courseId: string) => api.get(`/tests/course/${courseId}`),
  getTeacherTests: () => api.get('/tests'),
  getTest: (id: string) => api.get(`/tests/${id}`),
  createTest: (testData: any) => api.post('/tests', testData),
  updateTest: (id: string, testData: any) => api.put(`/tests/${id}`, testData),
  deleteTest: (id: string) => api.delete(`/tests/${id}`),
};

export const gradingAPI = {
  gradeCourse: (courseId: string) => api.post(`/grade/course/${courseId}`),
  gradeTest: (testId: string) => api.post(`/grade-test/${testId}`),
  getGradeThresholds: () => api.get('/grade-thresholds'),
  updateGradeThresholds: (thresholds: any) => api.put('/grade-thresholds', thresholds),
};

export const studentAnswersAPI = {
  submitAnswer: (answerData: any) => api.post('/answers', answerData),
  submitTestAnswers: (testAnswerData: any) => api.post('/test-answers', testAnswerData),
  getCourseAnswers: (courseId: string) => api.get(`/answers/course/${courseId}`),
  getStudentAnswers: () => api.get('/answers'),
};

export const notesAPI = {
  getCourseNotes: (courseId: string) => api.get(`/notes/course/${courseId}`),
  getNote: (id: string) => api.get(`/notes/${id}`),
  createNote: (noteData: any) => api.post('/notes', noteData),
  updateNote: (id: string, noteData: any) => api.put(`/notes/${id}`, noteData),
  deleteNote: (id: string) => api.delete(`/notes/${id}`),
};
