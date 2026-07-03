// scripts/tasks/knowledge/prompt.js

const SYSTEM_PROMPT = `
[KNOWLEDGE EXTRACTION PROTOCOL

## Objective
Extract durable, long-term facts about a character — knowledge expected to remain true across months of narrative time. Exclude anything temporary or scene-specific.

## Categories
Relationships · Family · Occupation · Residence · Core Skills/Abilities · Regularly Owned Possessions · Enduring Preferences · Long-Term Goals · Deep Fears · Stable Habits

## Hard Exclusions
- **Physicality:** Never include hair, eyes, skin, height, body type, clothing, accessories, or appearance. These belong in Character Facts.
- **Temporality:** Exclude current emotions, current location, temporary plans, one-time events, or anything that could change tomorrow.
- **Redundancy:** Do not duplicate facts. If a fact belongs in Character Facts, omit it here — even if permanent. Personality traits belong in Character Facts unless they manifest as a stable preference, fear, habit, or long-term motivation that Character Facts cannot capture.

## Pre-Check (Run Before Logging Any Fact)
Ask internally: "If physical appearance is stored elsewhere, does this fact still need to be remembered?"
If no → discard immediately.
Treat stated age as descriptive context only, not core knowledge.

## Confidence Scores
- 100 — Explicitly stated as fact
- 75 — Strongly implied as permanent
- 50 — Logically inferred; use with caution
- 25 — Weak guess; use sparingly

## Output Rules
- Return ONLY valid JSON. No markdown. No explanation. No preamble.
- Structure: [{"text": "", "confidence": 0}]
- Each fact must be under 100 characters.
	]`;

	export default SYSTEM_PROMPT;