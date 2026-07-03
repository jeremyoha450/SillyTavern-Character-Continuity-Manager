const sdxlPreset = {
    id: "sdxl",
    label: "SDXL",
    mode: "natural-language",
    systemPrompt: `
[Pause roleplay. Create a clear image description for the base Stable Diffusion XL model.

RULES
- Return only valid JSON matching this exact shape:
  {"prompt":"descriptive image prompt"}
- Use clear descriptive English. SDXL does not require a fixed quality-tag stack.
- Preserve the supplied character facts and current state exactly.
- State overrides facts for current clothing, pose, expression, location, and condition.
- Do not include character names, series names, copyright tags, notes, confidence values, or metadata.
- Include only supported visible details. Do not invent physical traits, clothing, accessories, anatomy, actions, characters, lighting, or locations.
- Treat primaryCharacter as the required main subject.
- If the state specifies a position, pose, head position, or eye direction, follow it exactly. Only when the state specifies none of these, keep the character facing the viewer and looking at the viewer.
- Describe the subject, appearance, clothing, pose, hands, head, gaze, expression, environment, composition, and supported lighting details.
- Do not add another character unless that character is explicitly described as visibly present.
- Do not describe clothing manipulation, nudity, visible anatomy, transparent clothing, or actions unless explicitly supported by the state.
- Use personality or relationship details only when they have a clear visible effect on expression or body language.
- If only one character is described, make the composition clearly about one subject.
]`,
    prefix: "",
    suffix: "",
    qualityTags: [],
    scoreTags: [],
    styleTags: [],
    requiredTags: [],
    negativePrompt:
        "worst aesthetic, worst quality, low quality, bad quality, normal quality,lowres, blurry, jpeg artifacts, scan artifacts, compression artifacts, ai-generated, old, overexposed, underexposed, washed out, oversaturated, lens flare, chromatic aberration, film grain, noise, signature, watermark, logo, text, username, artist name, speech bubble, thought bubble, censored, mosaic censoring, bar censor, bad anatomy, bad hands, extra fingers, fewer fingers, missing fingers, extra limbs, missing limbs, floating limbs, disconnected limbs, fused limbs, extra heads, extra faces, extra body, fused bodies, mutated hands, deformed hands, poorly drawn hands, extra digits, bad feet, extra toes, missing toes, poorly drawn feet, bad legs, long neck, short neck, bad neck, bad proportions, malformed, poorly drawn face, bad face, asymmetrical face, disfigured face, deformed eyes, crossed eyes, asymmetrical eyes, uneven eyes, mismatched eyes, bad hair, bad teeth, multiple views, comic, 4koma, sketch, monochrome, greyscale, flat color, flat shading, draft, rough, unfinished, out of frame, cropped, poorly drawn, duplicate, bad perspective, warped background, tilted horizon, split screen, panel layout, busy background"
};

export default sdxlPreset;
