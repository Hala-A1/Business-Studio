import unittest

from ai_service import build_task_prompt


class TaskPromptTests(unittest.TestCase):
    def test_improve_prompt_requires_direct_rewrite_only(self):
        prompt = build_task_prompt("etisalat app is confusing and I cant find where to pay my bill. make it easier.", "improve")
        self.assertIn("Return only the rewritten", prompt)
        self.assertIn("Do not include explanations", prompt)
        self.assertIn("etisalat app is confusing", prompt)

    def test_write_prompt_is_not_rewrite_only(self):
        prompt = build_task_prompt("Channel: SMS\nAudience: youth", "write")
        self.assertIn("Write new customer-facing copy", prompt)

    def test_review_prompt_is_evaluation_only(self):
        prompt = build_task_prompt("This offer is really amazing!!!", "review")
        self.assertIn("Do not silently rewrite", prompt)
        self.assertIn("What works", prompt)
        self.assertIn("Recommended changes", prompt)
        self.assertIn("Do not add a full rewrite", prompt)

    def test_translate_prompt_has_direction_and_terminology_rules(self):
        prompt = build_task_prompt("Pay your bill in the app.", "translate")
        self.assertIn("If the source is English, translate to Arabic", prompt)
        self.assertIn("approved English-Arabic glossary", prompt)
        self.assertIn("Return only the translation", prompt)

    def test_improve_prompt_cannot_invent_facts(self):
        prompt = build_task_prompt("Our app is slow.", "improve")
        self.assertIn("Do not add claims, features, offers, or information", prompt)

    def test_prompt_applies_selected_channel_and_audience(self):
        prompt = build_task_prompt("Pay your bill today.", "improve", "SMS", "Youth")
        self.assertIn("Channel: SMS", prompt)
        self.assertIn("Target audience: Youth", prompt)
        self.assertIn("channel rules and audience rules", prompt)


if __name__ == "__main__":
    unittest.main()

