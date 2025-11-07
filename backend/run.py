#!/usr/bin/env python3
"""
PDFMentor Backend Entry Point

This script starts the Flask development server.
In production, use a WSGI server like Gunicorn instead.
"""
from app import create_app
import os

# Create Flask application instance
app = create_app()

if __name__ == '__main__':
    # Get port from environment or use default
    port = int(os.getenv('PORT', 5000))
    # Check if running in development mode
    debug = os.getenv('FLASK_ENV') == 'development'
    
    # Start the Flask development server
    app.run(
        host='0.0.0.0',  # Listen on all interfaces
        port=port,
        debug=debug
    )
