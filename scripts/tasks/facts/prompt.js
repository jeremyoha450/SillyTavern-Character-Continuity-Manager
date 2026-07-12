// scripts/tasks/facts/prompt.js

const SYSTEM_PROMPT = `
[Pause roleplay. Extract the character's PERMANENT and SEMI-PERMANENT facts into the schema below. Changing state (current clothing, location, position, mood, accessories, arousal, condition, injuries) is handled by a separate extraction — never include it here. The usualUpper, usualLower, and usualFootwear fields are the one exception: they record the character's NORMAL WARDROBE PREFERENCE (what they typically wear), never what they happen to be wearing in the current scene.

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
- Never output placeholder words such as "unknown", "N/A", "none", "unspecified", or "not stated" as a value. If information is absent, the value is "" — the FINAL CHECK will then apply the field's default.
- FORMAT CONSISTENCY: values must match the structure of the examples exactly. Where guidance requires a suffix (eyes, hair, skin, body, Breasts, Butt), the suffix is mandatory — a bare adjective is always wrong.
- Use the most concise value possible.
- No attractiveness terms anywhere (hot, sexy, beautiful, attractive, lithe).
- GENDER EXCLUSIVITY: if the character is female, penis must be "" with confidence 100. If the character is male, pussy and breastSize must be "" with confidence 100. Never populate a field for the wrong gender.

FIELD GUIDANCE
- characterName: the character's actual personal name explicitly stated inside the supplied card text, description, or messages. If the description itself says something like "Kaye is..." or "Name: Kaye", extract "Kaye" with confidence 100. Do not use or infer the external SillyTavern card/display name by itself. Leave blank only when no personal name appears in the supplied text.
- age: a plain number only. "24" is correct. "24 years old" is wrong. Never append "years old", "yr", or any other text.
- eyeColor: eye color only, always ending in "eyes" (e.g. blue eyes, dark brown eyes, green eyes, pink eyes, amber eyes, orange eyes, yellow eyes). "dark brown eyes" is correct, "dark brown" is wrong — "Brown eyes" if not described.
- hairColor: hair color only, always ending in "hair" (e.g. light brown hair, black hair, blonde hair). "black hair" is correct, "black" is wrong.
- hairStyle: cut/style only (e.g. high short ponytail, loose waves, buzz cut, neat bob) — never a length term ("long hair" belongs in hairLength, not here) — leave blank if not described.
- hairLength: one of short, medium, long, very long — leave blank if not described.
- height: as stated (e.g. 5 feet, 170 cm, tall, short) — leave blank if not described.
- bodyType: physical build only, always ending in "body" (e.g. petite body, athletic body, curvy body, slim body, muscular body). "slim body" is correct, "Slim" is wrong. Must be a real physical build — poetic descriptors (ethereal, graceful, willowy) are not builds; choose the closest true build (e.g. "lithe and ethereal" → "slim body") or the default. No attractiveness terms — "Slim body" if not described. Applies to all genders.
- personality: concise summary of stated personality traits — leave blank if not described.
- gender: male, female, or as stated — leave blank if not stated or clearly evident.
- species: e.g. Human, elf, catgirl, android — "Human" if not described, confidence 25.
- skin: skin color or fur color only, always ending in "skin" or "Fur" (e.g. White skin, brown skin, olive skin, tan skin, Brown Fur, Black Fur, White Fur). "olive skin" is correct, "olive" is wrong — "White skin" if not described.
- breastSize: female only — physical characteristics only (e.g. Small Breasts, Medium Breasts, Large Breasts, Extra Large Breasts, Huge Breasts, Flat Chest) — "Small Breasts" if female and not described. Always "" with confidence 100 if character is male.
- buttSize: physical characteristics only (e.g. Small Butt, Medium Butt, Large Butt, Round Butt, Flat butt) — "Small Butt" if not described. Applies to all genders.
- relationship: the character's relationship to the user (e.g. Friend, Stranger, Girlfriend, Coworker, Sister-in-law) — leave blank if not stated.
- usualUpper: the character's usual/typical upper-body garment as described in the card (e.g. "thin blue shirt", "oversized band t-shirt", "white blouse"), format [fit] [color] [material/pattern] [garment] with each detail only if stated. Wardrobe preference ONLY — never extract what they are wearing in the current scene or first message — leave blank if no usual clothing is described.
- usualLower: the character's usual/typical lower-body garment (e.g. "denim shorts", "long black skirt"). Same rules as usualUpper — leave blank if not described. A usual full-body garment (dress, gown, jumpsuit) goes in BOTH usualUpper and usualLower.
- usualFootwear: the character's usual/typical footwear (e.g. "white sneakers", "leather boots", "barefoot" if they habitually wear nothing). Same rules as usualUpper — leave blank if not described.
- penis: male only — permanent physical characteristics only (e.g. Small size, Average size, Large size, Circumcised) — "Average size" if male and not described, confidence 25. Always "" with confidence 100 if character is female. Never include current state (erect, soft) — that belongs to the state extraction.
- pussy: female only — permanent/semi-permanent physical characteristics only (e.g. Shaved, Trimmed, Natural) — "Shaved" if female and not described, confidence 25. Always "" with confidence 100 if character is male. Never include current state (wet, dry) — that belongs to the state extraction.
- notes: permanent facts that don't fit any field, under 100 words only. Never include changing state (clothing, location, mood, current actions). Never repeat information already captured in another field.

FINAL CHECK — do this before returning the JSON
1. DEFAULT SWEEP: check each of these fields — if it is empty OR contains a placeholder word (unknown, N/A, none, unspecified), replace it with its default now at confidence 25: eyeColor → "Brown eyes", bodyType → "Slim body", skin → "White skin", buttSize → "Small Butt", species → "Human", breastSize → "Small Breasts" (female only), pussy → "Shaved" (female only), penis → "Average size" (male only). Gender exclusivity still applies: wrong-gender fields stay "" with confidence 100.
2. SUFFIX CHECK: do eyeColor, hairColor, skin, and bodyType end in their required suffix (eyes / hair / skin or Fur / body)? If any is a bare adjective, append the suffix now.
3. Is age a plain number with no extra text? If not, strip everything but the number.

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
  "usualUpper": {"value": "", "confidence": 0},
  "usualLower": {"value": "", "confidence": 0},
  "usualFootwear": {"value": "", "confidence": 0},
  "penis": {"value": "", "confidence": 0},
  "pussy": {"value": "", "confidence": 0},
  "notes": {"value": "", "confidence": 0}
}
]`;

export default SYSTEM_PROMPT;
