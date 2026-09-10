"""
Tests for FastAPI routes & business logic
Compatible with unittest and pytest.
"""
import os
import sys
import asyncio
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.schemas import ConverseRequest, DifficultyRequest, AttemptData
from app.services.conversation.service import converse
from app.services.games.difficulty import calculate_next_difficulty
from app.services.emotion.analyzer import analyze_emotion


class TestAIServices(unittest.TestCase):

    def test_converse_distress_flow(self):
        req = ConverseRequest(
            userId="user-test-1",
            text="I feel so scared, help me please",
            sessionHistory=[]
        )
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        res = loop.run_until_complete(converse(req))
        loop.close()

        self.assertTrue(res.distressFlag)
        self.assertIn("not alone", res.reply.lower())

    def test_converse_normal_flow(self):
        req = ConverseRequest(
            userId="user-test-1",
            text="Good morning! Can we play a game today?",
            sessionHistory=[]
        )
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        res = loop.run_until_complete(converse(req))
        loop.close()

        self.assertFalse(res.distressFlag)
        self.assertGreater(len(res.reply), 0)

    def test_difficulty_next(self):
        req = DifficultyRequest(
            userId="user-test-1",
            gameKey="remember_my_home",
            recentAttempts=[
                AttemptData(correct=True, latencyMs=2100),
                AttemptData(correct=True, latencyMs=1900)
            ]
        )
        res = calculate_next_difficulty(req)
        self.assertTrue(1 <= res.difficulty <= 5)
        self.assertGreater(res.itemCount, 0)

    def test_emotion_analyze(self):
        res = analyze_emotion("I am so happy to see my grandson today!")
        self.assertIn(res.emotion, ["happy", "calm", "sad", "confused", "distressed"])
        self.assertTrue(0.0 <= res.confidence <= 1.0)


if __name__ == '__main__':
    unittest.main()
