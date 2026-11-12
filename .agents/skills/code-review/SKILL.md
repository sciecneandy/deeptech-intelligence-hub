---
name: code-review
description: Review code changes, commits, or pull requests for actionable defects and regressions. Use when the user asks for a code review.
---

# Code review

1. Understand the intended behavior, change scope, and surrounding code. Inspect relevant tests and project guidance.
2. Prioritize actionable defects: incorrect behavior, regressions, security and reliability risks, and meaningful missing validation. Avoid speculative concerns and style comments unless they have a concrete consequence.
3. Verify suspected issues where practical. Report findings first, ordered by severity, with precise file and line references, a concrete trigger, and impact. State assumptions or unverified points.
4. If no actionable findings exist, say so and identify material residual risks or testing gaps. Do not edit code unless the user also asks for fixes.
