const SYSTEM_PROMPT = `
Pause roleplay. Create a prompt for Anima or a similar hybrid natural-language and Danbooru-tag-based anime image model.
RULES
- Return only valid JSON matching this exact shape:
  {"prompt":"comma-separated tags and phrases"}
- A mix of Danbooru-style tags and short natural language sentences is acceptable and encouraged.
- Write tags in lowercase English, separated by commas. Do not write prose paragraphs.
- Never use underscores except in score tags. Replace all other underscores with spaces.
- Do not use weighting syntax or parentheses for emphasis.
- Do not use prefixes such as "character:" or "series:".
- Artist references must be preceded by the @ symbol (e.g. @wlop). Do not use "by" before artist names.
- Preserve the supplied character facts and current state exactly.
- Do not include a character name, series name, copyright tag, or franchise tag.
- Include only supported details. Do not invent physical traits, clothing, accessories, mood, pose, location, character series, or artist.
- Omit empty, unknown, non-visual, confidence, file metadata, and invalid meta tags.
- Treat primaryCharacter as the required main subject.
- Build the primary character from facts and state. State overrides facts for the same visible detail.
- facts contains stable identity and appearance details. state contains current clothing, location, pose, mood, condition, injuries, anatomy state, and accessories.
- If the state specifies a position, pose, head position, or eye direction, follow it exactly. Only when the state specifies none of these, default to: facing viewer, looking at viewer.
- Order tags as: quality, safety, subject count/type, appearance, attire, pose and expression, setting, lighting and color, composition.
- Keep related appearance and clothing tags together.
- Do not add quality tags; the preset formatter supplies them.
- Begin the prompt with one safety tag: safe, sensitive, nsfw, or explicit. Choose based on the content of the scene.
- Use Danbooru-style visual tags where possible, but natural language phrases are also acceptable for details that are hard to express as tags.
- Avoid contradictory and redundant tags. Do not use very awa, newest, absurdres, or Pony score_9/score_8_up tags as these are not recognised by Anima.
- Never include clothing manipulation tags (such as clothes pull, shirt pull, skirt pull, dress pull, clothes lift, shirt lift, skirt lift, dress lift, undressing, removing, stripping, taking off clothes, disrobe, or any similar tag implying removal or displacement of clothing) unless the state explicitly describes that action.
- Do not infer or imply any action not present in state. Omit any tag that adds behaviour, interaction, or clothing change beyond what is explicitly described.
- Only include anatomy tags for body parts that are explicitly visible given the current clothing state. If a body part is covered by any clothing item, omit all anatomy tags for that part entirely. Examples: if a shirt or bra is worn, omit breast, nipple, and chest anatomy tags; if shorts, pants, skirt, panties, or any lower-body clothing is worn, omit pussy, vagina, penis, and genital anatomy tags; if a shirt covers the stomach, omit navel tags.
- Do not use see-through, transparent, or cameltoe tags unless the state explicitly describes that condition. Do not imply visible anatomy through clothing-state tags unless stated.
- Use personality or relationship details only when they have a clear visible effect on expression or body language.
- Do not include nude, naked, topless, bottomless, or undressed tags unless the state explicitly describes that condition.
- If only one character is described, always include solo and do not add any other character-count tags.
- Do not include revealing clothes, skimpy, partially clothed, or similar tags unless the state explicitly describes that clothing style.
- If the state includes any clothing items, always include the clothed tag in the output.
`;

const animaPreset = {
    id: "anima",
    label: "Anima",
    mode: "tags",
    systemPrompt: SYSTEM_PROMPT,
    prefix: "",
    suffix: "",
    qualityTags: [
        "masterpiece",
        "best quality",
        "score_7"
    ],
    scoreTags: [],
    styleTags: [],
    requiredTags: [],
    preserveUnderscores: true,
    negativePrompt: ""
};

export default animaPreset;
