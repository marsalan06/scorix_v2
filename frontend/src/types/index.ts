// User types
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  first_name: string;
  last_name: string;
  created_at: string;
  last_login?: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  role: 'student' | 'teacher' | 'admin';
  first_name?: string;
  last_name?: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface UserUpdate {
  username?: string;
  email?: string;
  role?: 'student' | 'teacher' | 'admin';
  first_name?: string;
  last_name?: string;
}

// Course types
export interface Course {
  id: string;
  title: string;
  description?: string;
  subject: string;
  academic_year: string;
  teacher_id: string;
  student_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface CourseCreate {
  title: string;
  description?: string;
  subject: string;
  academic_year: string;
}

export interface CourseUpdate {
  title?: string;
  description?: string;
  subject?: string;
  academic_year?: string;
}

// Question types
export interface Question {
  id: string;
  question: string;
  sample_answer: string;
  marking_scheme: string[];
  course_id: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  points: number;
  teacher_id: string;
  created_at: string;
  updated_at: string;
}

export interface QuestionCreate {
  question: string;
  sample_answer: string;
  marking_scheme: string[];
  course_id: string;
  difficulty_level?: 'easy' | 'medium' | 'hard';
  points?: number;
}

export interface QuestionUpdate {
  question?: string;
  sample_answer?: string;
  marking_scheme?: string[];
  difficulty_level?: 'easy' | 'medium' | 'hard';
  points?: number;
}

// Test types
export interface Test {
  id: string;
  title: string;
  description?: string;
  course_id: string;
  duration_minutes: number;
  total_points: number;
  is_active: boolean;
  question_ids: string[];
  teacher_id: string;
  created_at: string;
  updated_at: string;
}

export interface TestCreate {
  title: string;
  description?: string;
  course_id: string;
  duration_minutes?: number;
  total_points?: number;
  is_active?: boolean;
  question_ids: string[];
}

export interface TestUpdate {
  title?: string;
  description?: string;
  duration_minutes?: number;
  total_points?: number;
  is_active?: boolean;
  question_ids?: string[];
}

// Student Answer types
export interface StudentAnswer {
  id: string;
  student_name: string;
  student_roll_no: string;
  answer: string;
  question_id: string;
  course_id: string;
  student_id: string;
  created_at: string;
}

export interface StudentAnswerCreate {
  student_name: string;
  student_roll_no: string;
  answer: string;
  question_id: string;
  course_id: string;
}

// Test Answer types
export interface TestAnswer {
  id: string;
  test_id: string;
  course_id: string;
  student_name: string;
  student_roll_no: string;
  question_answers: Record<string, string>;
  student_id: string;
  created_at: string;
}

export interface TestAnswerCreate {
  test_id: string;
  course_id: string;
  student_name: string;
  student_roll_no: string;
  question_answers: Record<string, string>;
}

// Grading types
export interface GradeThresholds {
  A: number;
  B: number;
  C: number;
  D: number;
  F: number;
}

export interface GradingResult {
  student_name: string;
  student_roll_no: string;
  question_id: string;
  course_id: string;
  score: number;
  grade: string;
  points_earned: number;
  matched_rules: string[];
  missed_rules: string[];
}

export interface TestGradingResult {
  test_id: string;
  course_id: string;
  student_name: string;
  student_roll_no: string;
  overall_score: number;
  overall_grade: string;
  total_points_earned: number;
  question_results: GradingResult[];
}

// Note types
export interface Note {
  id: string;
  title: string;
  content: string;
  course_id: string;
  note_type: 'general' | 'lecture' | 'assignment' | 'exam';
  teacher_id: string;
  created_at: string;
  updated_at: string;
}

export interface NoteCreate {
  title: string;
  content: string;
  course_id: string;
  note_type?: 'general' | 'lecture' | 'assignment' | 'exam';
}

export interface NoteUpdate {
  title?: string;
  content?: string;
  note_type?: 'general' | 'lecture' | 'assignment' | 'exam';
}

// API Response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

// Form types
export interface LoginForm {
  username: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'student' | 'teacher' | 'admin';
  first_name: string;
  last_name: string;
}
