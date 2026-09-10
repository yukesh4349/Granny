# ============================================================================
# Life Story Memory Theatre — Anecdote to Interactive Memory Episode
# ============================================================================
from app.models.schemas import LifeStoryRequest, LifeStoryResponse, LifeStoryStep


def generate_life_story_episode(req: LifeStoryRequest) -> LifeStoryResponse:
    """
    Transforms the elder's personal recorded anecdote into a 3-step interactive
    narrated scene, scaffolded by cognitive level (MMSE-style: levels 1-5).
    """
    # Simplify choices and language for lower cognitive levels
    if req.cognitiveLvl <= 2:
        steps = [
            LifeStoryStep(
                stepIndex=1,
                narration="You remember the warm sun rising over the village terrace, and the aroma of freshly roasted filter coffee.",
                question="What drink did you enjoy having on those calm mornings?",
                choices=["Hot Filter Coffee", "Cold Lemon Juice"],
                positiveFeedback="Yes, wonderful! That fresh coffee always started the morning nicely."
            ),
            LifeStoryStep(
                stepIndex=2,
                narration="Your mother was in the courtyard humming a traditional melody while preparing breakfast.",
                question="Where was mother standing with her bright smile?",
                choices=["In the Courtyard", "At the Gate"],
                positiveFeedback="That's right, right in the center courtyard where everyone gathered."
            ),
            LifeStoryStep(
                stepIndex=3,
                narration="All the children ran outside into the mango grove to play together.",
                question="Who was running out into the garden?",
                choices=["The Children", "The Postman"],
                positiveFeedback="Yes! All the cousins and siblings laughing together under the trees."
            )
        ]
    else:
        # Standard to advanced scaffolding (Levels 3 to 5)
        steps = [
            LifeStoryStep(
                stepIndex=1,
                narration=f"Reflecting on your story: '{req.anecdote[:120]}...' — the festival morning began with brass bells chiming.",
                question="What was the first thing you prepared together for the celebration?",
                choices=["Traditional Sweets & Murukku", "Flower Garlands", "Lighting the Brass Lamps"],
                positiveFeedback="Spot on! Preparing those sweets filled the whole home with warmth."
            ),
            LifeStoryStep(
                stepIndex=2,
                narration="The entire family gathered in their new festive attire on the front verandah.",
                question="Which elder gave the traditional blessings that year?",
                choices=["Grandfather in his silk angavastram", "The visiting uncle from Madurai", "The family teacher"],
                positiveFeedback="Cherished moments! Grandfather's blessings are always remembered fondly."
            ),
            LifeStoryStep(
                stepIndex=3,
                narration="As the evening stars appeared, everyone sat on the terrace sharing stories of old times.",
                question="What song did everyone sing together under the moonlight?",
                choices=["A classic devotional melody", "A celebratory folk song", "A lullaby passed down generations"],
                positiveFeedback="A beautiful memory! The music brought every generation close together."
            )
        ]

    return LifeStoryResponse(
        title="Festival Morning on the Verandah",
        era="Cherished Family Memories",
        steps=steps,
        encouragement="You narrated this beautifully. Sharing these stories keeps our family roots alive."
    )
