"""
ai_handler.py — Gemini AI Integration Layer
Handles all communication with the Google Gemini API.
"""

import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is not set in the .env file.")

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)

# Initialize model (gemini-2.0-flash for speed and free-tier compatibility)
model = genai.GenerativeModel("gemini-2.0-flash")


async def generate_response(prompt: str) -> str:
    """
    Send a prompt to Gemini and return the AI-generated response.
    
    Args:
        prompt: The text prompt to send to the AI model.
        
    Returns:
        The AI-generated text response, or an error message on failure.
    """
    try:
        response = model.generate_content(prompt)
        
        if response and response.text:
            return response.text
        else:
            return "⚠️ AI returned an empty response. Please try again."
            
    except Exception as e:
        print(f"❌ Gemini API error: {e}")
        return f"❌ AI service error: {str(e)}. Please check your API key and try again."
