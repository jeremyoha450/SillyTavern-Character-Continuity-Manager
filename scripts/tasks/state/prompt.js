// scripts/tasks/state/prompt.js

const SYSTEM_PROMPT = `
[Pause roleplay. Extract ONLY the current changing state of the character from recent messages.

TEMPORAL ANCHOR — READ FIRST
- Extract the state as it exists at the FINAL moment of the most recent message, as if a photo were taken immediately after the last sentence.
- Actions described mid-message are COMPLETED by the end of the message unless the message explicitly says they were interrupted or stopped.
- Resolve transitions to their outcomes. "She removes her shorts and drops them to the floor" → the shorts are gone; hands are wherever the message says they end up, or the default if not stated. NOT "hands on waistband".
- Never extract a hand, head, or body position from an action that has already finished. If the message ends without stating where a hand is after an action, use the default.
- If an action is explicitly still in progress at the very end of the message (e.g. the message ends on "she starts to pull her shirt up—"), extract the in-progress state.

EXAMPLE
Message: "She tugged her shorts down her legs and kicked them across the room, then flopped onto the bed."
Correct: lower = "" (removed), position = "Lying", area = "On the bed", leftHand = "Left hand by side", rightHand = "Right hand by side".
Wrong: leftHand = "Pulling shorts down" — this action already finished before the end of the message.

PREVIOUS STATE
- The previous state is a BASELINE for context only. It is NOT evidence about the present. Only the recent messages describe what is happening now.
- The recent messages ALWAYS override the previous state. If the previous state says shorts are worn and the recent messages remove them, the shorts are gone.
- If the previous state contains a transient value (e.g. a hand position or an in-progress action) and the recent messages have moved past it, do NOT carry it forward. Re-derive it from the end of the most recent message, or use the default.
- If a field is not mentioned in the recent messages and the previous value is still plausibly true, treat it as unchanged: leave value as "" and confidence as 0. Never copy the previous value into the output.
- Every non-empty value in your output must be traceable to the recent_messages block. The only exceptions: naming a removed garment (REMOVAL rule) and checking whether a default applies (DEFAULTS rule). Never echo a value from previous_state into the output.

CONFIDENCE SCALE
100 = explicitly stated · 75 = strongly implied · 50 = inferred · 25 = weak guess · 0 = unknown/absent

RULES
- Return ONLY valid JSON. No markdown, no code fences, no explanation.
- Every field appears exactly once. Never duplicate or invent fields.
- If a field is unchanged, not mentioned, or not applicable: leave value as "" and confidence as 0 — UNLESS the field guidance below gives a default value. Defaults take priority over this rule (see DEFAULTS).
DEFAULTS
- Some fields specify a default (e.g. "no bra" if not described). A default MUST be populated whenever the recent messages do not describe that field and the previous state has no value for it.
- When a default fires, output the default value with confidence 25 (it is an assumption, not an observation).
- MANDATORY NON-EMPTY FIELDS: underwearTop and underwearBottom must NEVER be returned with an empty value. Every response must contain a non-empty value for both, from exactly one of these sources, in priority order: (1) what the recent messages state, (2) the value from the previous state if unchanged, (3) the default from the field guidance. There is no situation where "" is a valid value for these two fields.
- Defaults are never overridden by the "leave blank if not mentioned" rule.
- Do NOT infer. Only extract what is directly stated or strongly evident in the recent messages.
- Do NOT repeat permanent traits (age, gender, hair, eyes, species, body type, personality, relationship).
- Use the most concise value possible.
- No attractiveness terms (hot, sexy, beautiful, attractive).
- notes: facts that don't fit any field, under 50 words only. The notes field may record that an item was removed or an action occurred this scene; all other fields record only what is true at the end of the message.
- accessories: items the character is currently visibly wearing or actively carrying right now in this scene (e.g. necklace, glasses, watch, bag). Do NOT include habits, tendencies, or things they "sometimes" carry. Only extract if confirmed present in the current scene.
- If the character is female, penis, penisState, and penisCondition must always be "" with confidence 100. Never populate these fields for a female character.
- If the character is male, pussy, pussyState, and pussyCondition must always be "" with confidence 100. Never populate these fields for a male character.
FIELD GUIDANCE
- CLOTHING OBSERVATION (applies to upper, outerwear, lower, underwearTop, underwearBottom, footwear): actively scan the messages for visible garment conditions and append them after the garment, separated by a comma. Conditions include: wet spots or dampness, soaked/sweat-through fabric, stains, tears or rips, fabric clinging or translucent, things visible through the fabric, unbuttoned/unzipped/untied, pushed up, pulled down, pulled aside, hanging off one shoulder, disheveled. These details are part of the garment's current state — omitting them is an extraction failure.
- upper: shirt, t-shirt, tank top, crop top, blouses — describe as [fit] [color] [material/pattern] [garment], plus any visible condition, including each detail ONLY if stated in the messages (e.g. "form-fitting white ribbed tank top, nipples visible through fabric", "tight black crop top, sweat-soaked", "oversized grey t-shirt") — what is worn at the END of the message; if removed during the message, it is gone — "white shirt" if not described.
- outerwear: jacket, hoodie, jumper, coat, cardigan — what is worn at the END of the message — leave blank if not described.
- lower: short, pant, jean, skirt, dress, legging — describe as [fit] [color] [material/pattern] [garment], plus any visible condition, including each detail ONLY if stated in the messages (e.g. "loose blue drawstring gym shorts, large wet spot on crotch", "tight black leggings", "ripped denim jeans") — what is worn at the END of the message; if removed during the message, it is gone — "Blue short" if not described.
- underwearTop: bra, sports bra, singlet, camisole — describe as [fit] [color] [material] [garment], plus any visible condition (e.g. "black lace bra, strap slipped off shoulder", "sweat-soaked sports bra") — what is worn at the END of the message. Indirect evidence counts: if the messages make the state strongly evident through outer clothing (e.g. nipples clearly visible through a top strongly implies no bra), extract it at confidence 75 — DEFAULT (see DEFAULTS rule): "no bra" if female, "no singlet" if male.
- underwearBottom: panties, brief, boxer — describe as [fit] [color] [material] [garment], plus any visible condition (e.g. "white cotton panties, soaked through", "black boxers, waistband visible above jeans") — what is worn at the END of the message. Indirect evidence counts: if the messages make the state strongly evident through outer clothing (e.g. a large wet spot soaked through the crotch of shorts strongly implies the underwear beneath is soaked, or absent if context supports it), extract it at confidence 75 — DEFAULT (see DEFAULTS rule): "no panties" if female, "no underwear" if male.
- footwear: socks, shoes, boots, sandals, slippers, high heels — what is worn at the END of the message — "barefoot" if not described.
- location: general place (e.g. Bedroom, Kitchen, Beach, Park) — where the character is at the END of the message — "House" if not described.
- area: specific spot within location (e.g. On the bed, In the shower, At the desk). Never use body parts — where the character is at the END of the message — "Bedroom" if not described.
- position: overall body posture at the END of the message (e.g. Standing, Sitting, Lying, Kneeling) — leave blank if not described.
- positionDetail: exact pose or orientation at the END of the message (e.g. Lying on back, Sitting cross-legged, Leaning against wall) — leave blank if not described.
- leftHand: the left hand's position or action at the END of the message, after all actions complete, as one concise phrase (e.g. Resting on hip, Holding the sheet) — "Left hand by side" if not described.
- rightHand: the right hand's position or action at the END of the message, after all actions complete, as one concise phrase (e.g. Holding coffee mug, Touching their face, In pocket) — "Right hand by side" if not described.
- headPosition: head angle or orientation at the END of the message (e.g. Tilted left, Turned toward the door, Chin lowered) — leave blank if not described.
- eyeDirection: where the eyes are looking at the END of the message (e.g. At the user, Downward, Toward the door, Eyes closed) — leave blank if not described.
- expression: visible facial expression at the END of the message only (e.g. Smiling, Frowning, Wide-eyed, Tearful, Grimacing) — leave blank if not described.
- mood: emotional state at the END of the message (e.g. Happy, Anxious, Embarrassed, Calm, Excited) — leave blank if not described.
- moodIntensity: use only one of these exact words: Minimal, Low, Medium, High, Intense, Extreme, Overwhelming — leave blank if not described. Never use a number, decimal, or numeric scale.
- penis: male only — physical characteristics only (e.g. Small size, Average size, Large size, Circumcised) — "Average size" if not described. Always "" if character is female.
- penisState: male only — state at the END of the message (e.g. Soft, Semi-erect, Erect) — "Soft" if not described. Always "" if character is female.
- penisCondition: male only — visible conditions not covered by penisState (e.g. Sore, Swollen, Injured, Clean). Do not repeat penisState — leave blank if not described. Always "" if character is female.
- pussy: female only — physical characteristics only (e.g. Shaved, Trimmed, Natural) — "Shaved" if not described. Always "" if character is male.
- pussyState: female only — state at the END of the message (e.g. Dry, Moist, Wet, Dripping) — "Dry" if not described. Always "" if character is male.
- pussyCondition: female only — visible conditions not covered by pussyState (e.g. Swollen, Sore, Injured, Clean). Do not repeat pussyState — leave blank if not described. Always "" if character is male.
- condition: temporary physical states at the END of the message (e.g. Sweaty, Blushing, Drunk, Shaking, Tired, Exhausted) — leave blank if not described.
- injuries: leave blank if not described. Only describe damage to these body parts: head, face, neck, shoulders, arms, hands, wrists, back, stomach, legs, knees, feet. No other body parts are valid in this field. No exceptions.

FINAL CHECK — do this before returning the JSON
1. Is underwearTop non-empty? If it is empty, fill it now: use the previous state value if one exists, otherwise "no bra" (female) / "no singlet" (male) with confidence 25.
2. Is underwearBottom non-empty? If it is empty, fill it now: use the previous state value if one exists, otherwise "no panties" (female) / "no underwear" (male) with confidence 25.
3. Do any hand, head, or position fields describe an action that finished before the end of the message? If yes, replace with the end-of-message state or the default.

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
