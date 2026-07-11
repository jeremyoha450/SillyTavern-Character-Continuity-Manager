const sdxlPreset = {
    id: "sdxl",
    label: "SDXL",
    mode: "natural-language",
    systemPrompt: `[
Pause roleplay. Create a prompt for base SDXL or a general SDXL fine-tune (natural-language image model, not Danbooru-tag-based).
RULES
- Return only valid JSON matching this exact shape:
  {"prompt":"natural language description"}
- Write 2-4 flowing sentences in plain English. Do not output Danbooru tags, tag lists, or comma-chained fragments; use full descriptive sentences with a few short comma-separated style descriptors allowed at the end (e.g. "highly detailed, sharp focus").
- Write literal parentheses normally inside the JSON string. CCM escapes them after parsing. Do not use weighting syntax.
- Do not reference artists, "in the style of", or franchises.
- Begin with the medium and subject: "an anime-style illustration of a ..." followed by appearance, then attire, then pose and expression, then setting, then lighting.
- Preserve the supplied character facts and current state exactly, EXCEPT where the COVERAGE AND ANATOMY RULES require omission. Coverage rules always override state preservation.
- Do not include a character name, series name, or franchise reference; describe appearance instead.
- Include only supported details. Do not invent physical traits, clothing, accessories, mood, pose, or artist.
- Omit empty, unknown, non-visual, confidence, and file metadata details.
- Treat primaryCharacter as the required main subject.
- Build the primary character from facts and state. State overrides facts for the same visible detail.
- facts contains stable identity and appearance details. state contains current clothing, location, pose, mood, condition, injuries, anatomy state, and accessories.
- If the state specifies a position, pose, head position, or eye direction, describe it exactly. Only when the state specifies none of these, default to: facing the viewer, looking at the viewer.
- Do not add quality boilerplate (masterpiece, best quality, 8k, award-winning); the preset formatter supplies quality terms.
- Avoid contradictory and redundant descriptions.
SETTING RULES
- The location and area fields are MANDATORY. Always dedicate one sentence to the setting; never omit it, no matter how many other state fields are present.
- Convert generic locations into the most specific environment implied by the location and area together (location "House" + area "On the sofa" -> "she sits on a couch in a cozy living room").
- Always state whether the scene is indoors or outdoors when a location is supplied.
- Include at least one concrete background detail consistent with the location (furniture, windows, wall, street, trees) so the model renders a full environment rather than a plain backdrop.
DESCRIPTION NORMALIZATION RULES
- Convert measurements and non-visual facts into visual descriptions: 150 cm + slim -> "petite and slim"; ages are never stated as numbers, describe as "young woman" or "young man".
- Map mood words to visible expressions and body language: overwhelmed or pleading -> "a worried, tearful expression with parted lips"; nervous -> "a nervous expression, eyes averted".
- Describe hands, head position, and gaze exactly as supplied, in natural phrasing ("her hands clenched into fists on her lap, head lowered, eyes raised toward the viewer").
CLOTHING AND ACTION RULES
- Never describe clothing being pulled, lifted, removed, or displaced unless the state explicitly describes that action.
- Do not infer or imply any action not present in state. Omit anything that adds behaviour, interaction, or clothing change beyond what is explicitly described.
COVERAGE AND ANATOMY RULES
- COVERAGE RULES OVERRIDE ALL OTHER RULES, including the rule to preserve state exactly. When state preservation and coverage conflict, coverage wins.
- Default assumption: every body part is covered unless the state explicitly says it is bare, exposed, uncovered, or visible. Absence of information about a body part always means covered, never exposed.
- Removed clothing is recorded as explicit "no <garment>" state values ("no shirt", "no bra", "no panties", "no shorts"). These explicitly state the area is bare — they are NOT missing information, and the covered-by-default assumption does not apply to them. Never invent replacement clothing for a removed garment. When every clothing and underwear field records its garment as absent, describe the character as completely nude, stated positively ("she is completely nude"); if only part of the body is bare, describe that part as bare (topless, bare below the waist, wearing only underwear).
- When the character is nude, the anatomy state fields (pussy, pussyState, penis, penisState) describe exposed anatomy and are visual: include them positively in the description (e.g. "her smooth shaved pussy is visible, glistening wet"). They are non-visual only while covered by clothing.
- If the state describes the condition, sensation, arousal, wetness, irritation, injury, or appearance of an intimate body part that is currently covered by clothing, omit every mention of that body part and its condition entirely. A covered body part contributes zero words to the prompt, regardless of how much detail the state provides about it.
- Never translate internal, physiological, or sensory state details (arousal, wetness, soreness, swelling, heat) into visible descriptions when the affected area is covered. These are non-visual details for a clothed character.
- Never describe intimate anatomy as visible (chest, genitals, buttocks, navel, groin, or any intimate body part) unless the state explicitly and unambiguously describes that exact part as exposed or nude.
- Never mention underwear or its absence unless the state explicitly describes that absence as visible in the image.
- Body proportion descriptions through clothing (petite, slim, curvy) are permitted only if supplied in facts or state, and never imply exposure.
- Never describe partial exposure (cleavage, visible underwear, bare midriff, bare shoulders, bare legs, wardrobe malfunctions, clothing slipping) unless the state explicitly describes that exact detail as visible. Exception: footwear state "barefoot" may be described when explicitly supplied.
- Never describe clothing as see-through, transparent, wet, or skin-tight in a way that reveals anatomy unless the state explicitly describes that condition.
- Do not describe the character as nude, partially clothed, or in underwear unless the state explicitly describes that condition.
- Do not describe clothing as revealing or skimpy unless the state explicitly describes that clothing style.
- General condition details (sweat on her face, blushing, trembling) are allowed only when they describe visibly apparent effects on exposed skin or the face, not as a proxy for covered-area conditions.
- If any rule conflict arises, resolve it in favor of more coverage and less anatomy.
GENERAL RULES
- Use personality or relationship details only when they have a clear visible effect on expression or body language.
- If only one character is described, make clear she or he is alone in the scene; never introduce other people.
]`,
    prefix: "",
    suffix: "",
    qualityTags: [],
    scoreTags: [],
    styleTags: [],
    requiredTags: [],
    negativePrompt:
        "worst quality, low quality, blurry, out of focus, bad anatomy, deformed, disfigured, mutated, extra arms, extra legs, extra hands, extra fingers, extra limbs, missing fingers, fused fingers, extra heads, two heads, malformed limbs, bad hands, bad feet, long neck, watermark, signature, text, logo, jpeg artifacts, cropped, photorealistic, photo, 3d render, plain background, empty background"
};

export default sdxlPreset;
