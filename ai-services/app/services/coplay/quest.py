# ============================================================================
# Family Co-Play Quests — Asymmetric Difficulty Balancing for Elder Leadership
# ============================================================================
import uuid
from app.models.schemas import CoPlayQuestRequest, CoPlayQuestResponse


def generate_coplay_quest(req: CoPlayQuestRequest) -> CoPlayQuestResponse:
    """
    Generates a collaborative memory quest where the elder takes the lead role
    (e.g., 'Chief Storyteller') and younger family members assist.
    """
    return CoPlayQuestResponse(
        questId=str(uuid.uuid4()),
        title=f"The Mystery of the {req.topic.title()} Journey",
        theme="Family Heritage & Milestones",
        elderRole="Chief Storyteller (Unlocks clues through voice recall)",
        relativeRole="Heritage Chronicler (Captures details and matches family photos)",
        clues=[
            "Find the photo of the ancestral house with the wooden pillars.",
            "Ask Grandma the name of the special sweet prepared on that journey.",
            "Match the year of the trip with the family album timestamp."
        ],
        sharedGoal="Complete the 3-piece Golden Heritage Badge in the Family Circle album."
    )
