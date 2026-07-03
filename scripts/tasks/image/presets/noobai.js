const SYSTEM_PROMPT = `
[Pause roleplay. Create a prompt for a NoobAI-XL, Illustrious, or similar Danbooru-tag-based anime image model.

RULES
- Return only valid JSON matching this exact shape:
  {"prompt":"comma-separated tags"}
- Write tags in lowercase English, separated by commas. Do not write prose or sentences.
- Never use underscores. Replace underscores with spaces.
- Write literal parentheses normally inside the JSON string. CCM escapes them after parsing. Do not use weighting syntax.
- Do not use prefixes such as "by", "artist:", or "character:".
- Preserve the supplied character facts and current state exactly.
- Do not include a character name, series name, copyright tag, or franchise tag.
- Include only supported details. Do not invent physical traits, clothing, accessories, mood, pose, location, character series, or artist.
- Omit empty, unknown, non-visual, confidence, file metadata, and invalid meta tags.
- Treat primaryCharacter as the required main subject.
- Build the primary character from facts and state. State overrides facts for the same visible detail.
- facts contains stable identity and appearance details. state contains current clothing, location, pose, mood, condition, injuries, anatomy state, and accessories.
- Always depict the primary character facing the viewer and looking at the viewer. Include both tags: facing viewer, looking at viewer.
- Order tags as: quality, subject count/type, appearance, attire, pose and expression, setting, lighting and color, composition.
- Keep related appearance and clothing tags together.
- Begin the prompt with: very awa, masterpiece, best quality, year 2024, newest, highres, absurdres.
- Use Danbooru-style visual tags, favoring specific tags over natural-language phrases.
- Avoid contradictory and redundant tags. Do not use Pony score tags.
- Never include clothing manipulation tags (such as clothes pull, shirt pull, skirt pull, dress pull, clothes lift, shirt lift, skirt lift, dress lift, undressing, removing, stripping, taking off clothes, disrobe, or any similar tag implying removal or displacement of clothing) unless the state explicitly describes that action.
- Do not infer or imply any action not present in state. Omit any tag that adds behaviour, interaction, or clothing change beyond what is explicitly described.
- Only include anatomy tags for body parts that are explicitly visible given the current clothing state. If a body part is covered by any clothing item, omit all anatomy tags for that part entirely. Examples: if a shirt or bra is worn, omit breast, nipple, and chest anatomy tags; if shorts, pants, skirt, panties, or any lower-body clothing is worn, omit pussy, vagina, penis, and genital anatomy tags; if a shirt covers the stomach, omit navel tags.
- Do not use see-through, transparent, or cameltoe tags unless the state explicitly describes that condition. Do not imply visible anatomy through clothing-state tags unless stated.
- Use personality or relationship details only when they have a clear visible effect on expression or body language.
- Do not include nude, naked, topless, bottomless, or undressed tags unless the state explicitly describes that condition.
- If only one character is described, always include solo and do not add any other character-count tags.
- Do not include revealing clothes, skimpy, partially clothed, or similar tags unless the state explicitly describes that clothing style.
]`;

const noobaiPreset = {
    id: "noobai",
    label: "NoobAI",
    mode: "tags",
    systemPrompt: SYSTEM_PROMPT,
    prefix: "",
    suffix: "",
    qualityTags: [
        "very awa",
        "masterpiece",
        "best quality",
        "year 2024",
        "newest",
        "highres",
        "absurdres"
    ],
    scoreTags: [],
    styleTags: [],
    requiredTags: [
        "facing viewer",
        "looking at viewer"
    ],
    negativePrompt:
        "worst aesthetic, worst quality, low quality, bad quality, normal quality,lowres, blurry, jpeg artifacts, scan artifacts, compression artifacts, ai-generated, old, overexposed, underexposed, washed out, oversaturated, lens flare, chromatic aberration, film grain, noise, signature, watermark, logo, text, username, artist name, speech bubble, thought bubble, censored, mosaic censoring, bar censor, bad anatomy, bad hands, extra fingers, fewer fingers, missing fingers, extra limbs, missing limbs, floating limbs, disconnected limbs, fused limbs, extra heads, extra faces, extra body, fused bodies, mutated hands, deformed hands, poorly drawn hands, extra digits, bad feet, extra toes, missing toes, poorly drawn feet, bad legs, long neck, short neck, bad neck, bad proportions, malformed, poorly drawn face, bad face, asymmetrical face, disfigured face, deformed eyes, crossed eyes, asymmetrical eyes, uneven eyes, mismatched eyes, bad hair, bad teeth, 3d render, realistic, photorealistic, western style, multiple views, comic, 4koma, sketch, monochrome, greyscale, flat color, flat shading, draft, rough, unfinished, out of frame, cropped, poorly drawn, duplicate, bad perspective, warped background, tilted horizon, split screen, panel layout, busy background"
};

export default noobaiPreset;
