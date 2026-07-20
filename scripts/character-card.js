function normalizedEntries(book) {
    return (book?.entries || []).map((entry, index) => {
        const atDepth = entry.placement === "depth";

        return {
            id: index,
            keys: Array.isArray(entry.keys) ? entry.keys : [],
            secondary_keys: [],
            comment: entry.comment || "",
            content: entry.content || "",
            constant: false,
            selective: false,
            insertion_order: 100,
            enabled: true,
            position: atDepth ? "after_char" : "before_char",
            use_regex: true,
            extensions: {
                position: atDepth ? 4 : 0,
                ...(atDepth ? { depth: 3, role: 0 } : {}),
                probability: 100,
                useProbability: true,
                display_index: index
            }
        };
    });
}

export function buildCharacterCard(card, creator = "") {
    const now = Math.floor(Date.now() / 1000);
    const talkativeness = Number(card.talkativeness);

    return {
        spec: "chara_card_v3",
        spec_version: "3.0",
        data: {
            name: card.name || "",
            nickname: card.nickname || "",
            description: card.description || "",
            personality: card.personality || "",
            scenario: card.scenario || "",
            first_mes: card.first_mes || "",
            mes_example: card.mes_example || "",
            creator_notes: card.creator_notes || "",
            system_prompt: card.system_prompt || "",
            post_history_instructions:
                card.post_history_instructions || "",
            alternate_greetings:
                card.alternate_greetings || [],
            group_only_greetings:
                card.group_only_greetings || [],
            tags: card.tags || [],
            creator,
            character_version: "1.0.0",
            creation_date: now,
            modification_date: now,
            extensions: {
                talkativeness:
                    Number.isFinite(talkativeness)
                        ? Math.min(1, Math.max(0, talkativeness))
                        : 0.5,
                depth_prompt: {
                    prompt: card.depth_prompt || "",
                    depth: 4,
                    role: "system"
                }
            },
            character_book: {
                name:
                    card.character_book?.name ||
                    `${card.name || "Character"} Lore`,
                entries:
                    normalizedEntries(card.character_book)
            },
            assets: [{
                type: "icon",
                uri: "ccdefault:",
                name: "main",
                ext: "png"
            }]
        }
    };
}

export function buildCreatePayload(card, creator = "") {
    const v3 = buildCharacterCard(card, creator);
    const talkativeness = Number(card.talkativeness);

    return {
        ch_name: card.name,
        description: card.description || "",
        personality: card.personality || "",
        scenario: card.scenario || "",
        first_mes: card.first_mes || "",
        mes_example: card.mes_example || "",
        creator_notes: card.creator_notes || "",
        system_prompt: card.system_prompt || "",
        post_history_instructions:
            card.post_history_instructions || "",
        alternate_greetings:
            card.alternate_greetings || [],
        tags: card.tags || [],
        creator,
        character_version: "1.0.0",
        talkativeness:
            Number.isFinite(talkativeness)
                ? Math.min(1, Math.max(0, talkativeness))
                : 0.5,
        depth_prompt_prompt: card.depth_prompt || "",
        depth_prompt_depth: 4,
        depth_prompt_role: "system",
        json_data: JSON.stringify(v3)
    };
}
