// scripts/ui/status.js

import {
    createSafeErrorReport,
    getSafeErrorMessage
} from "../provider-error.js";

let ccmStatusTimer = null;

function escapeHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}


export function showCCMStatus(
    message
) {

    if (ccmStatusTimer) {

        clearTimeout(
            ccmStatusTimer
        );

        ccmStatusTimer = null;
    }

    let box =
        document.getElementById(
            "ccm-status-popup"
        );

    if (!box) {

        box =
            document.createElement("div");

        box.id =
            "ccm-status-popup";

        box.style.cssText = `
            position: fixed;
            inset: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            background: rgba(0,0,0,.45);
            z-index: 2147483647;
        `;

        (SillyTavern.getContext()
            ?.Popup?.util?.getTopmostModalLayer?.()
            || document.body).appendChild(
            box
        );
    }

    box.innerHTML = `
        <div style="
            background:#222;
            color:white;
            padding:30px;
            border-radius:12px;
            min-width:350px;
            text-align:center;
            box-shadow:0 0 30px rgba(0,0,0,.6);
            font-size:18px;
        ">
            ${message}
        </div>
    `;
}


export function hideCCMStatus(
    delay = 0
) {

    if (ccmStatusTimer) {
        clearTimeout(
            ccmStatusTimer
        );
    }

    ccmStatusTimer =
        setTimeout(
            () => {

                document
                    .getElementById(
                        "ccm-status-popup"
                    )
                    ?.remove();

                ccmStatusTimer = null;

            },
            delay
        );
}


export function showCCMSuccess(
    message
) {

    showCCMStatus(
        `
        <div style="font-size:64px;color:#2ecc71;">
            ✔
        </div>

        <div style="font-size:22px;font-weight:bold;">
            ${message}
        </div>

        <br>

        <button id="ccm-status-ok">
            OK
        </button>
        `
    );

    document
        .getElementById(
            "ccm-status-ok"
        )
        .addEventListener(
            "click",
            () => hideCCMStatus()
        );

    hideCCMStatus(
        5000
    );
}

export function showCCMError(
    message,
    error = null,
    context = "CCM operation"
) {

    const displayMessage = error
        ? getSafeErrorMessage(error, message)
        : message;
    const canCopy = Boolean(error);

    showCCMStatus(
        `
        <div style="font-size:64px;color:#e74c3c;">
            ✖
        </div>

        <div style="font-size:22px;font-weight:bold;">
            ${escapeHtml(displayMessage)}
        </div>

        <br>

        ${canCopy ? '<button id="ccm-status-copy-error" type="button">Copy Error Details</button>' : ""}
        <button id="ccm-status-ok">
            OK
        </button>
        `
    );

    document
        .getElementById(
            "ccm-status-ok"
        )
        .addEventListener(
            "click",
            () => hideCCMStatus()
        );

    if (canCopy) {
        document
            .getElementById("ccm-status-copy-error")
            ?.addEventListener("click", async event => {
                const button = event.currentTarget;
                try {
                    await navigator.clipboard.writeText(
                        createSafeErrorReport(error, context)
                    );
                    button.textContent = "Copied";
                } catch {
                    button.textContent = "Copy unavailable";
                }
            });
    }
}

export function showCCMToast(
    message,
    type = "info"
) {

    let toast =
        document.getElementById(
            "ccm-toast"
        );

    if (!toast) {

        toast =
            document.createElement("div");

        toast.id =
            "ccm-toast";

        toast.style.cssText = `
            position: fixed;
            top: 15px;
            right: 15px;
            z-index: 2147483647;
            background: #222;
            color: white;
            padding: 12px 16px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,.5);
            font-size: 14px;
            max-width: 320px;
            opacity: 0;
            transition: opacity .2s ease;
        `;

        (SillyTavern.getContext()
            ?.Popup?.util?.getTopmostModalLayer?.()
            || document.body).appendChild(
            toast
        );
    }

    const icon =
        type === "success"
            ? "✅"
            : type === "error"
                ? "❌"
                : "🧠";

    renderToastContent(toast, icon, message);

    requestAnimationFrame(
        () => {
            toast.style.opacity = "1";
        }
    );

    setTimeout(
        () => {
            toast.style.opacity = "0";

            setTimeout(
                () => toast.remove(),
                250
            );
        },
        3000
    );
}

// Toast messages can include imported card names and provider-derived text.
// Keep the icon as presentation while treating every message as literal text.
export function renderToastContent(toast, icon, message) {
    const doc = toast.ownerDocument || document;
    const iconNode = doc.createElement("span");
    const messageNode = doc.createElement("span");
    iconNode.setAttribute("aria-hidden", "true");
    iconNode.textContent = String(icon || "");
    messageNode.textContent = ` ${String(message ?? "")}`;
    toast.replaceChildren(iconNode, messageNode);
}

