// ui.js

import {
    createCharacter,
    addCharacter,
    getAllCharacters,
    getCharacter,
    updateCharacter,
    deleteCharacter,
    archiveCharacter,
    restoreCharacter
} from "./database.js";

export function initUI() {
    createPanel();
    createLauncher();

    renderCharacterList();

    setupEvents();
}

function createLauncher() {
    const launcher = document.createElement("div");

    launcher.id = "ccm-launcher";
    launcher.innerHTML = "🧠";

    document.body.appendChild(launcher);
}


function createPanel() {
    const panel = document.createElement("div");

    panel.id = "ccm-panel";

    panel.innerHTML = `
    <div id="ccm-header">
        <span>Character Continuity Manager</span>

        <button id="ccm-close">✕</button>
    </div>

    <div id="ccm-body">
        <button id="ccm-add-character">
            + New Character
        </button>

        <div id="ccm-character-list"></div>
    </div>
`;

    document.body.appendChild(panel);
}

export function renderCharacterList() {
    const container =
        document.getElementById(
            "ccm-character-list"
        );

    if (!container) return;

    container.innerHTML = "";

    const chars =
        getAllCharacters();

    const activeChars =
        chars.filter(
            x => x.status !== "archived"
        );

    const archivedChars =
        chars.filter(
            x => x.status === "archived"
        );

    const activeHeader =
        document.createElement("h4");

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
				<strong>${char.name}</strong>
				<br>
				<small>
					${char.facts?.age?.value || "?"}
					•
					${char.facts?.gender?.value || "?"}
				</small>
			</div>

			<button class="ccm-delete-row">
				🗑️
			</button>

		</div>
		`;

        row.addEventListener(
			"click",
			() => openEditor(char.id)
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
					<strong>${char.name}</strong>
					<br>
					<small>Archived</small>
				</div>

				<button class="ccm-delete-row">
					🗑️
				</button>

			</div>
			`;

        row.addEventListener(
			"click",
			() => openEditor(char.id)
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

function setupEvents() {
    document
       .getElementById("ccm-launcher")
       .addEventListener("pointerup", () => {
   
           const panel =
               document.getElementById("ccm-panel");

           const hidden =
               getComputedStyle(panel).display === "none";

           panel.style.display =
               hidden ? "block" : "none";
        });


    document
        .getElementById("ccm-close")
        .addEventListener("click", () => {
            document.getElementById(
                "ccm-panel"
            ).style.display =
                "none";
        });

    document
        .getElementById(
            "ccm-add-character"
        )
        .addEventListener(
            "click",
            () => {
                const name =
                    prompt(
                        "Character Name"
                    );

                if (!name) return;

                addCharacter(
                    createCharacter(name)
                );

                renderCharacterList();
            }
        );
}

function openEditor(id) {
    const existing =
        document.getElementById(
            "ccm-editor"
        );

    if (existing) {
        existing.remove();
    }
    const char =
        getCharacter(id);

    if (!char) return;

    const editor =
        document.createElement("div");

    editor.id = "ccm-editor";

    editor.innerHTML = `
<div id="ccm-editor-content">

    <div style="
    display:flex;
    justify-content:space-between;
    align-items:center;
">
    <h3>${char.name}</h3>
    <button id="ccm-editor-close">✕</button>
    </div>
	<hr>
	<h4>AI Extracted Facts</h4>
	<pre id="ccm-facts">
	${JSON.stringify(
		char.facts || {},
		null,
		2
	)}
	</pre>

<p style="opacity:.7;font-size:.9em;">
Leave blank or enter "None" if not applicable.
</p>

    <label>Name</label>
    <input id="ccm-name"
        value="${char.name}">

    <label>Gender</label>
    <input id="ccm-gender"
        		value="${
		char.facts?.gender?.value ||
		""
	}">
	
	<label style="
		display:flex;
		align-items:center;
		gap:6px;
		">
		<input
			type="checkbox"
			style="
				width:10px;
				margin:0;
			"
			id="ccm-lock-gender"
			${
				char.locks?.gender
					? "checked"
					: ""
			}
		>
		Lock Gender
	</label>

    <label>Age</label>
	<input id="ccm-age"
				value="${
		char.facts?.age?.value ||
		""
	}">
	
	<label style="
		display:flex;
		align-items:center;
		gap:6px;
		">
		<input
			type="checkbox"
			style="
				width:10px;
				margin:0;
			"
			id="ccm-lock-age"
			${
				char.locks?.age
					? "checked"
					: ""
			}
		>
		Lock Age
	</label>
	

    <label>Height</label>
    <input id="ccm-height"
		value="${
		char.facts?.height?.value ||
		""
	}">

	<label style="
		display:flex;
		align-items:center;
		gap:6px;
		">
		<input
			type="checkbox"
			style="
				width:10px;
				margin:0;
			"
			id="ccm-lock-height"
			${
				char.locks?.height
					? "checked"
					: ""
			}
		>
		Lock Height
	</label>

	<label>Species</label>
	<input
		id="ccm-species"
		value="${
			char.facts?.species?.value ||
			""
		}"
	>

	<label style="
		display:flex;
		align-items:center;
		gap:6px;
		">
		<input
			type="checkbox"
			style="
				width:10px;
				margin:0;
			"
			id="ccm-lock-species"
			${
				char.locks?.species
					? "checked"
					: ""
			}
		>
		Lock Species
	</label>


	<label>Skin Color</label>
	<input id="ccm-skin"
		value="${char.appearance?.skin || ""}">

	<label>Body Type</label>
	<input id="ccm-body-type"
				value="${
		char.facts?.bodyType?.value ||
		""
	}">
	
	<label style="
		display:flex;
		align-items:center;
		gap:6px;
		">
		<input
			type="checkbox"
			style="
				width:10px;
				margin:0;
			"
			id="ccm-lock-bodyType"
			${
				char.locks?.bodyType
					? "checked"
					: ""
			}
		>
		Lock Body Type
	</label>

	<label>Breast Size</label>
	<input id="ccm-breast-size"
		value="${char.appearance?.breastSize || ""}">

	<label>Butt Size</label>
	<input id="ccm-butt-size"
		value="${char.appearance?.buttSize || ""}">
     <label>Relationship</label>
     <input id="ccm-relationship"
         value="${char.relationships?.user?.status || ""}">

    <hr>

    <label>Hair Color</label>
    <input id="ccm-hair-color"
        value="${char.appearance?.hair?.color || ""}">

    <label>Hair Style</label>
    <input id="ccm-hair-style"
        value="${char.appearance?.hair?.style || ""}">

	<label>Hair Length</label>
	<input id="ccm-hair-length"
		value="${char.appearance?.hair?.length || ""}">

    <label>Eye Color</label>
    <input
		id="ccm-eye-color"
		value="${
			char.appearance?.eyes?.color ||
			char.facts?.eyeColor?.value ||
			""
		}"
	>

    <hr>

    <label>Upper Clothing</label>
    <input id="ccm-upper"
        value="${char.clothing?.upper || ""}">

	<label>Outerwear</label>
	<input id="ccm-outerwear"
		value="${char.clothing?.outerwear || ""}">

    <label>Lower Clothing</label>
    <input id="ccm-lower"
        value="${char.clothing?.lower || ""}">

    <label>Footwear</label>
    <input id="ccm-footwear"
        value="${char.clothing?.footwear || ""}">

    <label>Underwear Top</label>
    <input id="ccm-underwear-top"
        value="${char.clothing?.underwear?.top || ""}">

    <label>Underwear Bottom</label>
    <input id="ccm-underwear-bottom"
        value="${char.clothing?.underwear?.bottom || ""}">

    <hr>

    <label>Location</label>
    <input id="ccm-location"
        value="${char.location?.place || ""}">

	<label>Area</label>
	<input id="ccm-area"
		value="${char.location?.area || ""}">

    <label>Position</label>
    <input id="ccm-position"
        value="${char.position?.posture || ""}">

	<label>Position Detail</label>
	<input id="ccm-position-detail"
		value="${char.position?.detail || ""}">

    <label>Mood</label>
    <input id="ccm-mood"
        value="${char.mood?.primary || ""}">

	<label>Mood Intensity</label>
	<input id="ccm-mood-intensity"
		value="${char.mood?.intensity || ""}">

    <label>Accessories</label>
    <input id="ccm-accessories"
        value="${(char.accessories || []).join(", ")}">
		
	<label>Inventory</label>
	<input id="ccm-inventory"
		value="${(char.inventory || []).join(", ")}">

	<hr>

	<label>Penis (Average, Large, Small, Circumcised, Uncircumcised)</label>
	<input id="ccm-penis"
		value="${char.anatomy?.penis || ""}">

	<label>Penis State (Soft, Semi-Erect, Erect)</label>
	<input id="ccm-penis-state"
		value="${char.anatomy?.penisState || ""}">

	<label>Pussy (Shaved, Trimmed, Natural)</label>
	<input id="ccm-pussy"
		value="${char.anatomy?.pussy || ""}">

	<label>Pussy State (Dry, Moist, Wet)</label>
	<input id="ccm-pussy-state"
		value="${char.anatomy?.pussyState || ""}">

	<hr>

	<label>Condition</label>
	<input id="ccm-condition"
		value="${char.statusInfo?.condition || ""}">

	<label>Injuries</label>
	<input id="ccm-injuries"
		value="${char.statusInfo?.injuries || ""}">

	<label>Notes</label>
	<input id="ccm-notes"
		value="${char.statusInfo?.notes || ""}">
		
    <label></label>
    <button id="ccm-delete-character">
        Delete Character
    </button>
    ${
    char.status === "archived"
    ?
    `
    <button id="ccm-restore-character">
        Restore Character
    </button>
    `
    :
    `
    <button id="ccm-archive-character">
        Archive Character
    </button>
    `
    }
    <button id="ccm-save-character">
        Save
    </button>

</div>
`;

    document.body.appendChild(
        editor
    );

    document
        .getElementById(
            "ccm-save-character"
        )
        .addEventListener(
            "click",
            () => saveCharacter(id)
        );
   document
    .getElementById(
        "ccm-editor-close"
    )
    .addEventListener(
        "click",
        () => {
            document
                .getElementById(
                    "ccm-editor"
                )
                .remove();
        }
    );
    document
    .getElementById(
        "ccm-delete-character"
    )
    .addEventListener(
        "click",
        () => {
            if (
                !confirm(
                    "Delete character?"
                )
            ) return;

            deleteCharacter(id);

            renderCharacterList();

            document
                .getElementById(
                    "ccm-editor"
                )
                .remove();
        }
    );
    const archiveBtn =
        document.getElementById(
           "ccm-archive-character"
        );
    if (archiveBtn) {
        archiveBtn.addEventListener(
            "click",
            () => {

                archiveCharacter(id);

                renderCharacterList();

                document
                   .getElementById(
                        "ccm-editor"
                    )
                    .remove();
            }
        );
    }
    const restoreBtn =
    document.getElementById(
        "ccm-restore-character"
    );

    if (restoreBtn) {

    restoreBtn.addEventListener(
        "click",
        () => {

            restoreCharacter(id);

            renderCharacterList();

            document
                .getElementById(
                    "ccm-editor"
                )
                .remove();
        }
    );
}
}

function saveCharacter(id) {
    const char = getCharacter(id);

			const speciesLocked =
				document.getElementById(
					"ccm-lock-species"
				).checked;
			
			const ageLocked =
				document.getElementById(
					"ccm-lock-age"
				).checked;
				
			const genderLocked =
				document.getElementById(
					"ccm-lock-gender"
				).checked;
				
			const heightLocked =
				document.getElementById(
					"ccm-lock-height"
				).checked;
				
			const bodyTypeLocked =
				document.getElementById(
					"ccm-lock-bodyType"
				).checked;

			updateCharacter(id, {
				name: document.getElementById("ccm-name").value,
				locks: { ...char.locks, species: speciesLocked, age: ageLocked, gender: genderLocked, height: heightLocked, bodyType: bodyTypeLocked},
				facts: {
					...char.facts,

					gender: {
						value: document.getElementById("ccm-gender").value,
						confidence:
							char.facts?.gender?.confidence || 0
					},

					age: {
						value: document.getElementById("ccm-age").value,
						confidence:
							char.facts?.age?.confidence || 0
					},

					species: {
						value: document.getElementById("ccm-species").value,
						confidence:
							char.facts?.species?.confidence || 0
					},

					height: {
						value: document.getElementById("ccm-height").value,
						confidence:
							char.facts?.height?.confidence || 0
					},

					bodyType: {
						value: document.getElementById("ccm-body-type").value,
						confidence:
							char.facts?.bodyType?.confidence || 0
					}
				},
				appearance: {
			...char.appearance,

			skin: document.getElementById("ccm-skin").value,
			breastSize: document.getElementById("ccm-breast-size").value,
			buttSize: document.getElementById("ccm-butt-size").value,

			hair: {
				color: document.getElementById("ccm-hair-color").value,
				style: document.getElementById("ccm-hair-style").value,
				length: document.getElementById("ccm-hair-length").value
			},

			eyes: {
				color: document.getElementById("ccm-eye-color").value
			}
		},

		relationships: {
			user: {
				status:
					document.getElementById(
						"ccm-relationship"
					).value
			}
		},

		clothing: {
			upper: document.getElementById("ccm-upper").value,
			lower: document.getElementById("ccm-lower").value,
			outerwear: document.getElementById("ccm-outerwear").value,

			footwear: document.getElementById("ccm-footwear").value,

			underwear: {
				top: document.getElementById("ccm-underwear-top").value,
				bottom: document.getElementById("ccm-underwear-bottom").value
			}
		},

		location: {
			place: document.getElementById("ccm-location").value,
			area: document.getElementById("ccm-area").value
		},

		position: {
			posture: document.getElementById("ccm-position").value,
			detail: document.getElementById("ccm-position-detail").value
		},

		mood: {
			primary: document.getElementById("ccm-mood").value,
			intensity: document.getElementById("ccm-mood-intensity").value
		},

		anatomy: {
			penis: document.getElementById("ccm-penis").value,
			penisState: document.getElementById("ccm-penis-state").value,

			pussy: document.getElementById("ccm-pussy").value,
			pussyState: document.getElementById("ccm-pussy-state").value
		},

		statusInfo: {
			condition: document.getElementById("ccm-condition").value,
			injuries: document.getElementById("ccm-injuries").value,
			notes: document.getElementById("ccm-notes").value
		},
		
        accessories:
            document
                .getElementById("ccm-accessories")
                .value
                .split(",")
                .map(x => x.trim())
                .filter(Boolean),
		inventory:
			document
				.getElementById("ccm-inventory")
				.value
				.split(",")
				.map(x => x.trim())
				.filter(Boolean)
    });


    renderCharacterList();

	console.log(
		"[CCM] Character Updated",
		getCharacter(id)
	);

    document.getElementById("ccm-editor").remove();
}
