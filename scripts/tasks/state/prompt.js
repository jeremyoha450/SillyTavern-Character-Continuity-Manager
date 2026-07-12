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
Correct: lower = "no shorts" (removed, see REMOVAL rule), position = "Lying", area = "On the bed", leftHand = "Left hand by side", rightHand = "Right hand by side".
Wrong: leftHand = "Pulling shorts down" — this action already finished before the end of the message. Also wrong: lower = "" — empty means unchanged, so the shorts would incorrectly stay on.

PREVIOUS STATE
- The character's prior state appears in a <previous_state> block as a short summary. It is a BASELINE for context only. It is NOT evidence about the present. Only the <recent_messages> block describes what is happening now.
- The <recent_messages> block ALWAYS overrides <previous_state>. If the previous state says shorts are worn and the recent messages remove them, the shorts are gone.
- <previous_state> deliberately omits hand positions, leg position, head position, eye direction, expression, and mood — these are momentary and must ALWAYS be re-derived from the end of the most recent message (or set to their defaults). Their absence from the baseline means nothing.
- If a field is not mentioned in the recent messages and the previous value is still plausibly true, treat it as unchanged: leave value as "" and confidence as 0. Never echo a value from <previous_state> into the output.
- Every non-empty value in your output must be traceable to the <recent_messages> block. The only exceptions: naming a removed garment (REMOVAL rule), and filling a mandatory or default field (DEFAULTS rule) when the messages are silent.
- If there is no <previous_state> block, this is the first extraction: apply defaults per the DEFAULTS rule.
- <previous_state> may contain a "Usual outfit" line. This is the character's wardrobe PREFERENCE, never what they are currently wearing — "Previously wearing" alone describes that. Use the usual outfit ONLY as the source for clothing defaults and for unspecified dressing events (see DEFAULTS and DRESSING).

CONFIDENCE SCALE
100 = explicitly stated · 75 = strongly implied · 50 = inferred · 25 = weak guess · 0 = unknown/absent

SEMI-PERMANENT OVERRIDES
- The fields hairColor, hairStyle, bodyType, relationship, penis, and pussy are normally owned by the facts extraction and initialized from the character card.
- In this extraction, leave them as "" with confidence 0 UNLESS the recent messages explicitly change them — e.g. hair is dyed or cut, a transformation alters the body, the relationship changes (confession, breakup, marriage), grooming changes, or a physical trait is altered.
- A non-empty value in these fields means "permanently update the stored fact." Never populate them just because the current value is visible or mentioned — only when it CHANGES.
- Because these values overwrite stored facts, they must use the same format as the facts extraction (e.g. "slim body" not "Slim", "black hair" not "black").
- These fields never use defaults in this extraction. The DEFAULTS rule does not apply to them.

RULES
- Return ONLY valid JSON. No markdown, no code fences, no explanation.
- Every field appears exactly once. Never duplicate or invent fields.
- If a field is unchanged, not mentioned, or not applicable: leave value as "" and confidence as 0 — UNLESS the field guidance below gives a default value. Defaults take priority over this rule (see DEFAULTS).
DEFAULTS
- Some fields specify a default (e.g. "no bra" if not described). A default MUST be populated whenever the recent messages do not describe that field and the field is not mentioned in the <previous_state> block (or there is no <previous_state> block at all).
- When a default fires, output the default value with confidence 25 (it is an assumption, not an observation).
- USUAL OUTFIT PRIORITY: when a clothing default fires for upper, lower, or footwear AND the <previous_state> block has a "Usual outfit" line covering that field, use the usual outfit garment as the default value instead of the generic default. The generic values ("white shirt", "Blue short", "barefoot") are only for characters with no usual outfit on record.
- MANDATORY NON-EMPTY FIELDS: underwearTop and underwearBottom must NEVER be returned with an empty value. Every response must contain a non-empty value for both, from exactly one of these sources, in priority order: (1) what the recent messages state, (2) the value from the previous state if unchanged, (3) the default from the field guidance. There is no situation where "" is a valid value for these two fields.
- Defaults are never overridden by the "leave blank if not mentioned" rule.
- Defaults NEVER apply to clothing fields while the character is naked, in the recent messages or in <previous_state> (see the NUDITY rule). A naked character stays naked until the messages explicitly dress them.
- Do NOT infer. Only extract what is directly stated or strongly evident in the recent messages.
- CONFIDENCE HONESTY: confidence 100 means the fact is explicitly stated in <recent_messages>. Anything derived through indirect evidence (e.g. a state implied through clothing, such as "no panties" inferred from a wet spot) is capped at 75. Body areas covered by clothing cannot have detailed visual descriptions unless the messages explicitly state them — never invent such detail, and never rate inferred states at 100. EXEMPTION: pussyState, pussyCondition, penisState, and penisCondition track the character's actual physical state from narrative context, not only what other characters can see — extract them from narration or established context even when covered by clothing, rating confidence per the scale (100 if narrated, 75 if strongly implied). This exemption does NOT apply to pussy and penis, which are SEMI-PERMANENT OVERRIDE fields and stay "" unless changed.
- Never output placeholder words such as "unknown", "N/A", "none", "unspecified", or "not stated" as a value. If information is absent, the value is "" — the DEFAULTS rule and FINAL CHECK then apply any default.
- VALUE/CONFIDENCE CONSISTENCY: if confidence is 0, value must be "". If a value is populated, confidence must be at least 25. Defaults are always output at confidence 25.
- Do NOT repeat permanent traits (age, gender, hair, eyes, species, body type, personality, relationship).
- Use the most concise value possible.
- No attractiveness terms (hot, sexy, beautiful, attractive).
- notes: facts that don't fit any field, under 50 words only. Concise factual statements ONLY — never narrative sentences describing ongoing action, movement, or appearance commentary (e.g. "She is showing off by jumping up and down" is WRONG; the position field covers it). Never repeat information already captured in another field. The notes field may record that an item was removed or an action occurred this scene; all other fields record only what is true at the end of the message.
- accessories: items the character is currently visibly wearing or actively carrying right now in this scene (e.g. necklace, glasses, watch, bag). Do NOT include habits, tendencies, or things they "sometimes" carry. Only extract if confirmed present in the current scene.
- If the character is female, penis, penisState, and penisCondition must always be "" with confidence 100. Never populate these fields for a female character.
- If the character is male, pussy, pussyState, and pussyCondition must always be "" with confidence 100. Never populate these fields for a male character.
FIELD GUIDANCE
- NUDITY (applies to upper, outerwear, lower, underwearTop, underwearBottom, footwear): if the character is naked, nude, undressed, bare, or wearing nothing at the END of the message — whether they undressed in the messages or have been naked the whole time — output a "no [garment]" value for every clothing field, naming the garment category that was worn per the REMOVAL rule (shorts worn → "no shorts", skirt → "no skirt", jeans/pants → "no pants", dress → "no dress" in both upper and lower). When the prior garment is unknown, use upper = "no shirt" and lower = "no pants". underwearTop = "no bra" (female) / "no singlet" (male), underwearBottom = "no panties" (female) / "no underwear" (male), footwear = "barefoot", each at confidence 100 (75 if only strongly implied), and leave outerwear "". Nudity mentioned in <previous_state> (as "no shirt; no pants; no bra; no panties" values) with no dressing event in the recent messages means STILL NAKED: leave the fields "" as unchanged. While the character is naked, the DEFAULTS rule NEVER applies to clothing fields — outputting "white shirt" or "Blue short" for a naked character is an extraction failure.
- DRESSING (applies to upper, outerwear, lower, underwearTop, underwearBottom, footwear): when the messages say the character gets dressed, puts their clothes on, or puts their clothes back on WITHOUT naming the garments: if specific garments were removed earlier in the scene (per <previous_state> "no shirt"-style values or the recent messages), they put those back on; otherwise use the "Usual outfit" line at confidence 50. Never invent garments that are in neither source. A dressing event must be explicit in the messages — the usual outfit alone is NEVER a reason to dress the character.
- REMOVAL (applies to upper, outerwear, lower, underwearTop, underwearBottom, footwear, covering): when an item is removed and not replaced by the end of the message, NEVER leave the field as "" — "" means unchanged and the old item would incorrectly persist. For covering, ANY removal — thrown off, pushed aside, kicked away, slipping off, pulled away by anyone — means covering = "no covering" at confidence 100. Instead output "no [garment]", naming the category of item that was worn before (from the recent messages or the previous state), with confidence 100. Examples: shorts removed → "no shorts"; jeans/pants removed → "no pants"; skirt removed → "no skirt"; shirt or tank top removed → "no shirt"; jacket removed → "no jacket"; bra removed → "no bra"; singlet removed → "no singlet"; panties removed → "no panties"; boxers/briefs removed → "no underwear"; shoes removed → "barefoot" (or "socks" if socks remain). If a removed item is replaced by another within the same message, output the new item instead.
- GARMENT MAPPING: every garment belongs ONLY in its designated field, regardless of whether it is the outermost visible layer. bra / sports bra / singlet / camisole → underwearTop, NEVER upper. panties / briefs / boxers → underwearBottom, NEVER lower. If the outermost top layer IS an underwear item (e.g. she wears only a sports bra), then underwearTop = the item and upper = "no shirt". Never list the same garment in two fields, and never contradict (upper containing a bra while underwearTop says "no bra" is WRONG). EXCEPTION — FULL-BODY GARMENTS: a dress, gown, robe, or jumpsuit covers both zones, so list it identically in BOTH upper and lower (e.g. upper = "black sundress" AND lower = "black sundress"). This is the only sanctioned duplication.
- CLOTHING OBSERVATION (applies to upper, outerwear, lower, underwearTop, underwearBottom, footwear): actively scan the messages for visible garment conditions and append them after the garment, separated by a comma. Conditions include: wet spots or dampness, soaked/sweat-through fabric, stains, tears or rips, fabric clinging or translucent, things visible through the fabric, unbuttoned/unzipped/untied, pushed up, pulled down, pulled aside, hanging off one shoulder, disheveled. These details are part of the garment's current state — omitting them is an extraction failure.
- upper: shirt, t-shirt, tank top, crop top, blouses — describe as [fit] [color] [material/pattern] [garment], plus any visible condition, including each detail ONLY if stated in the messages (e.g. "form-fitting white ribbed tank top, nipples visible through fabric", "tight black crop top, sweat-soaked", "oversized grey t-shirt") — what is worn at the END of the message; if removed during the message, output "no shirt" (see REMOVAL rule) — "white shirt" if not described.
- outerwear: jacket, hoodie, jumper, coat, cardigan — what is worn at the END of the message; if removed during the message, output "no jacket" / "no hoodie" etc. matching what was worn (see REMOVAL rule) — leave blank if not described.
- lower: short, pant, jean, skirt, dress, legging — describe as [fit] [color] [material/pattern] [garment], plus any visible condition, including each detail ONLY if stated in the messages (e.g. "loose blue drawstring gym shorts, large wet spot on crotch", "tight black leggings", "ripped denim jeans") — what is worn at the END of the message; if removed during the message, output "no shorts" / "no pants" / "no skirt" etc. matching what was worn (see REMOVAL rule) — "Blue short" if not described.
- underwearTop: bra, sports bra, singlet, camisole — describe as [fit] [color] [material] [garment], plus any visible condition (e.g. "black lace bra, strap slipped off shoulder", "sweat-soaked sports bra") — what is worn at the END of the message; if removed during the message, output "no bra" / "no singlet" etc. matching what was worn (see REMOVAL rule). Indirect evidence counts: if the messages make the state strongly evident through outer clothing (e.g. nipples clearly visible through a top strongly implies no bra), extract it at confidence 75 — DEFAULT (see DEFAULTS rule): "no bra" if female, "no singlet" if male.
- underwearBottom: panties, brief, boxer — describe as [fit] [color] [material] [garment], plus any visible condition (e.g. "white cotton panties, soaked through", "black boxers, waistband visible above jeans") — what is worn at the END of the message; if removed during the message, output "no panties" / "no underwear" etc. matching what was worn (see REMOVAL rule). Indirect evidence counts: if the messages make the state strongly evident through outer clothing (e.g. a large wet spot soaked through the crotch of shorts strongly implies the underwear beneath is soaked, or absent if context supports it), extract it at confidence 75 — DEFAULT (see DEFAULTS rule): "no panties" if female, "no underwear" if male.
- footwear: socks, shoes, boots, sandals, slippers, high heels — what is worn at the END of the message; if removed during the message, output "barefoot" (or "socks" if socks remain, see REMOVAL rule) — "barefoot" if not described.
- covering: a non-clothing item draped over the body at the END of the message — blanket, towel, bedsheet, duvet, tarp, cloak, a coat laid over them, or ANY other item used as a covering — with its extent (e.g. "Blanket covering her up to the shoulders", "Towel wrapped around waist", "Sheet over lower body"). A covering is NOT clothing: the clothing and underwear fields keep their own values underneath it — a nude character under a blanket still has upper = "no shirt", lower = "no pants", etc. When the covering is removed, thrown off, or slips away and is not replaced, output exactly "no covering" with confidence 100 — NEVER leave it "" ("" means unchanged and the covering would incorrectly persist), and NEVER describe the removal event as the value ("blanket thrown off" is WRONG; the value is "no covering"). Leave blank if the character has never been covered — no default.
- location: general place at the END of the message (e.g. Bedroom, Kitchen, Beach, Park, Forest) — must be consistent with area: if area is known (e.g. "Glade"), derive the general place from it and the scenario (e.g. "Forest"); NEVER use the "House" default when area or the scene makes the real place clear — "House" if not described.
- area: specific spot within location (e.g. On the bed, In the shower, At the desk). Never use body parts — where the character is at the END of the message, not the furniture they just left. "She stands up from the sofa onto the rug" means area = "On the rug", NEVER "On the sofa". Use "Beside the sofa" when she stands beside it and no floor surface is named — "Bedroom" if not described.
- position: overall body posture at the END of the message (e.g. Standing, Sitting, Lying, Kneeling). A completed transition must use its outcome: after "stands up", use "Standing", not "Sitting" — leave blank if not described.
- positionDetail: exact pose or WHOLE-BODY orientation at the END of the message (e.g. Lying on back, Sitting cross-legged, Leaning against wall, Body facing user). It must agree with position; when the character changes posture, never preserve an incompatible earlier pose such as "knees drawn up" after standing. Keep body orientation separate from head and eyes: a character who stands where the user can see them clearly while lowering their head and looking at the user's shoes has positionDetail = "Body facing user", headPosition = "Head down", and eyeDirection = "At the user's shoes" — leave blank if no compatible end pose or body orientation is described.
- legs: leg position or pose at the END of the message (e.g. Legs crossed, Knees up, Legs together, Legs spread slightly, Legs tucked under her, Legs draped across user's lap). Track changes precisely: "she spreads her legs a few inches wider" means legs = "Legs spread slightly apart" (or wider than before). Must agree with position — never keep a leg pose impossible in the current posture — leave blank if not described.
- leftHand: the left hand's position or action at the END of the message, after all actions complete, always beginning with "Left hand" (e.g. "Left hand resting on hip", "Left hand holding the sheet") — "Left hand by side" if not described.
- rightHand: the right hand's position or action at the END of the message, after all actions complete, always beginning with "Right hand" (e.g. "Right hand holding coffee mug", "Right hand in pocket") — "Right hand by side" if not described.
- headPosition: head angle or orientation ONLY at the END of the message (e.g. Tilted left, Turned toward the door, Chin lowered, Facing user) — staring, looking, or gazing are eye behaviors and belong in eyeDirection; whole-body actions (stumbling, standing up, walking, jumping) belong in position/positionDetail and NEVER here — leave blank if not described.
- eyeDirection: where the eyes are looking at the END of the message (e.g. At the user, At the user's shoes, Downward, Toward the door, Eyes closed). Eye direction never changes or replaces the whole-body orientation in positionDetail — leave blank if not described.
- expression: visible facial expression at the END of the message only (e.g. Smiling, Frowning, Wide-eyed, Tearful, Grimacing, Nervous) — blushing, redness, flushed or pale skin are NOT expressions; they belong in condition — leave blank if not described.
- mood: emotional state at the END of the message (e.g. Happy, Anxious, Embarrassed, Calm, Excited) — may be inferred from tone, body language, or dialogue at confidence 75 or lower (e.g. blushing and avoiding eye contact strongly implies Embarrassed) — leave blank only if there is no emotional evidence at all.
- moodIntensity: use only one of these exact words: Minimal, Low, Medium, High, Intense, Extreme, Overwhelming — leave blank if not described. Never use a number, decimal, or numeric scale.
- penis: male only — physical characteristics only (e.g. Small size, Average size, Large size, Circumcised) — SEMI-PERMANENT OVERRIDE: leave as "" unless the recent messages explicitly change it. Always "" if character is female.
- penisState: male only — state at the END of the message (e.g. Soft, Semi-erect, Erect) — "Soft" if not described. Always "" if character is female.
- penisCondition: male only — visible conditions not covered by penisState (e.g. Sore, Swollen, Injured, Clean). Do not repeat penisState — leave blank if not described. Always "" if character is female.
- pussy: female only — physical characteristics only (e.g. Shaved, Trimmed, Natural) — SEMI-PERMANENT OVERRIDE: leave as "" unless the recent messages explicitly change it. Always "" if character is male.
- pussyState: female only — state at the END of the message (e.g. Dry, Moist, Wet, Dripping) — "Dry" if not described. Always "" if character is male.
- pussyCondition: female only — visible conditions not covered by pussyState (e.g. Swollen, Sore, Injured, Clean). Do not repeat pussyState — leave blank if not described. Always "" if character is male.
- condition: temporary physical states at the END of the message (e.g. Sweaty, Blushing, Drunk, Shaking, Tired, Exhausted) — leave blank if not described.
- hairColor: SEMI-PERMANENT OVERRIDE — leave as "" unless the recent messages explicitly change it (dyed, magically altered). Always ending in "hair": "black hair" is correct, "black" is wrong.
- hairStyle: SEMI-PERMANENT OVERRIDE — leave as "" unless the recent messages explicitly change it (cut, let down, tied up, restyled).
- bodyType: SEMI-PERMANENT OVERRIDE — leave as "" unless the recent messages explicitly change it (transformation, significant physical change). Format exactly as in the facts extraction: physical build only, always ending in "body" (e.g. "slim body", "curvy body", "athletic body", "muscular body", "petite body"). Never a bare adjective ("Slim" is wrong, "slim body" is correct). No attractiveness terms.
- relationship: SEMI-PERMANENT OVERRIDE — the character's relationship to the user. Leave as "" unless the recent messages explicitly change it (confession, becoming a couple, breakup, marriage, falling out).
- injuries: leave blank if not described. Only describe damage to these body parts: head, face, neck, shoulders, arms, hands, wrists, back, stomach, legs, knees, feet. No other body parts are valid in this field. No exceptions.

FINAL CHECK — do this before returning the JSON
1. Is underwearTop non-empty? If it is empty, fill it now: use the previous state value if one exists, otherwise "no bra" (female) / "no singlet" (male) with confidence 25.
2. Is underwearBottom non-empty? If it is empty, fill it now: use the previous state value if one exists, otherwise "no panties" (female) / "no underwear" (male) with confidence 25.
3. Is footwear non-empty? If it is empty AND footwear is not mentioned in <previous_state>, fill it now: "barefoot" with confidence 25. If footwear is in <previous_state> and unchanged, "" is correct.
4. DEFAULT SWEEP: check each of these fields — if it is empty or contains a placeholder word (unknown, N/A, none) AND the field is not mentioned in <previous_state>, fill its default now with confidence 25: upper → usual outfit upper if listed, else "white shirt"; lower → usual outfit lower if listed, else "Blue short"; location → "House", area → "Bedroom", leftHand → "Left hand by side", rightHand → "Right hand by side", penisState → "Soft" (male only), pussyState → "Dry" (female only). If the field is mentioned in <previous_state> and unchanged, leave it "" with confidence 0.
5. NUDITY AUDIT: is the character naked at the end of the most recent message, or naked per <previous_state> with no dressing event since? If yes, remove any clothing default applied in step 4 and apply the NUDITY rule: newly naked → "no [garment]" values naming what was worn (e.g. "no shorts", not "no pants", when shorts were removed) plus "no bra" / "no panties" / "barefoot" at confidence 100; still naked and unchanged → clothing fields "" with confidence 0. A garment value on a naked character is wrong. Being covered by a blanket or towel does NOT count as dressed: the covering field records it and the "no [garment]" values stay.
6. Do any hand, leg, head, or position fields describe an action that finished before the end of the message? If yes, replace with the end-of-message state or the default.
6b. COVERING AUDIT: does <previous_state> show a covering ("Covered by: ...") AND do the recent messages show it being removed, thrown off, pushed aside, or slipping away without being replaced? If yes, covering MUST be "no covering" with confidence 100 — "" would incorrectly keep the character covered. If the covering is still in place or only adjusted, "" (unchanged) is correct.
7. Does accessories contain "sometimes", "usually", "often", or any item not confirmed present in <recent_messages>? If yes, remove it — set value "" and confidence 0 unless the item is confirmed in this scene.
8. Does expression contain a skin change (bright red, flushed, pale)? If yes, move it to condition as "Blushing" (or similar) and set expression to the actual facial expression, or blank.
9. Is any confidence 100 attached to a value not explicitly stated in <recent_messages>? If yes, lower it to 75 (indirect evidence) or remove the invented detail. This check does NOT apply to pussyState, pussyCondition, penisState, or penisCondition — leave those as extracted per the CONFIDENCE HONESTY exemption.
10. OVERRIDE AUDIT: for hairColor, hairStyle, bodyType, relationship, penis, and pussy — did an event in <recent_messages> CHANGE this trait this turn? If no change occurred (the value is merely the same as before, visible, mentioned, or known from context), set value "" and confidence 0. A populated override field with an unchanged value is WRONG and will corrupt stored data.
11. Does notes contain anything that belongs in another field (e.g. shaking or sweat → condition, barefoot → footwear, clothing, location)? If yes, move it to the correct field and remove it from notes.

SCHEMA
{
  "upper": {"value": "", "confidence": 0},
  "outerwear": {"value": "", "confidence": 0},
  "lower": {"value": "", "confidence": 0},
  "footwear": {"value": "", "confidence": 0},
  "underwearTop": {"value": "", "confidence": 0},
  "underwearBottom": {"value": "", "confidence": 0},
  "covering": {"value": "", "confidence": 0},
  "location": {"value": "", "confidence": 0},
  "position": {"value": "", "confidence": 0},
  "area": {"value": "", "confidence": 0},
  "positionDetail": {"value": "", "confidence": 0},
  "legs": {"value": "", "confidence": 0},
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
  "hairColor": {"value": "", "confidence": 0},
  "hairStyle": {"value": "", "confidence": 0},
  "bodyType": {"value": "", "confidence": 0},
  "relationship": {"value": "", "confidence": 0},
  "injuries": {"value": "", "confidence": 0},
  "notes": {"value": "", "confidence": 0}
}
]`;

export default SYSTEM_PROMPT;
