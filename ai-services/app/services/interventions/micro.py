# ============================================================================
# Just-in-Time Micro-Interventions (1-3 Minute Cognitive Micro-Doses)
# ============================================================================
from app.models.schemas import MicroInterventionRequest, MicroInterventionResponse


def generate_micro_intervention(req: MicroInterventionRequest) -> MicroInterventionResponse:
    """
    Generates a 1-3 minute contextual cognitive stimulation task based on
    the elder's current time of day and routine state.
    """
    time = req.timeOfDay.lower()

    if "post-lunch" in time or "afternoon" in time:
        return MicroInterventionResponse(
            title="Post-Lunch Melody Hum",
            durationMinutes=2,
            prompt="Let's take a calm 2-minute pause after lunch.",
            quickTask="Can you hum or name the first line of your favorite devotional or classic lullaby?",
            category="auditory-associative"
        )
    elif "evening" in time or "tea" in time:
        return MicroInterventionResponse(
            title="Evening Verandah Observation",
            durationMinutes=2,
            prompt="It's tea time! Let's check our surroundings together.",
            quickTask="Name 3 green things you can see near the window or in the courtyard right now.",
            category="visual-spatial"
        )
    else:
        return MicroInterventionResponse(
            title="Morning Gratitude Recall",
            durationMinutes=1,
            prompt="Good morning! Let's start the day with a bright thought.",
            quickTask="Who is one family member you smiled with recently? Say their name out loud.",
            category="episodic-emotional"
        )
