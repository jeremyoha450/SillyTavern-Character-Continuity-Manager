export function getSillyTavernModelInfo() {
    const context = SillyTavern.getContext();
    let model = "";

    try {
        model = context?.getChatCompletionModel?.() || "";
    } catch {
        model = "";
    }

    if (!model) {
        const settings = context?.textCompletionSettings || {};
        model = settings.model || settings.custom_model || settings.server_type || "";
    }

    const contextCandidates = [
        context?.maxContext,
        context?.max_context,
        context?.powerUser?.max_context,
        context?.textCompletionSettings?.max_context
    ];
    const contextTokens = contextCandidates
        .map(Number)
        .find(value => Number.isFinite(value) && value > 0) || null;

    return {
        provider: context?.mainApi || "SillyTavern",
        model: String(model || "Active model"),
        contextTokens
    };
}

export async function executeWithSillyTavern(task, input) {
    const context = SillyTavern.getContext();
    if (typeof context?.generateRaw !== "function") {
        throw new Error("This SillyTavern version does not expose raw AI generation.");
    }

    const messages = task.buildMessages(input);
    const systemPrompt = messages
        .filter(message => message.role === "system")
        .map(message => String(message.content || ""))
        .join("\n\n");
    const prompt = messages
        .filter(message => message.role !== "system")
        .map(message => ({
            role: message.role === "assistant" ? "assistant" : "user",
            content: String(message.content || "")
        }));

    const response = await context.generateRaw({
        systemPrompt,
        prompt,
        responseLength:
            Number.isFinite(Number(task.maxTokens)) && Number(task.maxTokens) > 0
                ? Number(task.maxTokens)
                : undefined
    });

    const text = typeof response === "string"
        ? response
        : response?.text || response?.content || "";

    if (!text) {
        throw new Error("SillyTavern's active model returned no text.");
    }

    let parsedResult;
    try {
        parsedResult = task.parse(text, input);
    } catch (error) {
        error.debugRawOutput = text;
        throw error;
    }

    const parsedResponse = {
        result: parsedResult,
        model: getSillyTavernModelInfo().model
    };
    Object.defineProperty(parsedResponse, "debugRawOutput", { value: text });
    return parsedResponse;
}
