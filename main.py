from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import io
import csv
from typing import List, Dict, Any
from datetime import datetime, timedelta

from models import (
    UserCreate, UserLogin, UserResponse, UserUpdate,
    CourseCreate, CourseUpdate, CourseResponse, CourseEnrollment,
    QuestionCreate, QuestionUpdate, QuestionResponse,
    TestCreate, TestUpdate, TestResponse, TestAnswerCreate,
    StudentAnswerCreate, StudentAnswerResponse,
    NoteCreate, NoteUpdate, NoteResponse,
    GradeThresholds, Token, GradingResult, TestGradingResult
)
from database import (
    create_indexes, get_user_by_username, get_user_by_email, get_user_by_id,
    db_create_user, update_user_login, db_update_user,
    db_save_course, get_course_by_id, get_courses_by_teacher, get_courses_by_student,
    enroll_student_in_course, remove_student_from_course, db_update_course, db_delete_course,
    db_save_question, get_questions_by_course, get_questions_by_teacher, get_question_by_id,
    db_update_question, db_delete_question,
    db_save_test, get_tests_by_course, get_tests_by_teacher, get_test_by_id,
    db_update_test, db_delete_test,
    db_save_student_answer, get_student_answers_by_course, get_student_answers_by_student,
    db_save_test_answer, get_test_answers_by_test,
    save_grades, save_test_grades, get_grade_thresholds, save_grade_thresholds,
    db_save_note, get_notes_by_course, get_note_by_id, db_update_note, db_delete_note
)
from auth import (
    get_current_user, get_current_teacher, get_current_admin,
    create_access_token, verify_password, get_password_hash
)
from config import ACCESS_TOKEN_EXPIRE_MINUTES
from grader import grade_answer, assign_grade
from exceptions import ResourceNotFoundError, ScorixException

app = FastAPI(
    title="Scorix API",
    description="""
    # 🚀 Scorix API - AI-Powered Grading System
    
    ## Overview
    Scorix is an intelligent grading system that uses semantic analysis and AI to automatically grade student answers.
    
    ## Features
    - **AI Grading Engine**: Uses sentence transformers for semantic analysis
    - **Role-Based Access Control**: Student, Teacher, and Admin roles
    - **Course Management**: Create and manage courses with student enrollment
    - **Question Management**: Create questions with marking schemes
    - **Test Management**: Build and administer tests
    - **Automatic Grading**: Grade answers using AI-powered semantic analysis
    - **Grade Thresholds**: Customizable grading scales
    
    ## Authentication
    All protected endpoints require a valid JWT token in the Authorization header:
    ```
    Authorization: Bearer <your_jwt_token>
    ```
    
    ## Role Permissions
    - **Students**: Can view courses, submit answers, take tests
    - **Teachers**: Can manage courses, questions, tests, and grade submissions
    - **Admins**: Full access to all features
    
    ## Getting Started
    1. Register a user account
    2. Login to get your JWT token
    3. Use the token in the Authorization header for protected endpoints
    """,
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {
            "name": "Authentication",
            "description": "User registration and login operations"
        },
        {
            "name": "Users",
            "description": "User profile management operations"
        },
        {
            "name": "Courses",
            "description": "Course management operations (Teachers/Admins only)"
        },
        {
            "name": "Questions",
            "description": "Question management operations (Teachers/Admins only)"
        },
        {
            "name": "Tests",
            "description": "Test management operations (Teachers/Admins only)"
        },
        {
            "name": "Student Answers",
            "description": "Student answer submission and retrieval"
        },
        {
            "name": "Notes",
            "description": "Note management operations (Teachers/Admins only)"
        },
        {
            "name": "Grading",
            "description": "AI-powered grading operations (Teachers/Admins only)"
        },
        {
            "name": "Grade Settings",
            "description": "Grade threshold configuration (Teachers/Admins only)"
        },
        {
            "name": "Export",
            "description": "Data export operations"
        },
        {
            "name": "Health",
            "description": "System health monitoring"
        }
    ]
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Global exception handler
@app.exception_handler(ScorixException)
async def scorix_exception_handler(request, exc: ScorixException):
    """Handle custom Scorix exceptions with detailed error information"""
    return JSONResponse(
        status_code=getattr(exc, 'status_code', 400),
        content={
            "error": {
                "type": getattr(exc, 'error_code', 'SCORIX_ERROR'),
                "message": exc.detail,
                "field": getattr(exc, 'field', None),
                "value": getattr(exc, 'value', None),
                "status_code": getattr(exc, 'status_code', 400)
            }
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    """Handle HTTP exceptions with consistent error format"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "type": "HTTP_ERROR",
                "message": exc.detail,
                "status_code": exc.status_code
            }
        }
    )

@app.exception_handler(ValueError)
async def value_error_handler(request, exc: ValueError):
    """Handle validation errors with field-specific information"""
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "type": "VALIDATION_ERROR",
                "message": str(exc),
                "status_code": 422
            }
        }
    )

# Startup event to create database indexes
@app.on_event("startup")
async def startup_event():
    await create_indexes()

# ==================== AUTHENTICATION ENDPOINTS ====================

@app.post("/auth/register", response_model=Dict[str, str], tags=["Authentication"])
async def register(user: UserCreate):
    """Create a new user account (Student, Teacher, or Admin)"""
    # Check if username already exists
    existing_user = await get_user_by_username(user.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Check if email already exists
    existing_email = await get_user_by_email(user.email)
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Create user
    user_data = user.dict()
    user_data["password_hash"] = get_password_hash(user.password)
    del user_data["password"]
    
    user_id = await db_create_user(user_data)
    return {"message": "User created successfully", "user_id": user_id}

@app.post("/auth/login", response_model=Token, tags=["Authentication"])
async def login(user_credentials: UserLogin):
    """Login user and get access token"""
    user = await get_user_by_username(user_credentials.username)
    if not user or not verify_password(user_credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Update last login
    await update_user_login(user["id"])
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

# ==================== USER MANAGEMENT ENDPOINTS ====================

@app.get("/users/profile", response_model=UserResponse, tags=["Users"])
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user's profile information"""
    return current_user

@app.put("/users/profile", response_model=Dict[str, str], tags=["Users"])
async def update_user_profile(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update current user's profile (Full Update)
    
    **Note**: This endpoint requires all fields to be provided. Use PATCH for partial updates.
    """
    update_data = {k: v for k, v in user_update.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    # Add validation for role changes (only admins can change roles)
    if "role" in update_data and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can change user roles")
    
    print(f"DEBUG: current_user['id'] = {current_user['id']}")
    print(f"DEBUG: current_user keys = {list(current_user.keys())}")
    print(f"DEBUG: update_data = {update_data}")
    
    success = await db_update_user(current_user["id"], update_data)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User profile updated successfully"}

@app.patch("/users/profile", response_model=Dict[str, str], tags=["Users"])
async def patch_user_profile(
    user_patch: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Partially update current user's profile (Partial Update)
    
    **Benefits of PATCH over PUT:**
    - Only update specific fields
    - Keep existing data for unchanged fields
    - More efficient for minor updates
    
    **Example:**
    ```json
    {
        "first_name": "John",
        "last_name": "Doe"
    }
    ```
    Only the first and last names will be updated, other fields remain unchanged.
    """
    update_data = {k: v for k, v in user_patch.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    # Add validation for role changes (only admins can change roles)
    if "role" in update_data and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can change user roles")
    
    success = await db_update_user(current_user["id"], update_data)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User profile partially updated successfully"}

# ==================== COURSE MANAGEMENT ENDPOINTS ====================

@app.post("/courses", response_model=Dict[str, str], tags=["Courses"])
async def create_course(
    course: CourseCreate,
    current_user: dict = Depends(get_current_teacher)
):
    """
    Create a new course (Teachers and Admins only)
    
    **Required Fields:**
    - `title`: Course title (1-200 characters)
    - `description`: Course description (optional, max 1000 characters)
    - `subject`: Course subject (1-100 characters)
    - `academic_year`: Academic year (4-9 characters, e.g., "2025")
    
    **Example:**
    ```json
    {
        "title": "Advanced Mathematics",
        "description": "Advanced mathematical concepts and problem solving",
        "subject": "Mathematics",
        "academic_year": "2025"
    }
    ```
    """
    course_data = course.dict()
    course_data["teacher_id"] = current_user["id"]
    
    course_id = await db_save_course(course_data)
    return {"message": "Course created successfully", "course_id": course_id}

@app.get("/courses/teacher", response_model=List[CourseResponse], tags=["Courses"])
async def get_teacher_courses(current_user: dict = Depends(get_current_teacher)):
    """Get all courses for the authenticated teacher"""
    courses = await get_courses_by_teacher(current_user["id"])
    return courses

@app.get("/courses/student", response_model=List[CourseResponse], tags=["Courses"])
async def get_student_courses(current_user: dict = Depends(get_current_user)):
    """Get all courses for the authenticated student"""
    courses = await get_courses_by_student(current_user["id"])
    return courses

@app.get("/courses/{course_id}", response_model=CourseResponse, tags=["Courses"])
async def get_course(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific course by ID"""
    course = await get_course_by_id(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if user has access to this course
    if current_user["role"] == "student" and current_user["id"] not in course["student_ids"]:
        raise HTTPException(status_code=403, detail="Access denied to this course")
    elif current_user["role"] == "teacher" and course["teacher_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied to this course")
    
    return course

@app.put("/courses/{course_id}", response_model=Dict[str, str], tags=["Courses"])
async def update_course(
    course_id: str,
    course_update: CourseUpdate,
    current_user: dict = Depends(get_current_teacher)
):
    """
    Update a course (Teachers and Admins only) - Full Update
    
    **Note**: This endpoint requires all fields to be provided. Use PATCH for partial updates.
    """
    update_data = {k: v for k, v in course_update.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    success = await db_update_course(course_id, current_user["id"], update_data)
    if not success:
        raise HTTPException(status_code=404, detail="Course not found")
    
    return {"message": "Course updated successfully"}

@app.patch("/courses/{course_id}", response_model=Dict[str, str], tags=["Courses"])
async def patch_course(
    course_id: str,
    course_patch: CourseUpdate,
    current_user: dict = Depends(get_current_teacher)
):
    """
    Partially update a course (Teachers and Admins only) - Partial Update
    
    **Benefits of PATCH over PUT:**
    - Only update specific fields
    - Keep existing data for unchanged fields
    - More efficient for minor updates
    
    **Example:**
    ```json
    {
        "title": "Updated Course Title"
    }
    ```
    Only the title will be updated, other fields remain unchanged.
    """
    # Filter out None values for partial update
    update_data = {k: v for k, v in course_patch.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    success = await db_update_course(course_id, current_user["id"], update_data)
    if not success:
        raise HTTPException(status_code=404, detail="Course not found")
    
    return {"message": "Course partially updated successfully"}

@app.delete("/courses/{course_id}", response_model=Dict[str, str], tags=["Courses"])
async def delete_course(
    course_id: str,
    current_user: dict = Depends(get_current_teacher)
):
    """Delete a course (Teachers and Admins only)"""
    success = await db_delete_course(course_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Course not found")
    
    return {"message": "Course deleted successfully"}

@app.post("/courses/{course_id}/enroll", response_model=Dict[str, str], tags=["Courses"])
async def enroll_student(
    course_id: str,
    enrollment: CourseEnrollment,
    current_user: dict = Depends(get_current_teacher)
):
    """Enroll a student in a course (Teachers and Admins only)"""
    print(f"DEBUG: enroll_student called with course_id = {course_id}")
    print(f"DEBUG: current_user = {current_user}")
    print(f"DEBUG: enrollment = {enrollment}")
    
    # Verify course belongs to teacher
    course = await get_course_by_id(course_id)
    print(f"DEBUG: course found = {course}")
    
    if not course:
        print(f"DEBUG: Course not found with ID: {course_id}")
        raise HTTPException(status_code=404, detail=f"Course not found with ID: {course_id}")
    
    if course["teacher_id"] != current_user["id"]:
        print(f"DEBUG: Course ownership mismatch. Course teacher_id: {course['teacher_id']}, Current user id: {current_user['id']}")
        raise HTTPException(status_code=403, detail=f"Access denied. Course belongs to another teacher")
    
    result = await enroll_student_in_course(course_id, enrollment.student_id)
    if not result["success"]:
        if "already enrolled" in result["error"]:
            raise HTTPException(status_code=409, detail=result["error"])
        else:
            raise HTTPException(status_code=400, detail=result["error"])
    
    return {"message": result["message"]}

@app.delete("/courses/{course_id}/unenroll/{student_id}", response_model=Dict[str, str], tags=["Courses"])
async def unenroll_student(
    course_id: str,
    student_id: str,
    current_user: dict = Depends(get_current_teacher)
):
    """Remove a student from a course (Teachers and Admins only)"""
    # Verify course belongs to teacher
    course = await get_course_by_id(course_id)
    if not course or course["teacher_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Course not found")
    
    result = await remove_student_from_course(course_id, student_id)
    if not result["success"]:
        if "not enrolled" in result["error"]:
            raise HTTPException(status_code=404, detail=result["error"])
        else:
            raise HTTPException(status_code=400, detail=result["error"])
    
    return {"message": result["message"]}

# ==================== QUESTION MANAGEMENT ENDPOINTS ====================

@app.post("/questions", response_model=Dict[str, str], tags=["Questions"])
async def create_question(
    question: QuestionCreate,
    current_user: dict = Depends(get_current_teacher)
):
    """
    Create a new question (Teachers and Admins only)
    
    **Required Fields:**
    - `question`: Question text (1-2000 characters)
    - `sample_answer`: Model answer for grading (1-2000 characters)
    - `marking_scheme`: List of marking criteria (at least 1 item)
    - `course_id`: ID of the course this question belongs to
    - `difficulty_level`: Question difficulty (easy/medium/hard, default: medium)
    - `points`: Points awarded (1-100, default: 10)
    
    **Example:**
    ```json
    {
        "question": "What is Newton's Second Law of Motion?",
        "sample_answer": "Newton's Second Law states that force equals mass times acceleration (F = ma)",
        "marking_scheme": [
            "mentions the formula F = ma",
            "explains the relationship between force, mass, and acceleration"
        ],
        "course_id": "course_123",
        "difficulty_level": "medium",
        "points": 15
    }
    ```
    """
    # Verify course belongs to teacher
    course = await get_course_by_id(question.course_id)
    if not course or course["teacher_id"] != current_user["id"]:
        raise ResourceNotFoundError("Course", question.course_id)
    
    question_data = question.dict()
    question_data["teacher_id"] = current_user["id"]
    
    question_id = await db_save_question(question_data)
    return {"message": "Question created successfully", "question_id": question_id}

@app.get("/questions/course/{course_id}", response_model=List[QuestionResponse], tags=["Questions"])
async def get_course_questions(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all questions for a specific course"""
    # Verify access to course
    course = await get_course_by_id(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if current_user["role"] == "student" and current_user["id"] not in course["student_ids"]:
        raise HTTPException(status_code=403, detail="Access denied to this course")
    elif current_user["role"] == "teacher" and course["teacher_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied to this course")
    
    questions = await get_questions_by_course(course_id)
    return questions

@app.get("/questions", response_model=List[QuestionResponse], tags=["Questions"])
async def get_teacher_questions(current_user: dict = Depends(get_current_teacher)):
    """Get all questions for the authenticated teacher"""
    questions = await get_questions_by_teacher(current_user["id"])
    return questions

@app.get("/questions/{question_id}", response_model=QuestionResponse, tags=["Questions"])
async def get_question(
    question_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific question by ID"""
    question = await get_question_by_id(question_id, current_user["id"])
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question

@app.put("/questions/{question_id}", response_model=Dict[str, str], tags=["Questions"])
async def update_question(
    question_id: str,
    question_update: QuestionUpdate,
    current_user: dict = Depends(get_current_teacher)
):
    """
    Update a question (Teachers and Admins only) - Full Update
    
    **Note**: This endpoint requires all fields to be provided. Use PATCH for partial updates.
    """
    update_data = {k: v for k, v in question_update.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    success = await db_update_question(question_id, current_user["id"], update_data)
    if not success:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return {"message": "Question updated successfully"}

@app.patch("/questions/{question_id}", response_model=Dict[str, str], tags=["Questions"])
async def patch_question(
    question_id: str,
    question_patch: QuestionUpdate,
    current_user: dict = Depends(get_current_teacher)
):
    """
    Partially update a question (Teachers and Admins only) - Partial Update
    
    **Benefits of PATCH over PUT:**
    - Only update specific fields
    - Keep existing data for unchanged fields
    - More efficient for minor updates
    
    **Example:**
    ```json
    {
        "points": 20,
        "difficulty_level": "hard"
    }
    ```
    Only the points and difficulty will be updated, other fields remain unchanged.
    """
    # Filter out None values for partial update
    update_data = {k: v for k, v in question_patch.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    success = await db_update_question(question_id, current_user["id"], update_data)
    if not success:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return {"message": "Question partially updated successfully"}

@app.delete("/questions/{question_id}", response_model=Dict[str, str], tags=["Questions"])
async def delete_question(
    question_id: str,
    current_user: dict = Depends(get_current_teacher)
):
    """Delete a question (Teachers and Admins only)"""
    success = await db_delete_question(question_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return {"message": "Question deleted successfully"}

# ==================== TEST MANAGEMENT ENDPOINTS ====================

@app.post("/tests", response_model=Dict[str, str], tags=["Tests"])
async def create_test(
    test: TestCreate,
    current_user: dict = Depends(get_current_teacher)
):
    """Create a new test (Teachers and Admins only)"""
    # Verify course belongs to teacher
    course = await get_course_by_id(test.course_id)
    if not course or course["teacher_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Course not found")
    
    test_data = test.dict()
    test_data["teacher_id"] = current_user["id"]
    
    test_id = await db_save_test(test_data)
    return {"message": "Test created successfully", "test_id": test_id}

@app.get("/tests/course/{course_id}", response_model=List[TestResponse], tags=["Tests"])
async def get_course_tests(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all tests for a specific course"""
    # Verify access to course
    course = await get_course_by_id(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if current_user["role"] == "student" and current_user["id"] not in course["student_ids"]:
        raise HTTPException(status_code=403, detail="Access denied to this course")
    elif current_user["role"] == "teacher" and course["teacher_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied to this course")
    
    tests = await get_tests_by_course(course_id)
    return tests

@app.get("/tests", response_model=List[TestResponse], tags=["Tests"])
async def get_teacher_tests(current_user: dict = Depends(get_current_teacher)):
    """Get all tests for the authenticated teacher"""
    tests = await get_tests_by_teacher(current_user["id"])
    return tests

@app.get("/tests/{test_id}", response_model=TestResponse, tags=["Tests"])
async def get_test(
    test_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific test by ID"""
    test = await get_test_by_id(test_id, current_user["id"])
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    return test

@app.put("/tests/{test_id}", response_model=Dict[str, str], tags=["Tests"])
async def update_test(
    test_id: str,
    test_update: TestUpdate,
    current_user: dict = Depends(get_current_teacher)
):
    """
    Update a test (Teachers and Admins only) - Full Update
    
    **Note**: This endpoint requires all fields to be provided. Use PATCH for partial updates.
    """
    update_data = {k: v for k, v in test_update.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    success = await db_update_test(test_id, current_user["id"], update_data)
    if not success:
        raise HTTPException(status_code=404, detail="Test not found")
    
    return {"message": "Test updated successfully"}

@app.patch("/tests/{test_id}", response_model=Dict[str, str], tags=["Tests"])
async def patch_test(
    test_id: str,
    test_patch: TestUpdate,
    current_user: dict = Depends(get_current_teacher)
):
    """
    Partially update a test (Teachers and Admins only) - Partial Update
    
    **Benefits of PATCH over PUT:**
    - Only update specific fields
    - Keep existing data for unchanged fields
    - More efficient for minor updates
    
    **Example:**
    ```json
    {
        "duration_minutes": 90,
        "is_active": false
    }
    ```
    Only the duration and active status will be updated, other fields remain unchanged.
    """
    # Filter out None values for partial update
    update_data = {k: v for k, v in test_patch.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    success = await db_update_test(test_id, current_user["id"], update_data)
    if not success:
        raise HTTPException(status_code=404, detail="Test not found")
    
    return {"message": "Test partially updated successfully"}

@app.delete("/tests/{test_id}", response_model=Dict[str, str], tags=["Tests"])
async def delete_test(
    test_id: str,
    current_user: dict = Depends(get_current_teacher)
):
    """Delete a test (Teachers and Admins only)"""
    success = await db_delete_test(test_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Test not found")
    
    return {"message": "Test deleted successfully"}

# ==================== STUDENT ANSWERS ENDPOINTS ====================

@app.post("/answers", response_model=Dict[str, str], tags=["Student Answers"])
async def create_student_answer(
    answer: StudentAnswerCreate,
    current_user: dict = Depends(get_current_user)
):
    """Submit a student answer"""
    # Verify access to course
    course = await get_course_by_id(answer.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if current_user["role"] == "student" and current_user["id"] not in course["student_ids"]:
        raise HTTPException(status_code=403, detail="Access denied to this course")
    
    answer_data = answer.dict()
    answer_data["student_id"] = current_user["id"]
    
    answer_id = await db_save_student_answer(answer_data)
    return {"message": "Answer submitted successfully", "answer_id": answer_id}

@app.get("/answers/course/{course_id}", response_model=List[StudentAnswerResponse], tags=["Student Answers"])
async def get_course_answers(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all student answers for a specific course"""
    # Verify access to course
    course = await get_course_by_id(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if current_user["role"] == "student" and current_user["id"] not in course["student_ids"]:
        raise HTTPException(status_code=403, detail="Access denied to this course")
    elif current_user["role"] == "teacher" and course["teacher_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied to this course")
    
    answers = await get_student_answers_by_course(course_id)
    return answers

@app.get("/answers", response_model=List[StudentAnswerResponse], tags=["Student Answers"])
async def get_student_answers(current_user: dict = Depends(get_current_user)):
    """Get all student answers for the authenticated user"""
    answers = await get_student_answers_by_student(current_user["id"])
    return answers

@app.post("/test-answers", response_model=Dict[str, str], tags=["Test Answers"])
async def create_test_answer(
    test_answer: TestAnswerCreate,
    current_user: dict = Depends(get_current_user)
):
    """Submit test answers for a student"""
    # Verify access to course
    course = await get_course_by_id(test_answer.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if current_user["role"] == "student" and current_user["id"] not in course["student_ids"]:
        raise HTTPException(status_code=403, detail="Access denied to this course")
    
    answer_data = test_answer.dict()
    answer_data["student_id"] = current_user["id"]
    
    answer_id = await db_save_test_answer(answer_data)
    return {"message": "Test answers submitted successfully", "answer_id": answer_id}

# ==================== NOTES ENDPOINTS ====================

@app.post("/notes", response_model=Dict[str, str], tags=["Notes"])
async def create_note(
    note: NoteCreate,
    current_user: dict = Depends(get_current_teacher)
):
    """Create a new note (Teachers and Admins only)"""
    # Verify course belongs to teacher
    course = await get_course_by_id(note.course_id)
    if not course or course["teacher_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Course not found")
    
    note_data = note.dict()
    note_data["teacher_id"] = current_user["id"]
    
    note_id = await db_save_note(note_data)
    return {"message": "Note created successfully", "note_id": note_id}

@app.get("/notes/course/{course_id}", response_model=List[NoteResponse], tags=["Notes"])
async def get_course_notes(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all notes for a specific course"""
    # Verify access to course
    course = await get_course_by_id(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if current_user["role"] == "student" and current_user["id"] not in course["student_ids"]:
        raise HTTPException(status_code=403, detail="Access denied to this course")
    elif current_user["role"] == "teacher" and course["teacher_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied to this course")
    
    notes = await get_notes_by_course(course_id)
    return notes

@app.get("/notes/{note_id}", response_model=NoteResponse, tags=["Notes"])
async def get_note(
    note_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific note by ID"""
    note = await get_note_by_id(note_id, current_user["id"])
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@app.put("/notes/{note_id}", response_model=Dict[str, str], tags=["Notes"])
async def update_note(
    note_id: str,
    note_update: NoteUpdate,
    current_user: dict = Depends(get_current_teacher)
):
    """
    Update a note (Teachers and Admins only) - Full Update
    
    **Note**: This endpoint requires all fields to be provided. Use PATCH for partial updates.
    """
    update_data = {k: v for k, v in note_update.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    success = await db_update_note(note_id, current_user["id"], update_data)
    if not success:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return {"message": "Note updated successfully"}

@app.patch("/notes/{note_id}", response_model=Dict[str, str], tags=["Notes"])
async def patch_note(
    note_id: str,
    note_patch: NoteUpdate,
    current_user: dict = Depends(get_current_teacher)
):
    """
    Partially update a note (Teachers and Admins only) - Partial Update
    
    **Benefits of PATCH over PUT:**
    - Only update specific fields
    - Keep existing data for unchanged fields
    - More efficient for minor updates
    
    **Example:**
    ```json
    {
        "title": "Updated Note Title",
        "note_type": "lecture"
    }
    ```
    Only the title and note type will be updated, other fields remain unchanged.
    """
    # Filter out None values for partial update
    update_data = {k: v for k, v in note_patch.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    success = await db_update_note(note_id, current_user["id"], update_data)
    if not success:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return {"message": "Note partially updated successfully"}

@app.delete("/notes/{note_id}", response_model=Dict[str, str], tags=["Notes"])
async def delete_note(
    note_id: str,
    current_user: dict = Depends(get_current_teacher)
):
    """Delete a note (Teachers and Admins only)"""
    success = await db_delete_note(note_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return {"message": "Note deleted successfully"}

# ==================== GRADING ENDPOINTS ====================

@app.post("/grade/course/{course_id}", response_model=List[GradingResult], tags=["Grading"])
async def grade_course_answers(
    course_id: str,
    current_user: dict = Depends(get_current_teacher)
):
    """Grade all student answers for a specific course"""
    # Verify course belongs to teacher
    course = await get_course_by_id(course_id)
    if not course or course["teacher_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Course not found")
    
    questions = await get_questions_by_course(course_id)
    answers = await get_student_answers_by_course(course_id)
    grade_thresholds = await get_grade_thresholds(current_user["id"])
    
    if not questions or not answers:
        return []
    
    results = []
    
    for question in questions:
        question_answers = [a for a in answers if a["question_id"] == question["id"]]
        
        for answer in question_answers:
            grading_result = grade_answer(
                answer["answer"],
                question["sample_answer"],
                question["marking_scheme"],
                grade_thresholds
            )
            
            # Calculate points earned
            points_earned = grading_result["score"] * question["points"]
            
            results.append(GradingResult(
                student_name=answer["student_name"],
                student_roll_no=answer["student_roll_no"],
                question_id=question["id"],
                course_id=course_id,
                score=grading_result["score"],
                grade=grading_result["grade"],
                points_earned=points_earned,
                matched_rules=grading_result["matched_rules"],
                missed_rules=grading_result["missed_rules"]
            ))
    
    # Save grades to database
    if results:
        grades_data = [result.dict() for result in results]
        for grade in grades_data:
            grade["teacher_id"] = current_user["id"]
        await save_grades(grades_data)
    
    return results

@app.post("/grade-test/{test_id}", response_model=List[TestGradingResult], tags=["Grading"])
async def grade_test(
    test_id: str,
    current_user: dict = Depends(get_current_teacher)
):
    """Grade all answers for a specific test"""
    test = await get_test_by_id(test_id, current_user["id"])
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    test_answers = await get_test_answers_by_test(test_id)
    if not test_answers:
        return []
    
    grade_thresholds = await get_grade_thresholds(current_user["id"])
    results = []
    
    for test_answer in test_answers:
        question_scores = []
        question_results = []
        total_points_earned = 0.0
        
        for question_id, student_answer in test_answer["question_answers"].items():
            question = await get_question_by_id(question_id, current_user["id"])
            if not question:
                continue
            
            grading_result = grade_answer(
                student_answer,
                question["sample_answer"],
                question["marking_scheme"],
                grade_thresholds
            )
            
            score = grading_result["score"]
            grade = grading_result["grade"]
            points_earned = score * question["points"]
            total_points_earned += points_earned
            
            question_scores.append(score)
            question_results.append(GradingResult(
                student_name=test_answer["student_name"],
                student_roll_no=test_answer["student_roll_no"],
                question_id=question_id,
                course_id=test_answer["course_id"],
                score=score,
                grade=grade,
                points_earned=points_earned,
                matched_rules=grading_result["matched_rules"],
                missed_rules=grading_result["missed_rules"]
            ))
        
        if question_scores:
            overall_score = sum(question_scores) / len(question_scores)
            overall_grade = assign_grade(overall_score, grade_thresholds)
            
            results.append(TestGradingResult(
                test_id=test_id,
                course_id=test_answer["course_id"],
                student_name=test_answer["student_name"],
                student_roll_no=test_answer["student_roll_no"],
                overall_score=overall_score,
                overall_grade=overall_grade,
                total_points_earned=total_points_earned,
                question_results=question_results
            ))
    
    # Save test grades to database
    if results:
        test_grades_data = []
        for result in results:
            for question_result in result.question_results:
                test_grades_data.append({
                    "test_id": test_id,
                    "teacher_id": current_user["id"],
                    "student_name": result.student_name,
                    "student_roll_no": result.student_roll_no,
                    "question_id": question_result.question_id,
                    "score": question_result.score,
                    "grade": question_result.grade,
                    "overall_score": result.overall_score,
                    "overall_grade": result.overall_grade,
                    "course_id": result.course_id
                })
        
        if test_grades_data:
            await save_test_grades(test_grades_data)
    
    return results

# ==================== GRADE SETTINGS ENDPOINTS ====================

@app.get("/grade-thresholds", response_model=GradeThresholds, tags=["Grade Settings"])
async def get_grade_thresholds_endpoint(current_user: dict = Depends(get_current_teacher)):
    """Get current grade thresholds for the authenticated teacher"""
    thresholds = await get_grade_thresholds(current_user["id"])
    return GradeThresholds(**thresholds)

@app.put("/grade-thresholds", response_model=Dict[str, str], tags=["Grade Settings"])
async def update_grade_thresholds(
    thresholds: GradeThresholds,
    current_user: dict = Depends(get_current_teacher)
):
    """Update grade thresholds (Teachers and Admins only)"""
    await save_grade_thresholds(current_user["id"], thresholds.dict())
    return {"message": "Grade thresholds updated successfully"}

# ==================== EXPORT ENDPOINTS ====================

@app.get("/export/questions/course/{course_id}", tags=["Export"])
async def export_course_questions_csv(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Export questions for a specific course to CSV format"""
    # Verify access to course
    course = await get_course_by_id(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if current_user["role"] == "student" and current_user["id"] not in course["student_ids"]:
        raise HTTPException(status_code=403, detail="Access denied to this course")
    elif current_user["role"] == "teacher" and course["teacher_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied to this course")
    
    questions = await get_questions_by_course(course_id)
    
    if not questions:
        raise HTTPException(status_code=404, detail="No questions found")
    
    # Create CSV data
    csv_data = []
    for i, q in enumerate(questions, 1):
        csv_data.append({
            'Question Number': f"Q{i:03d}",
            'Question ID': q['id'],
            'Question Text': q['question'],
            'Sample Answer': q['sample_answer'],
            'Marking Rules': ' | '.join(q['marking_scheme']),
            'Difficulty': q['difficulty_level'],
            'Points': q['points'],
            'Created Date': q['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        })
    
    # Generate CSV
    output = io.StringIO()
    fieldnames = ['Question Number', 'Question ID', 'Question Text', 'Sample Answer', 'Marking Rules', 'Difficulty', 'Points', 'Created Date']
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(csv_data)
    
    # Return CSV file
    csv_content = output.getvalue()
    output.close()
    
    return {"csv_content": csv_content, "filename": f"questions_{course_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}

@app.get("/export/template", tags=["Export"])
async def get_csv_template():
    """Get CSV template for bulk data upload"""
    template_data = [
        {
            'Student Name': 'John Doe',
            'Student Roll No': '2023001',
            'Question ID': 'question_id_here',
            'Answer': 'Student answer text here'
        },
        {
            'Student Name': 'Jane Smith',
            'Student Roll No': '2023002',
            'Question ID': 'question_id_here',
            'Answer': 'Another student answer here'
        }
    ]
    
    output = io.StringIO()
    fieldnames = ['Student Name', 'Student Roll No', 'Question ID', 'Answer']
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(template_data)
    
    csv_content = output.getvalue()
    output.close()
    
    return {"csv_content": csv_content, "filename": "bulk_upload_template.csv"}

# ==================== HEALTH CHECK ====================

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
