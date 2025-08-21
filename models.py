from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

class UserRole(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"

class UserBase(BaseModel):
    username: str = Field(
        ..., 
        min_length=3, 
        max_length=50,
        description="Username must be 3-50 characters long",
        example="john_doe"
    )
    email: str = Field(
        ..., 
        pattern=r"^[^@]+@[^@]+\.[^@]+$",
        description="Valid email address format",
        example="john.doe@example.com"
    )
    role: UserRole = Field(
        ...,
        description="User role determines access permissions",
        example="teacher"
    )
    first_name: str = Field(
        default="Unknown", 
        min_length=1, 
        max_length=50,
        description="User's first name",
        example="John"
    )
    last_name: str = Field(
        default="User", 
        min_length=1, 
        max_length=50,
        description="User's last name",
        example="Doe"
    )

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)

class UserLogin(BaseModel):
    username: str
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[str] = Field(None, pattern=r"^[^@]+@[^@]+\.[^@]+$")
    role: Optional[UserRole] = None
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)

class UserResponse(UserBase):
    id: str
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        populate_by_name = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class CourseBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    subject: str = Field(..., min_length=1, max_length=100)
    academic_year: str = Field(..., min_length=4, max_length=9)

class CourseCreate(CourseBase):
    pass

class CourseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    subject: Optional[str] = Field(None, min_length=1, max_length=100)
    academic_year: Optional[str] = Field(None, min_length=4, max_length=9)

class CourseResponse(CourseBase):
    id: str
    teacher_id: str
    student_ids: List[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class CourseEnrollment(BaseModel):
    course_id: str
    student_id: str

class QuestionBase(BaseModel):
    question: str = Field(
        ..., 
        min_length=1, 
        max_length=2000,
        description="The question text to be answered by students",
        example="What is Newton's Second Law of Motion?"
    )
    sample_answer: str = Field(
        ..., 
        min_length=1, 
        max_length=2000,
        description="Model answer for grading reference",
        example="Newton's Second Law states that force equals mass times acceleration (F = ma)"
    )
    marking_scheme: List[str] = Field(
        ..., 
        min_items=1,
        description="List of marking criteria for grading",
        example=["mentions F = ma", "explains the relationship between force, mass, and acceleration"]
    )
    course_id: str = Field(
        ...,
        description="ID of the course this question belongs to",
        example="course_123"
    )
    difficulty_level: str = Field(
        default="medium", 
        pattern="^(easy|medium|hard)$",
        description="Question difficulty level",
        example="medium"
    )
    points: int = Field(
        default=10, 
        ge=1, 
        le=100,
        description="Points awarded for correct answer (1-100)",
        example=10
    )

class QuestionCreate(QuestionBase):
    pass

class QuestionUpdate(BaseModel):
    question: Optional[str] = Field(None, min_length=1, max_length=2000)
    sample_answer: Optional[str] = Field(None, min_length=1, max_length=2000)
    marking_scheme: Optional[List[str]] = Field(None, min_items=1)
    difficulty_level: Optional[str] = Field(None, pattern="^(easy|medium|hard)$")
    points: Optional[int] = Field(None, ge=1, le=100)

class QuestionResponse(QuestionBase):
    id: str
    teacher_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class TestBase(BaseModel):
    title: str = Field(
        ..., 
        min_length=1, 
        max_length=200,
        description="Test title",
        example="Midterm Exam - Physics"
    )
    description: Optional[str] = Field(
        None, 
        max_length=1000,
        description="Optional test description",
        example="Covers chapters 1-5 on mechanics"
    )
    course_id: str = Field(
        ...,
        description="ID of the course this test belongs to",
        example="course_123"
    )
    duration_minutes: int = Field(
        default=60, 
        ge=15, 
        le=480,
        description="Test duration in minutes (15-480)",
        example=90
    )
    total_points: int = Field(
        default=100, 
        ge=10, 
        le=1000,
        description="Total points available for the test (10-1000)",
        example=100
    )
    is_active: bool = Field(
        default=True,
        description="Whether the test is currently active for students"
    )

class TestCreate(TestBase):
    question_ids: List[str] = Field(..., min_items=1)

class TestUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    duration_minutes: Optional[int] = Field(None, ge=15, le=480)
    total_points: Optional[int] = Field(None, ge=10, le=1000)
    is_active: Optional[bool] = None
    question_ids: Optional[List[str]] = Field(None, min_items=1)

class TestResponse(TestBase):
    id: str
    teacher_id: str
    question_ids: List[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class StudentAnswerBase(BaseModel):
    student_name: str = Field(..., min_length=1, max_length=100)
    student_roll_no: str = Field(..., min_length=1, max_length=50)
    answer: str = Field(..., min_length=1, max_length=5000)
    question_id: str
    course_id: str

class StudentAnswerCreate(StudentAnswerBase):
    pass

class StudentAnswerResponse(StudentAnswerBase):
    id: str
    student_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class TestAnswerBase(BaseModel):
    test_id: str
    course_id: str
    student_name: str = Field(..., min_length=1, max_length=100)
    student_roll_no: str = Field(..., min_length=1, max_length=50)
    question_answers: Dict[str, str] = Field(..., min_items=1)  # question_id: answer

class TestAnswerCreate(TestAnswerBase):
    pass

class GradeThresholds(BaseModel):
    A: int = Field(
        default=85, 
        ge=0, 
        le=100,
        description="Minimum score for A grade (0-100)",
        example=85
    )
    B: int = Field(
        default=70, 
        ge=0, 
        le=100,
        description="Minimum score for B grade (0-100)",
        example=70
    )
    C: int = Field(
        default=55, 
        ge=0, 
        le=100,
        description="Minimum score for C grade (0-100)",
        example=55
    )
    D: int = Field(
        default=40, 
        ge=0, 
        le=100,
        description="Minimum score for D grade (0-100)",
        example=40
    )
    F: int = Field(
        default=0, 
        ge=0, 
        le=100,
        description="Minimum score for F grade (0-100)",
        example=0
    )
    
    @field_validator('A', 'B', 'C', 'D', 'F')
    @classmethod
    def validate_thresholds(cls, v, info):
        if info.field_name == 'A':
            return v
        if info.field_name == 'B' and v >= info.data.get('A', 85):
            raise ValueError('B threshold must be lower than A threshold')
        if info.field_name == 'C' and v >= info.data.get('B', 70):
            raise ValueError('C threshold must be lower than B threshold')
        if info.field_name == 'D' and v >= info.data.get('C', 55):
            raise ValueError('D threshold must be lower than C threshold')
        if info.field_name == 'F' and v >= info.data.get('D', 40):
            raise ValueError('F threshold must be lower than D threshold')
        return v

class GradingResult(BaseModel):
    student_name: str
    student_roll_no: str
    question_id: str
    course_id: str
    score: float = Field(..., ge=0.0, le=1.0)
    grade: str
    points_earned: float
    matched_rules: List[str]
    missed_rules: List[str]
    
    class Config:
        from_attributes = True

class TestGradingResult(BaseModel):
    test_id: str
    course_id: str
    student_name: str
    student_roll_no: str
    overall_score: float = Field(..., ge=0.0, le=1.0)
    overall_grade: str
    total_points_earned: float
    question_results: List[GradingResult]
    
    class Config:
        from_attributes = True

class NoteBase(BaseModel):
    title: str = Field(
        ..., 
        min_length=1, 
        max_length=200,
        description="Note title",
        example="Chapter 1 Summary"
    )
    content: str = Field(
        ..., 
        min_length=1, 
        max_length=10000,
        description="Note content",
        example="This chapter covers the fundamental principles of..."
    )
    course_id: str = Field(
        ...,
        description="ID of the course this note belongs to",
        example="course_123"
    )
    note_type: str = Field(
        default="general", 
        pattern="^(general|lecture|assignment|exam)$",
        description="Type of note",
        example="lecture"
    )

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1, max_length=10000)
    note_type: Optional[str] = Field(None, pattern="^(general|lecture|assignment|exam)$")

class NoteResponse(NoteBase):
    id: str
    teacher_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
