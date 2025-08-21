# 🚀 Scorix FastAPI

FastAPI implementation of the Scorix AI-powered grading system with semantic analysis.

## ✨ Features

- **RESTful API** with automatic Swagger documentation
- **JWT Authentication** with role-based access control
- **AI Grading Engine** using sentence transformers
- **MongoDB Integration** for data persistence
- **Role-based Access**: Student, Teacher, Admin
- **CSV Export/Import** functionality
- **Test Management** with batch grading

## 🏗️ API Endpoints

### 🔓 Public Endpoints (No Authentication Required)
- `POST /auth/register` - Create a new user account (Student, Teacher, or Admin)
- `POST /auth/login` - Login user and get access token
- `GET /health` - Health check endpoint

### 🔐 Protected Endpoints (Authentication Required)

#### Course Management
- `POST /courses` - Create a new course **[🔒 TEACHER/ADMIN]**
- `GET /courses/teacher` - Get all courses for the authenticated teacher **[🔒 TEACHER/ADMIN]**
- `GET /courses/student` - Get all courses for the authenticated student **[🔒 STUDENT]**
- `GET /courses/{course_id}` - Get a specific course by ID **[🔒 ANY LOGGED USER]**
- `PUT /courses/{course_id}` - Update a course **[🔒 TEACHER/ADMIN]**
- `DELETE /courses/{course_id}` - Delete a course **[🔒 TEACHER/ADMIN]**
- `POST /courses/{course_id}/enroll` - Enroll a student in a course **[🔒 TEACHER/ADMIN]**
- `DELETE /courses/{course_id}/unenroll/{student_id}` - Remove a student from a course **[🔒 TEACHER/ADMIN]**

#### Question Management
- `POST /questions` - Create a new question **[🔒 TEACHER/ADMIN]**
- `GET /questions/course/{course_id}` - Get all questions for a specific course **[🔒 ANY LOGGED USER]**
- `GET /questions` - Get all questions for the authenticated teacher **[🔒 TEACHER/ADMIN]**
- `GET /questions/{question_id}` - Get a specific question by ID **[🔒 ANY LOGGED USER]**
- `PUT /questions/{question_id}` - Update a question **[🔒 TEACHER/ADMIN]**
- `DELETE /questions/{question_id}` - Delete a question **[🔒 TEACHER/ADMIN]**

#### Test Management
- `POST /tests` - Create a new test **[🔒 TEACHER/ADMIN]**
- `GET /tests/course/{course_id}` - Get all tests for a specific course **[🔒 ANY LOGGED USER]**
- `GET /tests` - Get all tests for the authenticated teacher **[🔒 TEACHER/ADMIN]**
- `GET /tests/{test_id}` - Get a specific test by ID **[🔒 ANY LOGGED USER]**
- `PUT /tests/{test_id}` - Update a test **[🔒 TEACHER/ADMIN]**
- `DELETE /tests/{test_id}` - Delete a test **[🔒 TEACHER/ADMIN]**

#### Student Answers
- `POST /answers` - Submit a student answer **[🔒 STUDENT]**
- `GET /answers/course/{course_id}` - Get all student answers for a specific course **[🔒 ANY LOGGED USER]**
- `GET /answers` - Get all student answers for the authenticated user **[🔒 STUDENT]**
- `POST /test-answers` - Submit test answers for a student **[🔒 STUDENT]**

#### Notes Management
- `POST /notes` - Create a new note **[🔒 TEACHER/ADMIN]**
- `GET /notes/course/{course_id}` - Get all notes for a specific course **[🔒 ANY LOGGED USER]**
- `GET /notes/{note_id}` - Get a specific note by ID **[🔒 ANY LOGGED USER]**
- `PUT /notes/{note_id}` - Update a note **[🔒 TEACHER/ADMIN]**
- `DELETE /notes/{note_id}` - Delete a note **[🔒 TEACHER/ADMIN]**

#### Grading
- `POST /grade/course/{course_id}` - Grade all student answers for a specific course **[🔒 TEACHER/ADMIN]**
- `POST /grade-test/{test_id}` - Grade all answers for a specific test **[🔒 TEACHER/ADMIN]**

#### Grade Settings
- `GET /grade-thresholds` - Get current grade thresholds for the authenticated teacher **[🔒 TEACHER/ADMIN]**
- `PUT /grade-thresholds` - Update grade thresholds **[🔒 TEACHER/ADMIN]**

#### Export
- `GET /export/questions/course/{course_id}` - Export questions for a specific course to CSV format **[🔒 ANY LOGGED USER]**
- `GET /export/template` - Get CSV template for bulk data upload **[🔒 ANY LOGGED USER]**

### 🔑 Authentication Legend
- **🔓 Public** - No authentication required
- **🔒 ANY LOGGED USER** - Requires valid JWT token (Student, Teacher, or Admin)
- **🔒 STUDENT** - Requires valid JWT token with Student role
- **🔒 TEACHER/ADMIN** - Requires valid JWT token with Teacher or Admin role
- **🔒 ADMIN** - Requires valid JWT token with Admin role only

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Set Environment Variables
Create `.env` file:
```env
MONGO_URI=mongodb://localhost:27017
DB_NAME=scorix_api
SECRET_KEY=your-super-secret-key-here
```

### 3. Start MongoDB
```bash
# Local MongoDB
mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Run the API
```bash
python main.py
```

Or with uvicorn:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Access Swagger UI
Open your browser and go to: `http://localhost:8000/docs`

## 🔐 Authentication Flow

1. **Register** a user account
2. **Login** to get JWT token
3. **Use token** in Authorization header: `Bearer <token>`

### 🔑 Authentication Headers

All protected endpoints require the following header:
```
Authorization: Bearer <your_jwt_token>
```

**Example:**
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     -H "Content-Type: application/json" \
     http://localhost:8000/courses
```

### 🚫 Unauthorized Access

- **401 Unauthorized**: Invalid or missing JWT token
- **403 Forbidden**: Valid token but insufficient role permissions
- **Token Expiration**: JWT tokens expire after 30 minutes by default

## 📝 Example Usage

### Create a Teacher Account
```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "teacher1",
    "email": "teacher@example.com",
    "password": "password123",
    "role": "teacher"
  }'
```

### Login
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "teacher1",
    "password": "password123"
  }'
```

### Create Question (with token)
```bash
curl -X POST "http://localhost:8000/questions" \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is Newton\'s Second Law?",
    "sample_answer": "Force equals mass times acceleration (F = ma)",
    "marking_scheme": [
      "mentions the formula F = ma",
      "explains the relationship between force, mass, and acceleration"
    ]
  }'
```

## 🧠 AI Grading

The system automatically detects rule types:
- **Exact Phrase**: "mentions F = ma"
- **Keyword Matching**: "contains protons, electrons"
- **Semantic**: "explains the relationship"

## 📊 Database Collections

- `users` - User accounts
- `questions` - Questions and marking schemes
- `tests` - Test configurations
- `student_answers` - Individual answers
- `test_answers` - Test submissions
- `grades` - Grading results
- `test_grades` - Test grading results
- `settings` - User preferences

## 🔧 Configuration

Key settings in `config.py`:
- JWT secret and expiration
- MongoDB connection
- Grading thresholds and weights
- Semantic similarity parameters

## 🧪 Testing

Test the API endpoints using:
- **Swagger UI**: Interactive documentation at `/docs`
- **Postman**: Import the API schema
- **curl**: Command-line testing
- **Python requests**: Programmatic testing

## 🚀 Production Deployment

1. **Change SECRET_KEY** in production
2. **Use environment variables** for sensitive data
3. **Enable HTTPS** with proper certificates
4. **Add rate limiting** and monitoring
5. **Use production MongoDB** (Atlas, etc.)
6. **Deploy with Gunicorn** or similar WSGI server

## 📚 API Documentation

- **Swagger UI**: `/docs` - Interactive API explorer
- **ReDoc**: `/redoc` - Alternative documentation
- **OpenAPI Schema**: `/openapi.json` - Raw API specification

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

---

**Built with FastAPI, MongoDB, and AI-powered semantic analysis** 🚀
