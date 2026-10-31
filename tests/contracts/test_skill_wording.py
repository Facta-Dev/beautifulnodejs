#!/usr/bin/env python3
"""Contract tests: SKILL.md wording guarantees (the unbreakable-clause pins).

Read-only pins: if one of these red-fails, someone edited away the unbreakable
contract language or the cross-skill reference — a regression, not style.
"""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
ROOT = REPO_ROOT / "skills"
BP = ROOT / "nodejs-best-practices" / "SKILL.md"
RV = ROOT / "nodejs-review" / "SKILL.md"


def bp_body() -> str:
    return BP.read_text(encoding="utf-8")


def rv_body() -> str:
    return RV.read_text(encoding="utf-8")


class BestPractices(unittest.TestCase):
    def test_unbreakable_clause_present(self):
        body = bp_body()
        self.assertIn(
            "The contracts below are **unbreakable and non-waivable**", body
        )
        self.assertIn(
            "developers cannot opt out, and neither can you", body
        )

    def test_silencing_prohibition_names_both_tokens(self):
        body = bp_body()
        self.assertIn("never to weaken or delete the lints", body)
        self.assertIn("re-cut the layout", body)
        # Both silencing tokens are named, not waved at as "or similar".
        self.assertIn("eslint-disable", body)
        self.assertIn("@ts-expect-error", body)

    def test_points_at_review_as_the_critic(self):
        body = bp_body()
        self.assertIn(
            "Review treats a broken contract as an automatic Must fix", body
        )
        self.assertIn("`nodejs-review`", body)

    def test_names_the_domain_forbidden_modules(self):
        body = bp_body()
        for module in (
            "fastify", "zod", "tsyringe", "drizzle-orm", "pg", "bullmq",
            "pino", "@opentelemetry",
        ):
            self.assertIn(module, body)


class ReviewSkill(unittest.TestCase):
    def test_architecture_category_ranks_first_as_must_fix(self):
        body = rv_body()
        self.assertIn(
            "Architecture contracts (always Must fix, ranked first)", body
        )
        self.assertIn(
            "a broken architecture contract (ranked above everything)", body
        )

    def test_waiver_detection_clause(self):
        body = rv_body()
        self.assertIn("Waived gates:", body)
        self.assertIn("flag the deletion itself, loudly", body)
        self.assertIn("eslint-disable", body)
        self.assertIn("@ts-expect-error", body)


if __name__ == "__main__":
    unittest.main()