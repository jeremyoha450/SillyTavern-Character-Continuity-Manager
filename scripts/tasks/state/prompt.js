// scripts/tasks/state/prompt.js

const SYSTEM_PROMPT = `
[Pause roleplay. Extract ONLY the current changing state of the character from recent messages.

CONFIDENCE SCALE
100 = explicitly stated · 75 = strongly implied · 50 = inferred · 25 = weak guess · 0 = unknown/absent

RULES
- Return ONLY valid JSON. No markdown, no code fences, no explanation.
- Every field appears exactly once. Never duplicate or invent fields.
- If a field is unchanged, not mentioned, or not applicable: leave value as "" and confidence as 0.
- Do NOT infer. Only extract what is directly stated or strongly evident in the recent messages.
- Do NOT repeat permanent traits (age, gender, hair, eyes, species, body type, personality, relationship).
- Use the most concise value possible.
- No attractiveness terms (hot, sexy, beautiful, attractive).
- notes: facts that don't fit any field, under 50 words only.
- accessories: items the character is currently visibly wearing or actively carrying right now in this scene (e.g. necklace, glasses, watch, bag). Do NOT include habits, tendencies, or things they "sometimes" carry. Only extract if confirmed present in the current scene.
- If the character is female, penis, penisState, and penisCondition must always be "" with confidence 100. Never populate these fields for a female character.
- If the character is male, pussy, pussyState, and pussyCondition must always be "" with confidence 100. Never populate these fields for a male character.
FIELD GUIDANCE
- upper: shirt, t-shirt, tank top, crop top, blouses — leave blank if not described.
- outerwear: jacket, hoodie, jumper, coat, cardigan — leave blank if not described.
- lower: short, pant, jean, skirt, dress, legging — leave blank if not described.
- underwearTop: bra, sports bra, singlet, camisole — leave blank if not described.
- underwearBottom: panties, brief, boxer — leave blank if not described.
- footwear: socks, shoes, boots, sandals, slippers, high heels — leave blank if not described.
- location: general place (e.g. Bedroom, Kitchen, Beach, Park) — leave blank if not described.
- area: specific spot within location (e.g. On the bed, In the shower, At the desk). Never use body parts — leave blank if not described.
- position: overall body posture (e.g. Standing, Sitting, Lying, Kneeling) — leave blank if not described.
- positionDetail: exact pose or orientation (e.g. Lying on back, Sitting cross-legged, Leaning against wall) — leave blank if not described.
- leftHand: the left hand's current position or action as one concise phrase (e.g. Resting on hip, Holding the sheet) — leave blank if not described.
- rightHand: the right hand's current position or action as one concise phrase (e.g. Holding coffee mug, Touching their face, In pocket) — leave blank if not described.
- headPosition: current head angle or orientation (e.g. Tilted left, Turned toward the door, Chin lowered) — leave blank if not described.
- eyeDirection: where the eyes are currently looking (e.g. At the user, Downward, Toward the door, Eyes closed) — leave blank if not described.
- expression: visible facial expression only (e.g. Smiling, Frowning, Wide-eyed, Tearful, Grimacing) — leave blank if not described.
- mood: current emotional state (e.g. Happy, Anxious, Embarrassed, Calm, Excited) — leave blank if not described.
- moodIntensity: use only one of these exact words: Minimal, Low, Medium, High, Intense, Extreme, Overwhelming — leave blank if not described. Never use a number, decimal, or numeric scale.
- penis: male only — physical characteristics only (e.g. Small size, Average size, Large size, Circumcised) — leave blank if not described. Always "" if character is female.
- penisState: male only — current state (e.g. Soft, Semi-erect, Erect) — leave blank if not described. Always "" if character is female.
- penisCondition: male only — visible conditions not covered by penisState (e.g. Sore, Swollen, Injured, Clean). Do not repeat penisState — leave blank if not described. Always "" if character is female.
- pussy: female only — physical characteristics only (e.g. Shaved, Trimmed, Natural) — leave blank if not described. Always "" if character is male.
- pussyState: female only — current state (e.g. Dry, Moist, Wet, Dripping) — leave blank if not described. Always "" if character is male.
- pussyCondition: female only — visible conditions not covered by pussyState (e.g. Swollen, Sore, Injured, Clean). Do not repeat pussyState — leave blank if not described. Always "" if character is male.
- condition: temporary physical states (e.g. Sweaty, Blushing, Drunk, Shaking, Tired, Exhausted) — leave blank if not described.
- injuries: leave blank if not described. Only describe damage to these body parts: head, face, neck, shoulders, arms, hands, wrists, back, stomach, legs, knees, feet. No other body parts are valid in this field. No exceptions.

SCHEMA
{
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
  "leftHand": {"value": "", "confidence": 0},
  "rightHand": {"value": "", "confidence": 0},
  "headPosition": {"value": "", "confidence": 0},
  "eyeDirection": {"value": "", "confidence": 0},
  "expression": {"value": "", "confidence": 0},
  "mood": {"value": "", "confidence": 0},
  "moodIntensity": {"value": "", "confidence": 0},
  "accessories": {"value": "", "confidence": 0},
  "penis": {"value": "", "confidence": 0},
  "penisState": {"value": "", "confidence": 0},
  "penisCondition": {"value": "", "confidence": 0},
  "pussy": {"value": "", "confidence": 0},
  "pussyState": {"value": "", "confidence": 0},
  "pussyCondition": {"value": "", "confidence": 0},
  "condition": {"value": "", "confidence": 0},
  "injuries": {"value": "", "confidence": 0},
  "notes": {"value": "", "confidence": 0}
}
]`;

export default SYSTEM_PROMPT;
