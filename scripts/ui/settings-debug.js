import {
    clearDebugEntries,
    createDebugReport,
    getDebugEntries,
    getDebugSettings
} from "../debug-logger.js";

export function bindDebugPanel(dialog) {
    const enabled = dialog.querySelector("#ccm-debug-enabled");
    const all = dialog.querySelector("#ccm-debug-all");
    const mirror = dialog.querySelector("#ccm-debug-console");
    const aiContent = dialog.querySelector("#ccm-debug-ai-content");
    const developerMode = dialog.querySelector("#ccm-debug-developer-mode");
    const developerTools = dialog.querySelector("#ccm-developer-tools");
    const maxEntries = dialog.querySelector("#ccm-debug-max-entries");
    const viewer = dialog.querySelector("#ccm-debug-log-viewer");
    const status = dialog.querySelector("#ccm-debug-action-status");

    const renderSettings = () => {
        const values = getDebugSettings();
        enabled.checked = values.enabled;
        all.checked = values.allCategories;
        mirror.checked = values.mirrorToConsole;
        aiContent.checked = values.includeAIContent;
        developerMode.checked = values.developerMode === true;
        developerTools.hidden = !developerMode.checked;
        maxEntries.value = values.maxEntries;
        dialog.querySelectorAll("[data-debug-category]").forEach(input => {
            input.checked = values.categories.includes(input.dataset.debugCategory);
            input.disabled = values.allCategories;
        });
    };

    const renderLog = () => {
        const entries = getDebugEntries();
        viewer.value = entries.length
            ? entries.map(entry => {
                const details = Object.keys(entry.details || {}).length
                    ? ` ${JSON.stringify(entry.details)}`
                    : "";
                return `${entry.time} [${entry.category}] ${entry.event}${details}`;
            }).join("\n")
            : "No local debug entries.";
    };

    const showStatus = message => {
        status.textContent = message;
        setTimeout(() => {
            if (status.isConnected) status.textContent = "";
        }, 1800);
    };

    all.addEventListener("change", () => {
        dialog.querySelectorAll("[data-debug-category]").forEach(input => {
            input.disabled = all.checked;
        });
    });
    developerMode.addEventListener("change", () => {
        developerTools.hidden = !developerMode.checked;
    });
    dialog.querySelector("#ccm-debug-refresh").addEventListener("click", renderLog);
    dialog.querySelector("#ccm-debug-clear").addEventListener("click", () => {
        if (!confirm("Clear all locally stored CCM debug entries?")) return;
        clearDebugEntries();
        renderLog();
        showStatus("Cleared.");
    });
    dialog.querySelector("#ccm-debug-copy").addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(createDebugReport());
            showStatus("Copied.");
        } catch {
            viewer.focus();
            viewer.select();
            showStatus("Press Ctrl+C to copy.");
        }
    });
    dialog.querySelector("#ccm-debug-download").addEventListener("click", () => {
        const url = URL.createObjectURL(new Blob(
            [createDebugReport()],
            { type: "application/json" }
        ));
        const link = document.createElement("a");
        link.href = url;
        link.download = `ccm-debug-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
        link.click();
        URL.revokeObjectURL(url);
        showStatus("Downloaded.");
    });

    renderSettings();
    renderLog();

    return {
        renderSettings,
        renderLog,
        getValues: () => ({
            enabled: enabled.checked,
            allCategories: all.checked,
            includeAIContent: aiContent.checked,
            developerMode: developerMode.checked,
            categories: [...dialog.querySelectorAll("[data-debug-category]:checked")]
                .map(input => input.dataset.debugCategory),
            mirrorToConsole: mirror.checked,
            maxEntries: Number(maxEntries.value) || 250
        })
    };
}
