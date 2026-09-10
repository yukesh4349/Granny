"""
Tests for Adaptive Difficulty Engine
Compatible with unittest and pytest.
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.schemas import DifficultyRequest, AttemptData
from app.services.games.difficulty import calculate_next_difficulty, DIFFICULTY_LEVELS


class TestDifficultyEngine(unittest.TestCase):

    def test_default_difficulty_without_history(self):
        req = DifficultyRequest(userId="user-1", gameKey="remember_my_home", recentAttempts=[])
        res = calculate_next_difficulty(req)
        self.assertEqual(res.difficulty, 3)
        self.assertEqual(res.itemCount, DIFFICULTY_LEVELS[3]["itemCount"])
        self.assertEqual(res.delaySeconds, DIFFICULTY_LEVELS[3]["delaySeconds"])

    def test_difficulty_scales_down_on_consecutive_failures(self):
        attempts = [
            AttemptData(correct=False, latencyMs=12000, errorType="wrong_choice")
            for _ in range(5)
        ]
        req = DifficultyRequest(userId="user-1", gameKey="remember_my_home", recentAttempts=attempts)
        res = calculate_next_difficulty(req)
        self.assertIn(res.difficulty, [1, 2])
        self.assertLessEqual(res.distractorCount, 1)

    def test_difficulty_scales_up_on_consecutive_successes(self):
        attempts = [
            AttemptData(correct=True, latencyMs=1800)
            for _ in range(5)
        ]
        req = DifficultyRequest(userId="user-1", gameKey="memory_market", recentAttempts=attempts)
        res = calculate_next_difficulty(req)
        self.assertIn(res.difficulty, [4, 5])
        self.assertGreaterEqual(res.itemCount, 5)

    def test_difficulty_clamped_levels(self):
        for level, cfg in DIFFICULTY_LEVELS.items():
            self.assertTrue(1 <= level <= 5)
            self.assertGreater(cfg["itemCount"], 0)
            self.assertGreater(cfg["delaySeconds"], 0)
            self.assertGreaterEqual(cfg["distractorCount"], 0)


if __name__ == '__main__':
    unittest.main()
