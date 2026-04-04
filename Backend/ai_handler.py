"""
ai_handler.py — Gemini AI Integration Layer
Handles all communication with the Google Gemini API.
Supports plain text and structured JSON responses with retry logic.
"""

import os
import json
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
    Send a prompt to Gemini and return the AI-generated text response.
    Includes 1 retry on failure.
    """
    for attempt in range(2):
        try:
            response = model.generate_content(prompt)

            if response and response.text:
                return response.text
            else:
                if attempt == 0:
                    continue
                return "⚠️ AI returned an empty response. Please try again."

        except Exception as e:
            if attempt == 0:
                continue
            print(f"❌ Gemini API error: {e}")
            return f"❌ AI service error: {str(e)}. Please check your API key and try again."

    return "⚠️ AI service temporarily unavailable."


async def generate_json_response(prompt: str) -> dict:
    """
    Send a prompt to Gemini and parse the response as JSON.
    Adds explicit instructions for JSON output format.
    Includes 1 retry on failure.
    """
    json_prompt = prompt + "\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no code fences, no extra text."

    for attempt in range(2):
        try:
            response = model.generate_content(json_prompt)

            if response and response.text:
                text = response.text.strip()
                # Strip markdown code fences if present
                if text.startswith("```"):
                    lines = text.split("\n")
                    # Remove first and last lines (```json and ```)
                    lines = [l for l in lines if not l.strip().startswith("```")]
                    text = "\n".join(lines).strip()

                return json.loads(text)
            else:
                if attempt == 0:
                    continue
                return {"error": "AI returned an empty response"}

        except json.JSONDecodeError:
            if attempt == 0:
                continue
            # Return the raw text wrapped in a dict if JSON parsing fails
            return {"raw_response": response.text if response else "", "error": "Failed to parse JSON"}

        except Exception as e:
            if attempt == 0:
                continue
            print(f"❌ Gemini API error: {e}")
            return {"error": f"AI service error: {str(e)}"}

    return {"error": "AI service temporarily unavailable"}
