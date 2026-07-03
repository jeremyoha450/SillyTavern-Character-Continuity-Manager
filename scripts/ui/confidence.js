// scripts/ui/confidence.js

export function confidenceStyle(
    confidence
) {

    if (confidence >= 75) {
        return `
            border:2px solid #2ecc71;
            background:rgba(
                46,
                204,
                113,
                0.08
            );
        `;
    }

    if (confidence >= 40) {
        return `
            border:2px solid #f1c40f;
            background:rgba(
                241,
                196,
                15,
                0.08
            );
        `;
    }

    return `
        border:2px solid #e74c3c;
        background:rgba(
            231,
            76,
            60,
            0.08
        );
    `;
}

export function renderConfidence(
    confidence = 0
) {

    if (confidence >= 75) {
        return `🟢${confidence}%`;
    }

    if (confidence >= 40) {
        return `🟡${confidence}%`;
    }

    return `🔴${confidence}%`;
}
