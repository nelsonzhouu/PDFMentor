"""
Flask application factory

This module creates and configures the Flask application instance.
It sets up CORS, registers blueprints, and initializes configuration.
"""
from flask import Flask
from flask_cors import CORS
from app.config import Config

def create_app(config_class=Config):
    """
    Create and configure Flask application
    
    This factory function creates a new Flask app instance and:
    - Loads configuration from Config class
    - Initializes app directories (uploads, data)
    - Enables CORS for frontend communication
    - Registers API blueprints
    - Sets up health check endpoint
    
    Args:
        config_class: Configuration class to use (default: Config)
    
    Returns:
        Configured Flask application instance
    """
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize configuration (creates directories)
    config_class.init_app(app)
    
    # Enable CORS for specified origins
    # This allows the frontend to make requests to the backend
    CORS(app, resources={
        r"/api/*": {
            "origins": app.config['CORS_ORIGINS'],
            "methods": ["GET", "POST", "OPTIONS", "DELETE"],
            "allow_headers": ["Content-Type"]
        }
    })
    
    # Register blueprints (API routes)
    from app.routes import pdf_routes, chat_routes
    app.register_blueprint(pdf_routes.bp)
    app.register_blueprint(chat_routes.bp)
    
    # Health check endpoint for monitoring
    @app.route('/health')
    def health():
        """Simple health check endpoint"""
        return {'status': 'healthy'}, 200
    
    return app
