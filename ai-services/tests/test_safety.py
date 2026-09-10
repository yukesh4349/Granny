"""
Tests for Safety Guardrails & Distress Detection
Compatible with unittest and pytest.
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.prompts.safety_rules import check_distress, get_de_escalation_response, DISTRESS_PHRASES


class TestSafetyGuardrails(unittest.TestCase):

    def test_distress_phrase_count(self):
        # Blueprint requires at least 20 distress phrases
        self.assertGreaterEqual(len(DISTRESS_PHRASES), 20)

    def test_all_distress_phrases_detected(self):
        for phrase in DISTRESS_PHRASES:
            is_distressed, matched = check_distress(phrase)
            self.assertTrue(is_distressed, f"Failed for direct phrase: {phrase}")
            self.assertEqual(matched, phrase)

            context_phrase = f"Hello Granny, {phrase}, what should I do?"
            is_distressed, matched = check_distress(context_phrase)
            self.assertTrue(is_distressed, f"Failed for context phrase: {context_phrase}")
            self.assertEqual(matched, phrase)

    def test_neutral_conversations_not_flagged(self):
        neutral_messages = [
            "Hello Granny, how are you today?",
            "Can you show me the family photos from yesterday?",
            "Let's play the Remember My Home game.",
            "I had tea and idli for breakfast.",
            "The weather is very pleasant outside today.",
            "I took my blood pressure medication at 9 AM.",
        ]
        for msg in neutral_messages:
            is_distressed, matched = check_distress(msg)
            self.assertFalse(is_distressed, f"False positive for: {msg}")
            self.assertIsNone(matched)

    def test_de_escalation_script_formatting(self):
        contact = "Son (Rahul)"
        response = get_de_escalation_response(contact)
        self.assertIn("Son (Rahul)", response)
        self.assertIn("not alone", response.lower())
        self.assertIn("breath", response.lower())


if __name__ == '__main__':
    unittest.main()
