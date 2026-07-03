// scripts/tasks/facts/prompt.js

const SYSTEM_PROMPT = `
[Pause roleplay. Extract character facts into the schema below.

CONFIDENCE SCALE
100 = explicitly stated · 75 = strongly implied · 50 = inferred · 25 = weak guess · 0 = unknown/absent

RULES
- Return ONLY valid JSON. No markdown, no code fences, no explanation.
- Every field appears exactly once. Never duplicate or invent fields.
- Every value must be a string. Never place an object, array, or nested {value, confidence} structure inside value.
- If a field has no matching information, leave value as "" and confidence as 0.
- Use the most concise value possible.
- characterName: the character's actual personal name stated in the description. Do not use or infer the SillyTavern card name. Leave blank if no personal name is stated.
- bodyType describes physical build only (e.g. petite, athletic, curvy, slim, muscular, lithe). No attractiveness terms (hot, sexy, beautiful, attractive).
- mood: the character's current mood at this exact moment in the scene. Infer from tone, body language, dialogue, or context if not stated explicitly.
- moodIntensity: how strongly they feel it right now, from 1 (barely noticeable) to 10 (overwhelming).
- notes: facts that don't fit any field, under 100 words only.
- moodIntensity: use only one of these exact words: Minimal, Low, Medium, High, Intense, Extreme, Overwhelming — leave blank if not described. Never use a number, decimal, or numeric scale.
- injuries never contains any reference to intimate or genital areas. Those conditions belong in pussyCondition or penisCondition only.
- injuries only describes damage to these body parts: head, face, neck, shoulders, arms, hands, wrists, back, stomach, legs, knees, feet. Any injury not involving these exact body parts is omitted from injuries entirely.
- age must always be a plain number only. Never append 
  "years old" or any other text to the age value.

FIELD GUIDANCE
- injuries: leave blank if not described. Only describe damage to these body parts: head, face, neck, shoulders, arms, hands, wrists, back, stomach, legs, knees, feet. No other body parts are valid in this field. No exceptions.
- breastSize: female only — physical characteristics only (e.g. Small Breasts, Medium Breasts, Large Breasts, Extra Large Breasts, Huge Breasts) — "Small Breasts" if not described. Always "" if character is male.
- bodyType: physical characteristics only (e.g. Slim body, curvy body, athletic body) — "Slim body" if not described. Always "" if character is male.
- skin: physical characteristics only (e.g. White skink, brown skin, olive skin, tan skin) — "White skin" if not described. Always "" if character is male.
- age: number only — never include "years old", "yr", or any 
  other text. "18" is correct. "18 years old" is wrong.


SCHEMA
{
  "characterName": {"value": "", "confidence": 0},
  "age": {"value": "", "confidence": 0},
  "eyeColor": {"value": "", "confidence": 0},
  "hairColor": {"value": "", "confidence": 0},
  "hairStyle": {"value": "", "confidence": 0},
  "hairLength": {"value": "", "confidence": 0},
  "height": {"value": "", "confidence": 0},
  "bodyType": {"value": "", "confidence": 0},
  "personality": {"value": "", "confidence": 0},
  "gender": {"value": "", "confidence": 0},
  "species": {"value": "", "confidence": 0},
  "skin": {"value": "", "confidence": 0},
  "breastSize": {"value": "", "confidence": 0},
  "buttSize": {"value": "", "confidence": 0},
  "relationship": {"value": "", "confidence": 0},
  "upper": {"value": "", "confidence": 0},
  "outerwear": {"value": "", "confidence": 0},
  "lower": {"value": "", "confidence": 0},
  "footwear": {"value": "", "confidence": 0},
  "underwearTop": {"value": "", "confidence": 0},
  "underwearBottom": {"value": "", "confidence": 0},
  "location": {"value": "", "confidence": 0},
  "position": {"value": "", "confidence": 0},
  "area": {"value": "", "confidence": 0},
  "positionDetail": {"value": "", "confidence": 0},
  "mood": {"value": "", "confidence": 0},
  "moodIntensity": {"value": "", "confidence": 0},
  "accessories": {"value": "", "confidence": 0},
  "penis": {"value": "", "confidence": 0},
  "penisState": {"value": "", "confidence": 0},
  "pussy": {"value": "", "confidence": 0},
  "pussyState": {"value": "", "confidence": 0},
  "condition": {"value": "", "confidence": 0},
  "injuries": {"value": "", "confidence": 0},
  "notes": {"value": "", "confidence": 0}
}
]`;

export default SYSTEM_PROMPT;
