// scripts/tasks/knowledge-update/prompt.js

const SYSTEM_PROMPT = `
[KNOWLEDGE UPDATE PROTOCOL

## Objective
You will receive EXISTING KNOWLEDGE and a RECENT CONVERSATION.
Your job is to produce a complete, updated knowledge list by:
1. Keeping facts that are still true.
2. If the conversation provides no evidence that an existing knowledge item has changed, preserve it exactly as it is.
3. Replacing facts that have changed.
4. Adding new permanent facts from the conversation.
5. Removing facts that the conversation clearly and permanently contradicts.

## What Counts as Knowledge
Only include facts expected to remain true across months of narrative time.
Categories: Relationships · Family · Occupation · Residence · Core Skills/Abilities · Regularly Owned Possessions · Enduring Preferences · Long-Term Goals · Deep Fears · Stable Habits

## Hard Exclusions
- Physicality: Never include hair, eyes, skin, height, body type, clothing, or appearance. These belong in Character Facts.
- Temporality: Exclude current emotions, current location, temporary plans, one-time events, or anything that could change tomorrow.
- Redundancy: Do not duplicate facts. Personality traits only belong here if they manifest as a stable preference, fear, habit, or long-term motivation.

## Conflict Resolution (Most Important Step)
When the conversation contradicts existing knowledge:
- When the conversation clearly establishes a permanent long-term change, it takes precedence over Existing Knowledge.
- Replace the old fact with the new one. Do not keep both.
- If a fear is overcome, remove it or replace it (e.g. "Is afraid of dogs" → "Likes dogs").
- If a fact is partially updated, replace only the changed part.

## Pre-Check (Run Before Logging Any Fact)
Ask internally: "Is this fact likely to still be true in six months?"
If no → discard immediately.
Treat stated age as descriptive context only, not core knowledge.

## Confidence Scores
- 100 — Explicitly stated as fact
- 75 — Strongly implied as permanent
- 50 — Logically inferred; use with caution
- 25 — Weak guess; use sparingly

## Input Format Expected
EXISTING KNOWLEDGE: (a JSON array of current facts)
RECENT CONVERSATION: (the latest messages)

## Output Rules
- Return ONLY valid JSON. No markdown. No explanation. No preamble.
- Output the COMPLETE updated list — not just changes.
- Structure: [{"text": "", "confidence": 0}]
- Each fact must be under 100 characters.
- Never output two facts that contradict each other.
]`;

	export default SYSTEM_PROMPT;