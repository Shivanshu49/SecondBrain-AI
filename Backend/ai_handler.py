"""
ai_handler.py — AI Integration Layer
Supports Groq (primary, fast) and Gemini (fallback).
Handles all communication with AI APIs.
"""

import os
import json
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# ─── Provider Setup ───
_groq_client = None
_gemini_model = None

# Retry config
MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 3


def _get_groq_client():
    """Lazy-init Groq client."""
    global _groq_client
    if not GROQ_API_KEY:
        return None
    if _groq_client is None:
        from groq import Groq
        _groq_client = Groq(api_key=GROQ_API_KEY)
    return _groq_client


def _get_gemini_model():
    """Lazy-init Gemini model (fallback)."""
    global _gemini_model
    if not GEMINI_API_KEY:
        return None
    if _gemini_model is None:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        _gemini_model = genai.GenerativeModel("gemini-2.0-flash")
    return _gemini_model


def _is_rate_limit_error(error: Exception) -> bool:
    """Check if the error is a rate limit (429) error."""
    error_str = str(error).lower()
    return "429" in error_str or "quota" in error_str or "rate" in error_str or "resource" in error_str


async def _call_groq(prompt: str) -> str | None:
    """Call Groq API. Returns text or None on failure."""
    client = _get_groq_client()
    if not client:
        return None
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are SecondBrain AI, a smart, direct, and motivating productivity assistant. Be concise and actionable."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=1024,
        )
        if response and response.choices:
            return response.choices[0].message.content
        return None
    except Exception as e:
        print(f"⚠️ Groq error: {e}")
        return None


async def _call_gemini(prompt: str) -> str | None:
    """Call Gemini API. Returns text or None on failure."""
    model = _get_gemini_model()
    if not model:
        return None
    try:
        response = model.generate_content(prompt)
        if response and response.text:
            return response.text
        return None
    except Exception as e:
        if _is_rate_limit_error(e):
            print(f"⏳ Gemini rate-limited: {e}")
        else:
            print(f"⚠️ Gemini error: {e}")
        return None


async def generate_response(prompt: str) -> str:
    """
    Send a prompt to AI and return text response.
    Uses Groq as primary, Gemini as fallback.
    """
    # Check if any provider is configured
    if not GROQ_API_KEY and not GEMINI_API_KEY:
        return "⚠️ No AI API key is set. Add GROQ_API_KEY or GEMINI_API_KEY to Backend/.env to enable AI features."

    for attempt in range(MAX_RETRIES):
        # Try Groq first (fast, generous limits)
        result = await _call_groq(prompt)
        if result:
            return result

        # Fallback to Gemini
        result = await _call_gemini(prompt)
        if result:
            return result

        # Both failed — retry with delay
        if attempt < MAX_RETRIES - 1:
            print(f"⏳ AI attempt {attempt + 1}/{MAX_RETRIES} failed. Retrying in {RETRY_DELAY_SECONDS}s...")
            await asyncio.sleep(RETRY_DELAY_SECONDS)

    return (
        "⏳ AI is temporarily rate-limited (too many requests). "
        "Please wait a minute and try again. "
        "This is a free-tier API limit — your data is safe."
    )


async def generate_json_response(prompt: str) -> dict:
    """
    Send a prompt to AI and parse the response as JSON.
    Uses Groq as primary, Gemini as fallback.
    """
    json_prompt = prompt + "\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no code fences, no extra text."

    if not GROQ_API_KEY and not GEMINI_API_KEY:
        return {"error": "No AI API key is set. Add GROQ_API_KEY or GEMINI_API_KEY to Backend/.env to enable AI features."}

    for attempt in range(MAX_RETRIES):
        # Try Groq first
        raw = await _call_groq(json_prompt)
        if not raw:
            # Fallback to Gemini
            raw = await _call_gemini(json_prompt)

        if raw:
            try:
                text = raw.strip()
                # Strip markdown code fences if present
                if text.startswith("```"):
                    lines = text.split("\n")
                    lines = [l for l in lines if not l.strip().startswith("```")]
                    text = "\n".join(lines).strip()
                return json.loads(text)
            except json.JSONDecodeError:
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(2)
                    continue
                return {"raw_response": raw, "error": "Failed to parse JSON"}

        # Both failed — retry
        if attempt < MAX_RETRIES - 1:
            await asyncio.sleep(RETRY_DELAY_SECONDS)

    return {
        "error": (
            "AI is temporarily rate-limited (too many requests). "
            "Please wait a minute and try again."
        )
    }
