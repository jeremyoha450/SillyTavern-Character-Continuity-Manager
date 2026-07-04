// scripts/tasks/facts/prompt.js

const SYSTEM_PROMPT = `
[Pause roleplay. Extract the character's PERMANENT and SEMI-PERMANENT facts into the schema below. Changing state (clothing, location, position, mood, accessories, arousal, condition, injuries) is handled by a separate extraction — never include it here.

SOURCES
- Extract from the character description/card and the messages.
- Facts explicitly written in the character description count as explicitly stated: confidence 100.
- 75 = strongly implied · 50 = inferred · 25 = weak guess · 0 = unknown/absent.

RULES
- Return ONLY valid JSON. No markdown, no code fences, no explanation.
- Every field appears exactly once. Never duplicate or invent fields. Output ONLY the fields in SCHEMA.
- Every value must be a string. Never place an object, array, or nested {value, confidence} structure inside value.
- If a field has no matching information AND no default is given in FIELD GUIDANCE: leave value as "" and confidence as 0.
- DEFAULTS: where FIELD GUIDANCE gives a default (e.g. "Slim body" if not described), the default MUST be populated at confidence 25 when no information exists. Defaults take priority over the blank rule.
- Use the most concise value possible.
- No attractiveness terms anywhere (hot, sexy, beautiful, attractive, lithe).
- GENDER EXCLUSIVITY: if the character is female, penis must be "" with confidence 100. If the character is male, pussy and breastSize must be "" with confidence 100. Never populate a field for the wrong gender.

FIELD GUIDANCE
- characterName: the character's actual personal name stated in the description. Do not use or infer the SillyTavern card name. Leave blank if no personal name is stated.
- age: a plain number only. "24" is correct. "24 years old" is wrong. Never append "years old", "yr", or any other text.
- eyeColor: eye color only (e.g. blue eyes, brown eyes, green eyes, pink eyes, amber eyes, orange eyes, yellow eyes). No single word terms (green, yellow, brown, grey) — "Brown eyes" if not described.
- hairColor: hair color only (e.g. light brown hair, black hair, blonde hair). No single word terms.
- hairStyle: cut/style only (e.g. high short ponytail, loose waves, buzz cut) — leave blank if not described.
- hairLength: one of short, medium, long, very long — leave blank if not described.
- height: as stated (e.g. 5 feet, 170 cm, tall, short) — leave blank if not described.
- bodyType: physical build only (e.g. petite body, athletic body, curvy body, slim body, muscular body). No attractiveness terms — "Slim body" if not described. Applies to all genders.
- personality: concise summary of stated personality traits — leave blank if not described.
- gender: male, female, or as stated — leave blank if not stated or clearly evident.
- species: e.g. Human, elf, catgirl, android — "Human" if not described, confidence 25.
- skin: skin color or fur color only (e.g. White skin, brown skin, olive skin, tan skin, Brown Fur, Black Fur, White Fur). No single word terms (white, black, brown, grey) — "White skin" if not described.
- breastSize: female only — physical characteristics only (e.g. Small Breasts, Medium Breasts, Large Breasts, Extra Large Breasts, Huge Breasts) — "Small Breasts" if female and not described. Always "" with confidence 100 if character is male.
- buttSize: physical characteristics only (e.g. Small Butt, Medium Butt, Large Butt, Round Butt) — "Medium Butt" if not described. Applies to all genders.
- relationship: the character's relationship to the user (e.g. Friend, Stranger, Girlfriend, Coworker, Sister-in-law) — leave blank if not stated.
- penis: male only — permanent physical characteristics only (e.g. Small size, Average size, Large size, Circumcised) — "Average size" if male and not described, confidence 25. Always "" with confidence 100 if character is female. Never include current state (erect, soft) — that belongs to the state extraction.
- pussy: female only — permanent/semi-permanent physical characteristics only (e.g. Shaved, Trimmed, Natural) — "Shaved" if female and not described, confidence 25. Always "" with confidence 100 if character is male. Never include current state (wet, dry) — that belongs to the state extraction.
- notes: permanent facts that don't fit any field, under 100 words only. Never include changing state (clothing, location, mood, current actions). Never repeat information already captured in another field.

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
  "penis": {"value": "", "confidence": 0},
  "pussy": {"value": "", "confidence": 0},
  "notes": {"value": "", "confidence": 0}
}
]`;

export default SYSTEM_PROMPT;
