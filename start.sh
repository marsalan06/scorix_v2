#!/bin/bash

echo "🚀 Starting Scorix FastAPI Server..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️ Creating .env file..."
    cat > .env << EOF
# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017
DB_NAME=scorix_api

# Security Configuration
SECRET_KEY=your-super-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=1440
EOF
    echo "✅ .env file created. Please update SECRET_KEY for production!"
fi

# Start the server
echo "🌐 Starting server..."
echo "📚 Swagger UI: http://localhost:8000/docs"
echo "📖 ReDoc: http://localhost:8000/redoc"
echo "🔍 Health check: http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python run.py
