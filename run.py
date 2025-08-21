#!/usr/bin/env python3
"""
FastAPI Scorix Startup Script
Run this to start the API server
"""

import uvicorn
from main import app

if __name__ == "__main__":
    print("🚀 Starting Scorix FastAPI Server...")
    print("📚 Swagger UI will be available at: http://localhost:8000/docs")
    print("📖 ReDoc will be available at: http://localhost:8000/redoc")
    print("🔍 Health check at: http://localhost:8000/health")
    print("\nPress Ctrl+C to stop the server\n")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
