// scripts/ui.js

// database.js
import {
    getAllCharacters,
    deleteCharacter
} from "./database.js";

// ui/editor.js
import {
    openEditor,
    saveCharacter
} from "./ui/editor.js";

//ui/state-actions.js
import {
    updateCharacterState,
    reExtractCharacter,
    updateCharacterKnowledge,
    changeCharacterImage,
    removeCharacterImage
} from "./ui/state-actions.js";

//ui/dashboard.js
import {
    renderCharacterDashboard as renderDashboard
} from "./ui/dashboard.js";

import {
    renderGroupDashboard as renderGroup
} from "./ui/group-dashboard.js";

import {
    createCharacterImagePrompt
} from "./ui/image-prompt.js";

import {
    openSettings
} from "./ui/settings.js";

import {
    openUsageStats
} from "./ui/usage.js";

import {
    getUsageStats
} from "./usage.js";

import {
    escapeHtml
} from "./ui/escape.js";

import {
    getContextCharacters
} from "./group-context.js";

import {
    openCharacterCreator
} from "./ui/character-creator.js";

function formatCharacterUsage(characterId) {

    const totals =
        getUsageStats(characterId)
            .lifetime;

    return `Tokens in: ${Number(totals.inputTokens || 0).toLocaleString()} / out: ${Number(totals.outputTokens || 0).toLocaleString()} - ${Number(totals.requests || 0).toLocaleString()} Req`;
}


export function initUI() {
    loadExtensionVersion();
    createLauncher();
    setupLauncherEvent();

    dashboardViewport.addEventListener(
        "change",
        switchDashboardMode
    );
}

let activeDashboardPopup = null;
let extensionVersion = "";
const dashboardViewport =
    window.matchMedia("(max-width: 1400px)");
const launcherPositionKey =
    "ccm-launcher-position-v1";

async function loadExtensionVersion() {
    try {
        const response = await fetch(
            new URL("../manifest.json", import.meta.url)
        );
        if (!response.ok) return;

        const manifest = await response.json();
        extensionVersion = String(manifest.version || "").trim();

        const label = document.getElementById("ccm-version");
        if (label) label.textContent = extensionVersion
            ? `v${extensionVersion}`
            : "";
    } catch (error) {
        console.warn("[CCM] Could not load extension version", error);
    }
}

function createLauncher() {
    const launcher = document.createElement("div");

    launcher.id = "ccm-launcher";
    launcher.innerHTML = "🧠";
    launcher.setAttribute("role", "button");
    launcher.setAttribute("tabindex", "0");
    launcher.setAttribute("aria-label", "Open Character Continuity Manager");

    document.body.appendChild(launcher);

    restoreLauncherPosition(launcher);
}

function createPanel() {
    const panel = document.createElement("div");

    panel.id = "ccm-panel";

    panel.innerHTML = `
    <div id="ccm-header">
        <span class="ccm-header-title">
            Character Continuity Manager
            <small id="ccm-version">${extensionVersion ? `v${escapeHtml(extensionVersion)}` : ""}</small>
        </span>

        <button id="ccm-close">✕</button>
    </div>

    <div id="ccm-body">
		<div class="ccm-main-actions">
			<button id="ccm-create-character">
				＋ Create Character(s)
			</button>

			<button id="ccm-open-settings">
				⚙ Settings
			</button>

			<button id="ccm-open-usage">
				Token Stats
			</button>
		</div>
		
		<div id="ccm-list-controls">
			<input
				id="ccm-search"
				placeholder="Search characters..."
			>

			<select id="ccm-sort">
				<option value="updated">Last Updated</option>
				<option value="name">Name</option>
				<option value="created">Created</option>
			</select>
		</div>
		
        <div id="ccm-character-list"></div>
    </div>
`;

    return panel;
}

export function renderCharacterList() {
    const container =
        document.getElementById(
            "ccm-character-list"
        );

    if (!container) return;

    document
        .getElementById("ccm-list-controls")
        ?.removeAttribute("hidden");

    container.innerHTML = "";
    delete container.dataset.ccmCharacterId;

    const context =
        SillyTavern.getContext();

    const currentGroupAvatars =
        new Set(
            context.groupId
                ? getContextCharacters(context)
                    .map(character => character.avatar)
                : []
        );


    const activeHeader =
        document.createElement("h4");


	let characters =
		getAllCharacters();

	const search =
		document
			.getElementById("ccm-search")
			?.value
			?.toLowerCase() || "";

	characters =
		characters.filter(
			c =>
				(c.name || "")
					.toLowerCase()
					.includes(search)
		);

	const sort =
		document
			.getElementById("ccm-sort")
			?.value;

	switch (sort) {

	case "name":

		characters.sort(
			(a, b) =>
				(a.name || "").localeCompare(b.name || "")
		);

		break;

	case "created":

		characters.sort(
			(a, b) =>
				b.createdAt - a.createdAt
		);

		break;

	default:

		characters.sort(
			(a, b) =>
				b.updatedAt - a.updatedAt
		);
	}

	const activeChars =
		characters.filter(
			x => x.status !== "archived"
		);

	const archivedChars =
		characters.filter(
			x => x.status === "archived"
		);


    activeHeader.textContent =
        "Active";

    container.appendChild(
        activeHeader
    );

    activeChars.forEach(char => {

        const row =
            document.createElement("div");

        row.className =
            "ccm-character-row";

        row.innerHTML = `
		<div style="
			display:flex;
			justify-content:space-between;
			align-items:center;
		">

			<div>
				<strong>${escapeHtml(char.name)}</strong>
				${currentGroupAvatars.has(char.avatar)
                    ? `<span class="ccm-group-member-badge">Current group</span>`
                    : ""}
				<br>
				<small>
					${escapeHtml(char.facts?.age?.value || "?")}
					•
					${escapeHtml(char.facts?.gender?.value || "?")}
				</small>
				<br>
				<small class="ccm-character-token-summary">
					${formatCharacterUsage(char.id)}
				</small>
			</div>

			<button class="ccm-delete-row">
				🗑️
			</button>

		</div>
		`;

        row.addEventListener(
			"click",
			() => renderCharacterDashboard(char.id)
		);

		const deleteBtn =
			row.querySelector(
				".ccm-delete-row"
			);

		deleteBtn.addEventListener(
			"click",
			event => {

				event.stopPropagation();

				if (
					!confirm(
						`Delete ${char.name}?`
					)
				) {
					return;
				}

				deleteCharacter(
					char.id
				);

				renderCharacterList();
			}
		);

        container.appendChild(row);
    });

    const hr =
        document.createElement("hr");

    container.appendChild(hr);

    const archivedHeader =
        document.createElement("h4");

    archivedHeader.textContent =
        "Archived";

    container.appendChild(
        archivedHeader
    );

    archivedChars.forEach(char => {

        const row =
            document.createElement("div");

        row.className =
            "ccm-character-row";

		row.innerHTML = `
			<div style="
				display:flex;
				justify-content:space-between;
				align-items:center;
			">

				<div>
					<strong>${escapeHtml(char.name)}</strong>
					${currentGroupAvatars.has(char.avatar)
                        ? `<span class="ccm-group-member-badge">Current group</span>`
                        : ""}
					<br>
					<small>Archived</small>
					<br>
					<small class="ccm-character-token-summary">
						${formatCharacterUsage(char.id)}
					</small>
				</div>

				<button class="ccm-delete-row">
					🗑️
				</button>

			</div>
			`;

        row.addEventListener(
			"click",
			() => renderCharacterDashboard(char.id)
		);

		const deleteBtn =
			row.querySelector(
				".ccm-delete-row"
			);

		deleteBtn.addEventListener(
			"click",
			event => {

				event.stopPropagation();

				if (
					!confirm(
						`Delete ${char.name}?`
					)
				) {
					return;
				}

				deleteCharacter(
					char.id
				);

				renderCharacterList();
			}
		);

        container.appendChild(row);
    });
}

function setupLauncherEvent() {
    const launcher =
        document.getElementById(
            "ccm-launcher"
        );

    makeDraggable(
        launcher,
        launcher,
        toggleDashboard,
        saveLauncherPosition,
        followLauncherWithDashboard
    );
}

function toggleDashboard() {

    const panel =
        document.getElementById(
            "ccm-panel"
        );

    if (panel) {

        if (activeDashboardPopup) {
            activeDashboardPopup
                .completeCancelled();
        } else {
            panel.remove();
        }

        return;
    }

    if (dashboardViewport.matches) {
        openDashboardPopup();
    } else {
        openFloatingDashboard();
    }
}

export function openDashboard() {

    if (
        document.getElementById(
            "ccm-panel"
        )
    ) {
        return;
    }

    if (dashboardViewport.matches) {
        openDashboardPopup();
    } else {
        openFloatingDashboard();
    }
}

function openFloatingDashboard() {

    const panel =
        createPanel();

    panel.classList.add(
        "ccm-panel-floating"
    );

    document.body.appendChild(panel);
    positionDashboardNearLauncher(panel);
    setupPanelEvents();

    makeDraggable(
        panel,
        panel.querySelector("#ccm-header")
    );

    renderInitialDashboard(
        SillyTavern.getContext()
    );
}

function openDashboardPopup() {

    const ctx =
        SillyTavern.getContext();

    const {
        Popup,
        POPUP_TYPE
    } = ctx;

    const panel =
        createPanel();

    activeDashboardPopup =
        new Popup(
            panel,
            POPUP_TYPE.TEXT,
            "",
            {
                okButton: false,
                allowVerticalScrolling: false,
                animation: "fast",
                onClose: () => {
                    activeDashboardPopup = null;
                }
            }
        );

    activeDashboardPopup.show();
    setupPanelEvents();

    renderInitialDashboard(ctx);
}

function renderInitialDashboard(ctx) {

    if (ctx?.groupId) {
        renderGroupDashboard(
            ctx.groupId
        );
        return;
    }

    const stCharacter =
        ctx?.characters?.[
            ctx.characterId
        ];

    const characterName =
        stCharacter?.name;

    const ccmCharacter =
        characterName
            ? getAllCharacters()
                .find(
                    x =>
                        x.name === characterName
                )
            : null;

    if (ccmCharacter) {
        renderCharacterDashboard(
            ccmCharacter.id
        );
    } else {
        renderCharacterList();
    }
}

async function switchDashboardMode(event) {

    if (!event.matches) {
        restoreLauncherPosition(
            document.getElementById(
                "ccm-launcher"
            )
        );
    }

    const panel =
        document.getElementById(
            "ccm-panel"
        );

    if (!panel) return;

    if (event.matches && !activeDashboardPopup) {
        panel.remove();
        openDashboardPopup();
        return;
    }

    if (!event.matches && activeDashboardPopup) {
        await activeDashboardPopup
            .completeCancelled();
        openFloatingDashboard();
    }
}

function makeDraggable(
    element,
    handle,
    onTap = null,
    onDragEnd = null,
    onDrag = null
) {

    let startX = 0;
    let startY = 0;
    let originLeft = 0;
    let originTop = 0;
    let dragged = false;
    let lastPointerTapAt = 0;

    handle.addEventListener(
        "pointerdown",
        event => {

            if (
                event.button !== 0 ||
                event.target.closest(
                    "button, input, select, textarea"
                )
            ) {
                return;
            }

            const rect =
                element.getBoundingClientRect();

            startX = event.clientX;
            startY = event.clientY;
            originLeft = rect.left;
            originTop = rect.top;
            dragged = false;

            handle.setPointerCapture(
                event.pointerId
            );
        }
    );

    handle.addEventListener(
        "pointermove",
        event => {

            if (
                !handle.hasPointerCapture(
                    event.pointerId
                )
            ) {
                return;
            }

            const deltaX =
                event.clientX - startX;

            const deltaY =
                event.clientY - startY;

            if (
                Math.abs(deltaX) > 4 ||
                Math.abs(deltaY) > 4
            ) {
                dragged = true;
            }

            const rect =
                element.getBoundingClientRect();

            const left =
                Math.max(
                    0,
                    Math.min(
                        originLeft + deltaX,
                        window.innerWidth - rect.width
                    )
                );

            const top =
                Math.max(
                    0,
                    Math.min(
                        originTop + deltaY,
                        window.innerHeight - rect.height
                    )
                );

            element.style.left = `${left}px`;
            element.style.top = `${top}px`;
            element.style.right = "auto";
            element.style.bottom = "auto";

            if (onDrag) {
                onDrag(element);
            }
        }
    );

    handle.addEventListener(
        "pointerup",
        event => {

            if (
                !handle.hasPointerCapture(
                    event.pointerId
                )
            ) {
                return;
            }

            handle.releasePointerCapture(
                event.pointerId
            );

            if (dragged && onDragEnd) {
                onDragEnd(element);
            } else if (!dragged && onTap) {
                lastPointerTapAt = Date.now();
                onTap();
            }
        }
    );

    if (onTap) {
        handle.addEventListener("click", event => {
            if (
                Date.now() - lastPointerTapAt < 500 ||
                event.target.closest("button, input, select, textarea")
            ) {
                return;
            }
            onTap();
        });

        handle.addEventListener("keydown", event => {
            if (!["Enter", " "].includes(event.key)) return;
            event.preventDefault();
            onTap();
        });
    }
}

function saveLauncherPosition(launcher) {

    if (dashboardViewport.matches) return;

    const rect =
        launcher.getBoundingClientRect();

    try {
        localStorage.setItem(
            launcherPositionKey,
            JSON.stringify({
                left: rect.left,
                top: rect.top
            })
        );
    } catch (error) {
        console.warn(
            "[CCM] Could not save launcher position",
            error
        );
    }
}

function restoreLauncherPosition(launcher) {

    if (
        !launcher ||
        dashboardViewport.matches
    ) {
        return;
    }

    try {
        const saved =
            JSON.parse(
                localStorage.getItem(
                    launcherPositionKey
                ) || "null"
            );

        if (
            !Number.isFinite(saved?.left) ||
            !Number.isFinite(saved?.top)
        ) {
            return;
        }

        const rect =
            launcher.getBoundingClientRect();

        const left =
            Math.max(
                0,
                Math.min(
                    saved.left,
                    window.innerWidth - rect.width
                )
            );

        const top =
            Math.max(
                0,
                Math.min(
                    saved.top,
                    window.innerHeight - rect.height
                )
            );

        launcher.style.left = `${left}px`;
        launcher.style.top = `${top}px`;
        launcher.style.right = "auto";
        launcher.style.bottom = "auto";
    } catch (error) {
        console.warn(
            "[CCM] Could not restore launcher position",
            error
        );
    }
}

function positionDashboardNearLauncher(panel) {

    const launcher =
        document.getElementById(
            "ccm-launcher"
        );

    if (!launcher) return;

    const launcherRect =
        launcher.getBoundingClientRect();

    const panelRect =
        panel.getBoundingClientRect();

    const gap = 8;

    const left =
        Math.max(
            0,
            Math.min(
                launcherRect.right - panelRect.width,
                window.innerWidth - panelRect.width
            )
        );

    const spaceBelow =
        window.innerHeight -
        launcherRect.bottom -
        gap;

    const top =
        spaceBelow >= panelRect.height
            ? launcherRect.bottom + gap
            : Math.max(
                0,
                launcherRect.top - panelRect.height - gap
            );

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
}

function followLauncherWithDashboard() {

    const panel =
        document.querySelector(
            "#ccm-panel.ccm-panel-floating"
        );

    if (panel) {
        positionDashboardNearLauncher(panel);
    }
}

function setupPanelEvents() {
    document
        .getElementById("ccm-close")
        .addEventListener("click", () => {

            if (activeDashboardPopup) {
                activeDashboardPopup
                    .completeCancelled();
            } else {
                document.getElementById(
                    "ccm-panel"
                )?.remove();
            }
        });
	
	document
		.getElementById("ccm-search")
		?.addEventListener(
			"input",
			renderCharacterList
		);

	document
		.getElementById("ccm-sort")
		?.addEventListener(
			"change",
			renderCharacterList
		);

    document
        .getElementById("ccm-create-character")
        .addEventListener(
            "click",
            () => openCharacterCreator(
                renderCharacterList
            )
        );

    document
        .getElementById("ccm-open-settings")
        .addEventListener(
            "click",
            openSettings
        );

    document
        .getElementById("ccm-open-usage")
        .addEventListener(
            "click",
            () => openUsageStats()
        );
}


export function renderCharacterDashboard(
    id,
    groupId = ""
) {

    renderDashboard(
        id,
        {
            renderCharacterDashboard,
            renderGroupDashboard,
            renderCharacterList,
            openEditor,
            reExtractCharacter,
            updateCharacterState,
            updateCharacterKnowledge,
			createCharacterImagePrompt,
			openUsageStats,
			changeCharacterImage,
			removeCharacterImage
		},
        groupId
    );
}

export function renderGroupDashboard(groupId) {
    renderGroup(
        groupId,
        {
            renderCharacterDashboard,
            renderGroupDashboard,
            renderCharacterList
        }
    );
}
