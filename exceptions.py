from fastapi import HTTPException, status
from typing import Any, Dict, Optional

class ScorixException(HTTPException):
    """Base exception for Scorix API"""
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: Optional[str] = None,
        field: Optional[str] = None,
        value: Optional[Any] = None
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code
        self.field = field
        self.value = value

class ValidationError(ScorixException):
    """Validation error with field-specific details"""
    def __init__(self, field: str, value: Any, message: str):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Validation error in field '{field}': {message}",
            error_code="VALIDATION_ERROR",
            field=field,
            value=value
        )

class AuthenticationError(ScorixException):
    """Authentication error"""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=message,
            error_code="AUTHENTICATION_ERROR"
        )

class AuthorizationError(ScorixException):
    """Authorization error with role requirements"""
    def __init__(self, required_role: str, current_role: Optional[str] = None):
        if current_role:
            detail = f"Access denied. Required role: {required_role}, Current role: {current_role}"
        else:
            detail = f"Access denied. Required role: {required_role}"
        
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="AUTHORIZATION_ERROR"
        )

class ResourceNotFoundError(ScorixException):
    """Resource not found error"""
    def __init__(self, resource_type: str, resource_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource_type} with ID '{resource_id}' not found",
            error_code="RESOURCE_NOT_FOUND"
        )

class DuplicateResourceError(ScorixException):
    """Duplicate resource error"""
    def __init__(self, resource_type: str, field: str, value: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{resource_type} with {field} '{value}' already exists",
            error_code="DUPLICATE_RESOURCE"
        )

class BusinessLogicError(ScorixException):
    """Business logic error"""
    def __init__(self, message: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message,
            error_code="BUSINESS_LOGIC_ERROR"
        )

class DatabaseError(ScorixException):
    """Database operation error"""
    def __init__(self, operation: str, message: str):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database {operation} failed: {message}",
            error_code="DATABASE_ERROR"
        )

# Specific error messages for common scenarios
class ErrorMessages:
    # Authentication
    INVALID_CREDENTIALS = "Invalid username or password"
    TOKEN_EXPIRED = "Access token has expired"
    INVALID_TOKEN = "Invalid or malformed access token"
    MISSING_TOKEN = "Access token is required"
    
    # Authorization
    TEACHER_ACCESS_REQUIRED = "Teacher or Admin access required for this operation"
    ADMIN_ACCESS_REQUIRED = "Admin access required for this operation"
    STUDENT_ACCESS_REQUIRED = "Student access required for this operation"
    COURSE_ACCESS_DENIED = "Access denied to this course"
    
    # Validation
    INVALID_EMAIL_FORMAT = "Invalid email format"
    USERNAME_TOO_SHORT = "Username must be at least 3 characters long"
    USERNAME_TOO_LONG = "Username must not exceed 50 characters"
    PASSWORD_TOO_SHORT = "Password must be at least 6 characters long"
    INVALID_ROLE = "Invalid user role. Must be one of: student, teacher, admin"
    INVALID_DIFFICULTY = "Invalid difficulty level. Must be one of: easy, medium, hard"
    INVALID_NOTE_TYPE = "Invalid note type. Must be one of: general, lecture, assignment, exam"
    
    # Business Logic
    COURSE_NOT_FOUND = "Course not found"
    QUESTION_NOT_FOUND = "Question not found"
    TEST_NOT_FOUND = "Test not found"
    USER_NOT_FOUND = "User not found"
    STUDENT_ALREADY_ENROLLED = "Student is already enrolled in this course"
    STUDENT_NOT_ENROLLED = "Student is not enrolled in this course"
    INSUFFICIENT_QUESTIONS = "Test must have at least one question"
    INVALID_GRADE_THRESHOLDS = "Grade thresholds must be in descending order (A > B > C > D > F)"
