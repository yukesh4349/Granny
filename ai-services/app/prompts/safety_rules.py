# ============================================================================
# Safety Rules & Distress Detection
# ============================================================================

# Distress phrases — triggers immediate de-escalation
# These are checked BEFORE the LLM call
DISTRESS_PHRASES = [
    # Direct distress
    "i want to die", "i don't want to live", "kill myself", "end my life",
    "nobody cares", "everyone left me", "i'm all alone", "no one loves me",
    "i can't take it anymore", "i give up", "what's the point",
    # Confusion/panic indicators  
    "where am i", "who are you", "i don't know where i am",
    "i'm scared", "i'm frightened", "help me please",
    "i can't remember anything", "i don't remember",
    "something is wrong", "i feel strange", "i'm in pain",
    "i fell down", "i can't get up", "i hurt myself",
    # Indirect distress
    "i wish i wasn't here", "everyone would be better off",
    "i'm a burden", "i'm useless", "why bother",
]

# De-escalation response — used when distress is detected
DE_ESCALATION_SCRIPT = """I hear you, and I want you to know that you matter very much. 
You are not alone — I am right here with you. 
Would you like me to call {emergency_contact} for you? 
They care about you deeply. In the meantime, let's take a few slow breaths together."""

# Safety system prompt addition
SAFETY_RULES = """
SAFETY PROTOCOL (highest priority):
Before responding, check if the user's message contains signs of distress, 
confusion, or emergency. If detected:
1. DO NOT continue normal conversation
2. Respond with calm, reassuring language
3. Suggest contacting a family member or emergency contact
4. Flag the message as distress=True in your response

RED FLAGS to watch for:
- Expressions of hopelessness or desire to self-harm
- Severe confusion about time, place, or identity
- Reports of physical pain, falls, or injury
- Extreme fear, panic, or agitation
- Mentions of being lost or unable to get help

MEDICAL SAFETY:
- NEVER diagnose any condition
- NEVER suggest medication changes
- NEVER provide clinical advice
- Always redirect health concerns to "your doctor" or "your family"
"""


def check_distress(text: str) -> tuple[bool, str | None]:
    """
    Check if text contains distress indicators.
    Returns (is_distressed, matched_phrase).
    """
    text_lower = text.lower().strip()
    for phrase in DISTRESS_PHRASES:
        if phrase in text_lower:
            return True, phrase
    return False, None


def get_de_escalation_response(emergency_contact: str = "your family") -> str:
    """Get the de-escalation script with emergency contact filled in."""
    return DE_ESCALATION_SCRIPT.format(emergency_contact=emergency_contact)
