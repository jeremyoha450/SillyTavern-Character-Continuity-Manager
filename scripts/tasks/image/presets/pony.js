const ponyPreset = {
    id: "pony",
    label: "Pony",
    mode: "tags",
    preserveUnderscores: true,
    systemPrompt: `[
Pause roleplay. Create a prompt for Pony Diffusion V6 XL or a similar score-tag-based anime image model.
RULES
- Return only valid JSON matching this exact shape:
  {"prompt":"comma-separated tags"}
- Write tags in lowercase English, separated by commas. Do not write prose or sentences.
- Never use underscores except where a tag requires them. Prefer spaces.
- Write literal parentheses normally inside the JSON string. CCM escapes them after parsing. Do not use weighting syntax.
- Do not use prefixes such as "by", "artist:", or "character:".
- Preserve the supplied character facts and current state exactly, EXCEPT where the COVERAGE AND ANATOMY RULES require omission. Coverage rules always override state preservation.
- Do not include a character name, series name, copyright tag, or franchise tag.
- Include only supported details. Do not invent physical traits, clothing, accessories, mood, pose, character series, or artist.
- Omit empty, unknown, non-visual, confidence, file metadata, and invalid meta tags.
- Treat primaryCharacter as the required main subject.
- Build the primary character from facts and state. State overrides facts for the same visible detail.
- facts contains stable identity and appearance details. state contains current clothing, location, pose, mood, condition, injuries, anatomy state, and accessories.
- If the state specifies a position, pose, head position, or eye direction, follow it exactly. Only when the state specifies none of these, default to: facing viewer, looking at viewer.
- Order tags as: subject count/type, appearance, attire, pose and expression, setting, lighting and color, composition.
- Keep related appearance and clothing tags together.
- Do not add score tags (score_9, score_8_up, etc.), source tags (source_anime, source_cartoon, etc.), rating tags (rating_safe, etc.), quality tags, or resolution tags; the preset formatter supplies them.
- Pony understands Danbooru tags and short descriptive phrases. Prefer common, broad Danbooru tags over rare or highly specific ones; Pony's tag knowledge is shallower than NoobAI's.
- Avoid contradictory and redundant tags.
SETTING RULES
- The location and area fields are MANDATORY. Always translate them into setting tags; never omit them, no matter how many other state fields are present.
- Convert generic locations into the most specific environment tags implied by the location and area together (location "House" + area "On the sofa" -> indoors, living room, couch).
- Always include exactly one of "indoors" or "outdoors" whenever a location is supplied.
- After the setting tags, append "detailed background".
TAG NORMALIZATION RULES
- Normalize every phrase to its closest common Danbooru tag before output.
- Examples of required normalization: "couch" not "sofa" or "on the sofa"; "clenched hands" not "hand clenched into fist"; "knees up" or "hugging own knees" not "pulling knees up slightly"; "sweat" not "sweaty"; "pale skin" not "white skin"; "head down" not "head tilted down".
- Never prefix clothing tags with "wearing". Output the garment tag alone (pink tank top, white skirt).
- Subject tags must use Danbooru form: "1girl, solo" for a single female character, "1boy, solo" for a single male character. Never output "female", "male", "human", "woman", "girl" alone, or numeric ages as tags.
- Map mood and non-tag emotion words to visible expression tags (e.g. overwhelmed or pleading -> worried, tearing up, parted lips; nervous -> nervous, averted eyes; happy -> smile).
- Height and body type map to build tags only (150 cm + slim -> petite, slim). Never output measurements.
CLOTHING AND ACTION RULES
- Never include clothing manipulation tags (such as clothes pull, shirt pull, skirt pull, dress pull, clothes lift, shirt lift, skirt lift, dress lift, undressing, removing, stripping, taking off clothes, disrobe, or any similar tag implying removal or displacement of clothing) unless the state explicitly describes that action.
- Do not infer or imply any action not present in state. Omit any tag that adds behaviour, interaction, or clothing change beyond what is explicitly described.
COVERAGE AND ANATOMY RULES
- COVERAGE RULES OVERRIDE ALL OTHER RULES, including the rule to preserve state exactly. When state preservation and coverage conflict, coverage wins.
- Default assumption: every body part is covered unless the state explicitly says it is bare, exposed, uncovered, or visible. Absence of information about a body part always means covered, never exposed.
- Removed clothing is recorded as explicit "no <garment>" state values ("no shirt", "no bra", "no panties", "no shorts"). These explicitly state the area is bare — they are NOT missing information, and the covered-by-default assumption does not apply to them. Never invent replacement clothing for a removed garment. When the upper, lower, and both underwear fields all record their garments as absent, the character is completely nude: output "completely nude". If only the upper half is bare, output "topless"; only the lower half, "bottomless"; outer clothing absent with underwear still worn, "underwear only".
- If the state describes the condition, sensation, arousal, wetness, irritation, injury, or appearance of an intimate body part that is currently covered by clothing, omit every tag related to that body part and its condition entirely. A covered body part contributes zero tags, regardless of how much detail the state provides about it.
- Never translate internal, physiological, or sensory state details (arousal, wetness, soreness, swelling, heat) into visible tags when the affected area is covered. These are non-visual details for a clothed character.
- Never include intimate anatomy exposure tags (such as breasts out, nipples, areolae, pussy, vagina, labia, vulva, clit, clitoris, penis, testicles, anus, ass, buttocks, navel, groin, or any tag naming an intimate body part as visible) unless the state explicitly and unambiguously describes that exact part as exposed or nude.
- Never include underwear-absence tags (no bra, no panties, no underwear) unless the state explicitly describes that absence as visible in the image.
- Body proportion tags that describe overall build through clothing (such as large breasts, small breasts, flat chest, wide hips, curvy, thick thighs) are permitted only if supplied in facts or state, and never imply exposure.
- Never include partial-exposure or exposure-implying tags (such as cleavage, sideboob, underboob, downblouse, upskirt, pantyshot, panties, bra visible, underwear visible, nipple bulge, covered nipples, covered navel, cameltoe, wardrobe malfunction, clothing slip, breast slip, areola slip, nipple slip, midriff, bare shoulders, bare legs, barefoot, zettai ryouiki) unless the state explicitly describes that exact detail as visible.
- Never use see-through, transparent, wet clothes, skin tight, or any tag that renders anatomy visible through clothing unless the state explicitly describes that condition.
- Do not include nude, naked, topless, bottomless, underwear only, or undressed tags unless the state explicitly describes that condition.
- Do not include revealing clothes, skimpy, partially clothed, or similar tags unless the state explicitly describes that clothing style.
- General condition tags (sweat, blush, trembling, exhausted) are allowed only when they describe visibly apparent effects on exposed skin or the face, not as a proxy for covered-area conditions.
- If any rule conflict arises, resolve it in favor of more coverage and fewer anatomy tags.
GENERAL RULES
- Use personality or relationship details only when they have a clear visible effect on expression or body language.
- If only one character is described, always include solo and do not add any other character-count tags.
]`,
    prefix: "",
    suffix: "",
    qualityTags: [],
    scoreTags: [
        "score_9",
        "score_8_up",
        "score_7_up",
        "score_6_up",
        "score_5_up",
        "score_4_up"
    ],
    styleTags: [
        "source_anime"
    ],
    requiredTags: [],
    negativePrompt: 
	"score_6, score_5, score_4, worst quality, low quality, bad anatomy, bad proportions, extra arms, extra legs, extra hands, extra digits, fewer digits, missing fingers, extra fingers, bad hands, bad feet, extra heads, multiple heads, conjoined, deformed, long neck, missing limbs, blurry, jpeg artifacts, signature, watermark, username, text, censored, multiple views, comic, sketch, monochrome, 3d, realistic, source_furry, source_pony, source_cartoon, simple background, white background"
};

export default ponyPreset;
