from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGO_URI, DB_NAME
from bson.objectid import ObjectId
from datetime import datetime
from typing import List, Dict, Any, Optional
import uuid
# Async MongoDB client
client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]
# Collections
users_collection = db.users
courses_collection = db.courses
questions_collection = db.questions
tests_collection = db.tests
student_answers_collection = db.student_answers
test_answers_collection = db.test_answers
grades_collection = db.grades
test_grades_collection = db.test_grades
settings_collection = db.settings
notes_collection = db.notes
# Indexes for better performance
async def create_indexes():
    """Create database indexes for better performance"""
    await users_collection.create_index("username", unique=True)
    await users_collection.create_index("email", unique=True)
    await courses_collection.create_index("teacher_id")
    await courses_collection.create_index("student_ids")
    await questions_collection.create_index("course_id")
    await questions_collection.create_index("teacher_id")
    await tests_collection.create_index("course_id")
    await tests_collection.create_index("teacher_id")
    await student_answers_collection.create_index("course_id")
    await student_answers_collection.create_index("question_id")
    await test_answers_collection.create_index("test_id")
    await test_answers_collection.create_index("course_id")
# User operations
async def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    """Get user by username"""
    print(f"DEBUG: get_user_by_username called with username = {username}")
    user = await users_collection.find_one({"username": username})
    print(f"DEBUG: Raw user from database: {user}")
    
    if user:
        # Ensure the id field is present (use custom id if exists, otherwise use _id)
        if "id" not in user and "_id" in user:
            user["id"] = str(user["_id"])
            print(f"DEBUG: Set user['id'] = {user['id']}")
        # Convert _id to string for consistency
        if "_id" in user:
            user["_id"] = str(user["_id"])
        # Ensure all required fields are present
        if "role" not in user:
            user["role"] = "student"  # Default role
        if "first_name" not in user or not user["first_name"]:
            user["first_name"] = "Unknown"
        if "last_name" not in user or not user["last_name"]:
            user["last_name"] = "User"
        if "created_at" not in user:
            user["created_at"] = datetime.now()
        
        print(f"DEBUG: Processed user: {user}")
    return user
async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get user by email"""
    user = await users_collection.find_one({"email": email})
    if user:
        # Ensure the id field is present (use custom id if exists, otherwise use _id)
        if "id" not in user and "_id" in user:
            user["id"] = str(user["_id"])
        # Convert _id to string for consistency
        if "_id" in user:
            user["_id"] = str(user["_id"])
        # Ensure all required fields are present
        if "role" not in user:
            user["role"] = "student"  # Default role
        if "first_name" not in user or not user["first_name"]:
            user["first_name"] = "Unknown"
        if "last_name" not in user or not user["last_name"]:
            user["last_name"] = "User"
        if "created_at" not in user:
            user["created_at"] = datetime.now()
    return user
async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user by ID"""
    user = await users_collection.find_one({"id": user_id})
    if user:
        # Ensure the id field is present (use custom id if exists, otherwise use _id)
        if "id" not in user and "_id" in user:
            user["id"] = str(user["_id"])
        # Convert _id to string for consistency
        if "_id" in user:
            user["_id"] = str(user["_id"])
        # Ensure all required fields are present
        if "role" not in user:
            user["role"] = "student"  # Default role
        if "first_name" not in user or not user["first_name"]:
            user["first_name"] = "Unknown"
        if "last_name" not in user or not user["last_name"]:
            user["last_name"] = "User"
        if "created_at" not in user:
            user["created_at"] = datetime.now()
    return user
async def db_create_user(user_data: Dict[str, Any]) -> str:
    """Create a new user with UUID"""
    user_id = str(uuid.uuid4())
    user_data["id"] = user_id
    user_data["created_at"] = datetime.now()
    await users_collection.insert_one(user_data)
    return user_id
async def update_user_login(user_id: str):
    """Update user's last login time"""
    print(f"DEBUG: update_user_login called with user_id = {user_id}")
    
    # Try to find user by custom id first
    result = await users_collection.update_one(
        {"id": user_id},
        {"$set": {"last_login": datetime.now()}}
    )
    print(f"DEBUG: update_user_login first query result - matched: {result.matched_count}")
    
    # If no user found by custom id, try by _id (for backward compatibility)
    if result.matched_count == 0:
        print(f"DEBUG: update_user_login no user found by custom id, trying _id")
        # Try to find by _id if the user_id looks like an ObjectId
        try:
            object_id = ObjectId(user_id)
            print(f"DEBUG: update_user_login trying with ObjectId: {object_id}")
            await users_collection.update_one(
                {"_id": object_id},
                {"$set": {"last_login": datetime.now()}}
            )
        except Exception as e:
            print(f"DEBUG: update_user_login ObjectId conversion failed: {e}")
            # If user_id is not a valid ObjectId, try as string
            await users_collection.update_one(
                {"_id": user_id},
                {"$set": {"last_login": datetime.now()}}
            )
async def db_update_user(user_id: str, update_data: Dict[str, Any]) -> bool:
    """Update user profile information"""
    print(f"DEBUG: db_update_user called with user_id = {user_id}")
    
    # Add updated_at timestamp
    update_data["updated_at"] = datetime.now()
    # Try to find user by custom id first
    result = await users_collection.update_one(
        {"id": user_id},
        {"$set": update_data}
    )
    print(f"DEBUG: First query result - matched: {result.matched_count}, modified: {result.modified_count}")
    
    # If no user found by custom id, try by _id (for backward compatibility)
    if result.matched_count == 0:
        print(f"DEBUG: No user found by custom id, trying _id")
        # Try to find by _id if the user_id looks like an ObjectId
        try:
            object_id = ObjectId(user_id)
            print(f"DEBUG: Trying with ObjectId: {object_id}")
            result = await users_collection.update_one(
                {"_id": object_id},
                {"$set": update_data}
            )
            print(f"DEBUG: Second query result - matched: {result.matched_count}, modified: {result.modified_count}")
        except Exception as e:
            print(f"DEBUG: ObjectId conversion failed: {e}")
            # If user_id is not a valid ObjectId, try as string
            result = await users_collection.update_one(
                {"_id": user_id},
                {"$set": update_data}
            )
            print(f"DEBUG: Third query result - matched: {result.matched_count}, modified: {result.modified_count}")
    
    return result.modified_count > 0
# Course operations
async def db_save_course(course_data: Dict[str, Any]) -> str:
    """Create a new course with UUID"""
    course_id = str(uuid.uuid4())
    course_data["id"] = course_id
    course_data["created_at"] = datetime.now()
    course_data["updated_at"] = datetime.now()
    course_data["student_ids"] = []
    await courses_collection.insert_one(course_data)
    return course_id
async def get_course_by_id(course_id: str) -> Optional[Dict[str, Any]]:
    """Get course by ID"""
    print(f"DEBUG: get_course_by_id called with course_id = {course_id}")
    course = await courses_collection.find_one({"id": course_id})
    print(f"DEBUG: Raw course from database: {course}")
    
    if course:
        course["_id"] = str(course["_id"])
        # Ensure all required fields are present
        if "student_ids" not in course:
            course["student_ids"] = []
        if "created_at" not in course:
            course["created_at"] = datetime.now()
        if "updated_at" not in course:
            course["updated_at"] = datetime.now()
        print(f"DEBUG: Processed course: {course}")
    else:
        print(f"DEBUG: No course found with ID: {course_id}")
    
    return course
async def get_courses_by_teacher(teacher_id: str) -> List[Dict[str, Any]]:
    """Get all courses for a teacher"""
    courses = await courses_collection.find({"teacher_id": teacher_id}).to_list(None)
    for course in courses:
        course["_id"] = str(course["_id"])
        # Ensure all required fields are present
        if "student_ids" not in course:
            course["student_ids"] = []
        if "created_at" not in course:
            course["created_at"] = datetime.now()
        if "updated_at" not in course:
            course["updated_at"] = datetime.now()
    return courses
async def get_courses_by_student(student_id: str) -> List[Dict[str, Any]]:
    """Get all courses for a student"""
    courses = await courses_collection.find({"student_ids": student_id}).to_list(None)
    for course in courses:
        course["_id"] = str(course["_id"])
        # Ensure all required fields are present
        if "student_ids" not in course:
            course["student_ids"] = []
        if "created_at" not in course:
            course["created_at"] = datetime.now()
        if "updated_at" not in course:
            course["updated_at"] = datetime.now()
    return courses
async def enroll_student_in_course(course_id: str, student_id: str) -> Dict[str, Any]:
    """Enroll a student in a course"""
    # First check if student is already enrolled
    course = await courses_collection.find_one({"id": course_id})
    if not course:
        return {"success": False, "error": "Course not found"}
    
    if student_id in course.get("student_ids", []):
        return {"success": False, "error": "Student is already enrolled in this course"}
    
    # Enroll the student
    result = await courses_collection.update_one(
        {"id": course_id},
        {"$addToSet": {"student_ids": student_id}}
    )
    
    if result.modified_count > 0:
        return {"success": True, "message": "Student enrolled successfully"}
    else:
        return {"success": False, "error": "Failed to enroll student"}
async def remove_student_from_course(course_id: str, student_id: str) -> Dict[str, Any]:
    """Remove a student from a course"""
    # First check if student is enrolled
    course = await courses_collection.find_one({"id": course_id})
    if not course:
        return {"success": False, "error": "Course not found"}
    
    if student_id not in course.get("student_ids", []):
        return {"success": False, "error": "Student is not enrolled in this course"}
    
    # Remove the student
    result = await courses_collection.update_one(
        {"id": course_id},
        {"$pull": {"student_ids": student_id}}
    )
    
    if result.modified_count > 0:
        return {"success": True, "message": "Student removed successfully"}
    else:
        return {"success": False, "error": "Failed to remove student"}
async def db_update_course(course_id: str, teacher_id: str, update_data: Dict[str, Any]) -> bool:
    """Update a course"""
    update_data["updated_at"] = datetime.now()
    result = await courses_collection.update_one(
        {"id": course_id, "teacher_id": teacher_id},
        {"$set": update_data}
    )
    return result.modified_count > 0
async def db_delete_course(course_id: str, teacher_id: str) -> bool:
    """Delete a course"""
    result = await courses_collection.delete_one({"id": course_id, "teacher_id": teacher_id})
    return result.deleted_count > 0
# Question operations
async def db_save_question(question_data: Dict[str, Any]) -> str:
    """Save a question with UUID"""
    question_id = str(uuid.uuid4())
    question_data["id"] = question_id
    question_data["created_at"] = datetime.now()
    question_data["updated_at"] = datetime.now()
    await questions_collection.insert_one(question_data)
    return question_id
async def get_questions_by_course(course_id: str) -> List[Dict[str, Any]]:
    """Get all questions for a course"""
    questions = await questions_collection.find({"course_id": course_id}).to_list(None)
    for q in questions:
        q["_id"] = str(q["_id"])
        # Ensure all required fields are present
        if "difficulty_level" not in q:
            q["difficulty_level"] = "medium"
        if "points" not in q:
            q["points"] = 10
        if "created_at" not in q:
            q["created_at"] = datetime.now()
        if "updated_at" not in q:
            q["updated_at"] = datetime.now()
    return questions
async def get_questions_by_teacher(teacher_id: str) -> List[Dict[str, Any]]:
    """Get all questions for a teacher"""
    questions = await questions_collection.find({"teacher_id": teacher_id}).to_list(None)
    for q in questions:
        q["_id"] = str(q["_id"])
        # Ensure all required fields are present
        if "difficulty_level" not in q:
            q["difficulty_level"] = "medium"
        if "points" not in q:
            q["points"] = 10
        if "created_at" not in q:
            q["created_at"] = datetime.now()
        if "updated_at" not in q:
            q["updated_at"] = datetime.now()
    return questions
async def get_question_by_id(question_id: str, teacher_id: str) -> Optional[Dict[str, Any]]:
    """Get a specific question by ID"""
    question = await questions_collection.find_one({"id": question_id, "teacher_id": teacher_id})
    if question:
        question["_id"] = str(question["_id"])
        # Ensure all required fields are present
        if "difficulty_level" not in question:
            question["difficulty_level"] = "medium"
        if "points" not in question:
            question["points"] = 10
        if "created_at" not in question:
            question["created_at"] = datetime.now()
        if "updated_at" not in question:
            question["updated_at"] = datetime.now()
    return question
async def db_update_question(question_id: str, teacher_id: str, update_data: Dict[str, Any]) -> bool:
    """Update a question"""
    update_data["updated_at"] = datetime.now()
    result = await questions_collection.update_one(
        {"id": question_id, "teacher_id": teacher_id},
        {"$set": update_data}
    )
    return result.modified_count > 0
async def db_delete_question(question_id: str, teacher_id: str) -> bool:
    """Delete a question"""
    result = await questions_collection.delete_one({"id": question_id, "teacher_id": teacher_id})
    return result.deleted_count > 0
# Test operations
async def db_save_test(test_data: Dict[str, Any]) -> str:
    """Save a test with UUID"""
    test_id = str(uuid.uuid4())
    test_data["id"] = test_id
    test_data["created_at"] = datetime.now()
    test_data["updated_at"] = datetime.now()
    await tests_collection.insert_one(test_data)
    return test_id
async def get_tests_by_course(course_id: str) -> List[Dict[str, Any]]:
    """Get all tests for a course"""
    tests = await tests_collection.find({"course_id": course_id}).to_list(None)
    for t in tests:
        t["_id"] = str(t["_id"])
        # Ensure all required fields are present
        if "duration_minutes" not in t:
            t["duration_minutes"] = 60
        if "total_points" not in t:
            t["total_points"] = 100
        if "created_at" not in t:
            t["created_at"] = datetime.now()
        if "updated_at" not in t:
            t["updated_at"] = datetime.now()
    return tests
async def get_tests_by_teacher(teacher_id: str) -> List[Dict[str, Any]]:
    """Get all tests for a teacher"""
    tests = await tests_collection.find({"teacher_id": teacher_id}).to_list(None)
    for t in tests:
        t["_id"] = str(t["_id"])
        # Ensure all required fields are present
        if "duration_minutes" not in t:
            t["duration_minutes"] = 60
        if "total_points" not in t:
            t["total_points"] = 100
        if "created_at" not in t:
            t["created_at"] = datetime.now()
        if "updated_at" not in t:
            t["updated_at"] = datetime.now()
    return tests
async def get_test_by_id(test_id: str, teacher_id: str) -> Optional[Dict[str, Any]]:
    """Get a specific test by ID"""
    test = await tests_collection.find_one({"id": test_id, "teacher_id": teacher_id})
    if test:
        test["_id"] = str(test["_id"])
        # Ensure all required fields are present
        if "duration_minutes" not in test:
            test["duration_minutes"] = 60
        if "total_points" not in test:
            test["total_points"] = 100
        if "created_at" not in test:
            test["created_at"] = datetime.now()
        if "updated_at" not in test:
            test["updated_at"] = datetime.now()
    return test
async def db_update_test(test_id: str, teacher_id: str, update_data: Dict[str, Any]) -> bool:
    """Update a test"""
    update_data["updated_at"] = datetime.now()
    result = await tests_collection.update_one(
        {"id": test_id, "teacher_id": teacher_id},
        {"$set": update_data}
    )
    return result.modified_count > 0
async def db_delete_test(test_id: str, teacher_id: str) -> bool:
    """Delete a test"""
    result = await tests_collection.delete_one({"id": test_id, "teacher_id": teacher_id})
    return result.deleted_count > 0
# Student answer operations
async def db_save_student_answer(answer_data: Dict[str, Any]) -> str:
    """Save a student answer with UUID"""
    answer_id = str(uuid.uuid4())
    answer_data["id"] = answer_id
    answer_data["created_at"] = datetime.now()
    await student_answers_collection.insert_one(answer_data)
    return answer_id
async def get_student_answers_by_course(course_id: str) -> List[Dict[str, Any]]:
    """Get all student answers for a course"""
    answers = await student_answers_collection.find({"course_id": course_id}).to_list(None)
    for a in answers:
        a["_id"] = str(a["_id"])
        # Ensure all required fields are present
        if "created_at" not in a:
            a["created_at"] = datetime.now()
    return answers
async def get_student_answers_by_student(student_id: str) -> List[Dict[str, Any]]:
    """Get all student answers for a specific student"""
    answers = await student_answers_collection.find({"student_id": student_id}).to_list(None)
    for a in answers:
        a["_id"] = str(a["_id"])
        # Ensure all required fields are present
        if "created_at" not in a:
            a["created_at"] = datetime.now()
    return answers
# Test answer operations
async def db_save_test_answer(answer_data: Dict[str, Any]) -> str:
    """Save test answers with UUID"""
    answer_id = str(uuid.uuid4())
    answer_data["id"] = answer_id
    answer_data["created_at"] = datetime.now()
    await test_answers_collection.insert_one(answer_data)
    return answer_id
async def get_test_answers_by_test(test_id: str) -> List[Dict[str, Any]]:
    """Get all test answers for a specific test"""
    answers = await test_answers_collection.find({"test_id": test_id}).to_list(None)
    for a in answers:
        a["_id"] = str(a["_id"])
        # Ensure all required fields are present
        if "created_at" not in a:
            a["created_at"] = datetime.now()
    return answers
# Grading operations
async def save_grades(grades: List[Dict[str, Any]]) -> int:
    """Save grades to database"""
    for grade in grades:
        grade["id"] = str(uuid.uuid4())
        grade["created_at"] = datetime.now()
    result = await grades_collection.insert_many(grades)
    return len(result.inserted_ids)
async def save_test_grades(test_grades: List[Dict[str, Any]]) -> int:
    """Save test grades to database"""
    for grade in test_grades:
        grade["id"] = str(uuid.uuid4())
        grade["created_at"] = datetime.now()
    result = await test_grades_collection.insert_many(test_grades)
    return len(result.inserted_ids)
# Grade threshold operations
async def get_grade_thresholds(teacher_id: str) -> Dict[str, int]:
    """Get grade thresholds for a teacher"""
    settings = await settings_collection.find_one({"type": "grade_thresholds", "teacher_id": teacher_id})
    if settings:
        return settings.get("thresholds", {"A": 85, "B": 70, "C": 55, "D": 40, "F": 0})
    return {"A": 85, "B": 70, "C": 55, "D": 40, "F": 0}
async def save_grade_thresholds(teacher_id: str, thresholds: Dict[str, int]) -> bool:
    """Save grade thresholds for a teacher"""
    await settings_collection.update_one(
        {"type": "grade_thresholds", "teacher_id": teacher_id},
        {"$set": {"thresholds": thresholds}},
        upsert=True
    )
    return True
# Note operations
async def db_save_note(note_data: Dict[str, Any]) -> str:
    """Create a note with UUID"""
    note_id = str(uuid.uuid4())
    note_data["id"] = note_id
    note_data["created_at"] = datetime.now()
    note_data["updated_at"] = datetime.now()
    await notes_collection.insert_one(note_data)
    return note_id
async def get_notes_by_course(course_id: str) -> List[Dict[str, Any]]:
    """Get all notes for a course"""
    notes = await notes_collection.find({"course_id": course_id}).to_list(None)
    for note in notes:
        note["_id"] = str(note["_id"])
        # Ensure all required fields are present
        if "created_at" not in note:
            note["created_at"] = datetime.now()
        if "updated_at" not in note:
            note["updated_at"] = datetime.now()
    return notes
async def get_note_by_id(note_id: str, teacher_id: str) -> Optional[Dict[str, Any]]:
    """Get a specific note by ID"""
    note = await notes_collection.find_one({"id": note_id, "teacher_id": teacher_id})
    if note:
        note["_id"] = str(note["_id"])
        # Ensure all required fields are present
        if "created_at" not in note:
            note["created_at"] = datetime.now()
        if "updated_at" not in note:
            note["updated_at"] = datetime.now()
    return note
async def db_update_note(note_id: str, teacher_id: str, update_data: Dict[str, Any]) -> bool:
    """Update a note"""
    update_data["updated_at"] = datetime.now()
    result = await notes_collection.update_one(
        {"id": note_id, "teacher_id": teacher_id},
        {"$set": update_data}
    )
    return result.modified_count > 0
async def db_delete_note(note_id: str, teacher_id: str) -> bool:
    """Delete a note"""
    result = await notes_collection.delete_one({"id": note_id, "teacher_id": teacher_id})
    return result.deleted_count > 0
