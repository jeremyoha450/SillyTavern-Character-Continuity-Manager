import {
    clearTrainingData,
    createTrainingDataExport,
    getTrainingDataCount,
    getTrainingDataSettings
} from "../training-data.js";

export function bindTrainingDataPanel(dialog) {
    const enabled = dialog.querySelector("#ccm-training-enabled");
    const maxRecords = dialog.querySelector("#ccm-training-max-records");
    const count = dialog.querySelector("#ccm-training-count");
    const status = dialog.querySelector("#ccm-training-action-status");

    const showStatus = message => {
        status.textContent = message;
        setTimeout(() => {
            if (status.isConnected) status.textContent = "";
        }, 1800);
    };

    const renderSettings = () => {
        const settings = getTrainingDataSettings();
        enabled.checked = settings.enabled;
        maxRecords.value = settings.maxRecords;
    };

    const renderCount = () => {
        count.textContent = String(getTrainingDataCount());
    };

    dialog.querySelector("#ccm-training-refresh")?.addEventListener("click", () => {
        renderSettings();
        renderCount();
        showStatus("Refreshed.");
    });

    dialog.querySelector("#ccm-training-clear")?.addEventListener("click", () => {
        if (!confirm("Clear all locally stored CCM training data records? This cannot be undone.")) return;
        clearTrainingData();
        renderCount();
        showStatus("Cleared.");
    });

    dialog.querySelector("#ccm-training-export")?.addEventListener("click", () => {
        const blob = new Blob(
            [createTrainingDataExport()],
            { type: "application/json" }
        );
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `ccm-training-data-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
        link.click();
        URL.revokeObjectURL(url);
        showStatus("Exported.");
    });

    renderSettings();
    renderCount();

    return {
        renderSettings,
        renderCount,
        getValues: () => ({
            enabled: enabled.checked,
            maxRecords: Number(maxRecords.value) || 100
        })
    };
}
