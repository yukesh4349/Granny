"""
Tests for Life Story Memory Theatre, Family Quests, and Micro-Interventions
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.schemas import (
    LifeStoryRequest,
    CoPlayQuestRequest,
    MicroInterventionRequest,
)
from app.services.theatre.theatre import generate_life_story_episode
from app.services.coplay.quest import generate_coplay_quest
from app.services.interventions.micro import generate_micro_intervention


class TestStretchDifferentiators(unittest.TestCase):

    def test_life_story_generation_gentle(self):
        req = LifeStoryRequest(
            userId="user-1",
            anecdote="We used to make sweets on festival morning with grandfather.",
            cognitiveLvl=2
        )
        res = generate_life_story_episode(req)
        self.assertEqual(len(res.steps), 3)
        self.assertLessEqual(len(res.steps[0].choices), 2)  # Simplified choices for level 2

    def test_life_story_generation_advanced(self):
        req = LifeStoryRequest(
            userId="user-1",
            anecdote="We visited the heritage temple festival in Madurai with the entire family.",
            cognitiveLvl=4
        )
        res = generate_life_story_episode(req)
        self.assertEqual(len(res.steps), 3)
        self.assertGreaterEqual(len(res.steps[0].choices), 3)

    def test_coplay_quest_elder_leads(self):
        req = CoPlayQuestRequest(
            familyGroupId="fam-1",
            elderId="elder-1",
            topic="ancestral village journey"
        )
        res = generate_coplay_quest(req)
        self.assertIn("Chief Storyteller", res.elderRole)
        self.assertGreaterEqual(len(res.clues), 3)

    def test_micro_intervention_time_variants(self):
        # Post lunch
        res1 = generate_micro_intervention(MicroInterventionRequest(userId="user-1", timeOfDay="post-lunch"))
        self.assertIn("Lunch", res1.title)
        self.assertTrue(1 <= res1.durationMinutes <= 3)

        # Evening
        res2 = generate_micro_intervention(MicroInterventionRequest(userId="user-1", timeOfDay="evening"))
        self.assertIn("Verandah", res2.title)


if __name__ == '__main__':
    unittest.main()
