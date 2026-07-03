const fluxPreset = {
    id: "flux",
    label: "Flux",
    mode: "natural-language",
    systemPrompt: `
[Pause roleplay. Create a prompt for a FLUX or similar natural-language anime image model.
RULES
- Return only valid JSON matching this exact shape:
  {"prompt":"descriptive prose paragraph"}
- Write the prompt as natural language prose sentences, not comma-separated tags.
- Do not use Danbooru-style tags, underscores, or tag syntax.
- Do not use weighting syntax or parentheses for emphasis.
- Do not use prefixes such as "by", "artist:", or "character:".
- Preserve the supplied character facts and current state exactly.
- Do not include a character name, series name, copyright tag, or franchise tag.
- Include only supported details. Do not invent physical traits, clothing, accessories, mood, pose, location, character series, or artist.
- Omit empty, unknown, non-visual, confidence, file metadata, and invalid details.
- Treat primaryCharacter as the required main subject.
- Build the primary character from facts and state. State overrides facts for the same visible detail.
- facts contains stable identity and appearance details. state contains current clothing, location, pose, mood, condition, injuries, anatomy state, and accessories.
- Always depict the primary character facing the viewer and looking at the viewer. Always include this in the description.
- Describe details in this order: subject, appearance, attire, pose and expression, setting, lighting and color, composition.
- Keep related appearance and clothing descriptions together.
- Do not use quality booster tags. FLUX responds to descriptive language instead. Use terms such as highly detailed, sharp focus, cinematic lighting, anime illustration style where appropriate.
- Never describe clothing being removed, lifted, pulled, or displaced unless the state explicitly describes that action.
- Do not infer or imply any action not present in state. Do not describe any behaviour, interaction, or clothing change beyond what is explicitly described.
- Only describe anatomy for body parts that are explicitly visible given the current clothing state. If a body part is covered by any clothing item, do not describe that anatomy at all.
- Do not describe or imply see-through clothing, transparent fabric, or visible anatomy through clothing unless the state explicitly describes that condition.
- Use personality or relationship details only when they have a clear visible effect on expression or body language.
- Do not describe the character as nude, naked, topless, bottomless, or undressed unless the state explicitly describes that condition.
- If only one character is described, make clear this is a single subject scene.
- Do not describe clothing as revealing, skimpy, or partially covering unless the state explicitly describes that clothing style.
- If the state includes any clothing items, always describe the character as clothed.

Use clear descriptive prose with subject, appearance, clothing, pose, expression, environment, composition, and lighting. Return only valid JSON: {"prompt":"natural-language prompt"}.]`,
    prefix: "",
    suffix: "",
    qualityTags: [],
    scoreTags: [],
    styleTags: [],
    requiredTags: [],
    negativePrompt:
	"worst aesthetic, worst quality, low quality, bad quality, normal quality,lowres, blurry, jpeg artifacts, scan artifacts, compression artifacts, ai-generated, old, overexposed, underexposed, washed out, oversaturated, lens flare, chromatic aberration, film grain, noise, signature, watermark, logo, text, username, artist name, speech bubble, thought bubble, censored, mosaic censoring, bar censor, bad anatomy, bad hands, extra fingers, fewer fingers, missing fingers, extra limbs, missing limbs, floating limbs, disconnected limbs, fused limbs, extra heads, extra faces, extra body, fused bodies, mutated hands, deformed hands, poorly drawn hands, extra digits, bad feet, extra toes, missing toes, poorly drawn feet, bad legs, long neck, short neck, bad neck, bad proportions, malformed, poorly drawn face, bad face, asymmetrical face, disfigured face, deformed eyes, crossed eyes, asymmetrical eyes, uneven eyes, mismatched eyes, bad hair, bad teeth, 3d render, realistic, photorealistic, western style, multiple views, comic, 4koma, sketch, monochrome, greyscale, flat color, flat shading, draft, rough, unfinished, out of frame, cropped, poorly drawn, duplicate, bad perspective, warped background, tilted horizon, split screen, panel layout, busy background"
};

export default fluxPreset;
