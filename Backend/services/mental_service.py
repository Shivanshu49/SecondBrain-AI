"""
services/mental_service.py — Mental State Detection
Analyzes user text to detect emotional state and provide supportive advice.
"""

from ai_handler import generate_response


async def analyze_mental_state(text: str) -> dict:
    """
    Take user's text input (journal entry, chat message, note),
    detect their emotional state, and provide supportive guidance.
    """
    prompt = f"""You are SecondBrain AI, an empathetic mental wellness assistant.

The user shared this text:
"{text}"

Your job:
1. EMOTION: Detect the primary emotion (e.g., stressed, anxious, motivated, happy, overwhelmed, frustrated, calm, sad, excited).
2. INTENSITY: Rate the intensity — LOW, MEDIUM, or HIGH.
3. SUGGESTION: Give a brief, supportive suggestion (1-2 sentences). Be warm and practical.
4. RESPONSE: Write a short, empathetic response to the user (2-3 sentences).

Format EXACTLY like this:
EMOTION: [emotion]
INTENSITY: [LOW/MEDIUM/HIGH]
SUGGESTION: [your suggestion]
RESPONSE: [your empathetic response]"""

    result = await generate_response(prompt)

    # Parse structured response
    emotion = "neutral"
    intensity = "medium"
    suggestion = ""
    ai_response = result  # Fallback to full text

    lines = result.split("\n")
    for line in lines:
        line_stripped = line.strip()
        if line_stripped.upper().startswith("EMOTION:"):
            emotion = line_stripped.split(":", 1)[1].strip().lower()
        elif line_stripped.upper().startswith("INTENSITY:"):
            val = line_stripped.split(":", 1)[1].strip().upper()
            if "HIGH" in val:
                intensity = "high"
            elif "LOW" in val:
                intensity = "low"
            else:
                intensity = "medium"
        elif line_stripped.upper().startswith("SUGGESTION:"):
            suggestion = line_stripped.split(":", 1)[1].strip()
        elif line_stripped.upper().startswith("RESPONSE:"):
            ai_response = line_stripped.split(":", 1)[1].strip()

    return {
        "success": True,
        "emotion": emotion,
        "intensity": intensity,
        "suggestion": suggestion,
        "ai_response": ai_response,
    }
