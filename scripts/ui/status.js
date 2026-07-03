// scripts/ui/status.js

let ccmStatusTimer = null;


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
    message
) {

    showCCMStatus(
        `
        <div style="font-size:64px;color:#e74c3c;">
            ✖
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

    toast.innerHTML =
        `${icon} ${message}`;

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

