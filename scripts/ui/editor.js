// scripts/ui/editor.js

import {
    getScopedCharacter,
    updateScopedCharacter
} from "../database.js";

import {
    confidenceStyle
} from "./confidence.js";

import {
    escapeHtml
} from "./escape.js";
import {
    copyEditorCharacterDetails,
    getEditorCharacterUpdates
} from "./editor-fields.js";

export {
    copyEditorCharacterDetails,
    getEditorCharacterDetails
} from "./editor-fields.js";



export function openEditor(
    id,
    refreshDashboard,
    groupId = ""
) {
    const existing =
        document.getElementById(
            "ccm-editor"
        );

    if (existing) {
        existing.remove();
    }
    const char =
        getScopedCharacter(
            id,
            groupId
        );

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
    <h3>${escapeHtml(char.name)}</h3>
    <button id="ccm-editor-close">✕</button>
    </div>
	<details id="ccm-ai-facts-details">
		<summary>
			<span>AI Extracted Facts</span>
			<small>Show / Hide</small>
		</summary>
		<pre id="ccm-facts">${escapeHtml(JSON.stringify(
			char.facts || {},
			null,
			2
		))}</pre>
	</details>

<p style="opacity:.7;font-size:.9em;">
Leave blank or enter "None" if not applicable.
</p>

    <label>Card Name</label>
    <input id="ccm-name"
        value="${escapeHtml(char.name)}">

    <label>Character Name</label>
    <input id="ccm-character-name"
        value="${escapeHtml(char.facts?.characterName?.value || "")}"
    style="${confidenceStyle(
        char.facts?.characterName?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence: ${char.facts?.characterName?.confidence || 0}%
	</div>

	<div style="opacity:.7;font-size:.85em;">
		Once extracted or manually entered, only you can change this field.
	</div>

    <label>Gender</label>
    <input id="ccm-gender"
        value="${escapeHtml(char.facts?.gender?.value || "")}"
    style="${confidenceStyle(
        char.facts?.gender?.confidence || 0
    )}">
	
	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.gender?.confidence || 0
		}%
	</div>
	
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
		value="${escapeHtml(char.facts?.age?.value || "")}"
    style="${confidenceStyle(
        char.facts?.age?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.age?.confidence || 0
		}%
	</div>

	
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
		value="${escapeHtml(char.facts?.height?.value || "")}"
    style="${confidenceStyle(
        char.facts?.height?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.height?.confidence || 0
		}%
	</div>


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
		value="${escapeHtml(char.facts?.species?.value || "")}"
    style="${confidenceStyle(
        char.facts?.species?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.species?.confidence || 0
		}%
	</div>

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
		value="${escapeHtml(char.facts?.skin?.value || "")}"
    style="${confidenceStyle(
        char.facts?.skin?.confidence || 0
    )}">
	
	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.skin?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-skin"
			${
				char.locks?.skin
					? "checked"
					: ""
			}
		>
		Lock Skin
	</label>

	<label>Body Type</label>
	<input id="ccm-body-type"
		value="${escapeHtml(char.facts?.bodyType?.value || "")}"
    style="${confidenceStyle(
        char.facts?.bodyType?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.bodyType?.confidence || ""
		}%
	</div>

	
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
		value="${escapeHtml(char.facts?.breastSize?.value || "")}"
    style="${confidenceStyle(
        char.facts?.breastSize?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.breastSize?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-breast-size"
			${
				char.locks?.breastSize
					? "checked"
					: ""
			}
		>
		Lock Breast Size
	</label>

	<label>Butt Size</label>
	<input id="ccm-butt-size"
		value="${escapeHtml(char.facts?.buttSize?.value || "")}"
    style="${confidenceStyle(
        char.facts?.buttSize?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.buttSize?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-butt-size"
			${
				char.locks?.buttSize
					? "checked"
					: ""
			}
		>
		Lock Butt Size
	</label>
		
     <label>Relationship</label>
     <input id="ccm-relationship"
         value="${escapeHtml(char.facts?.relationship?.value || "")}"
    style="${confidenceStyle(
        char.facts?.relationship?.confidence || 0
    )}">
		
	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.relationship?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-relationship"
			${
				char.locks?.relationship
					? "checked"
					: ""
			}
		>
		Lock Relationship
	</label>

    <hr>

    <label>Hair Color</label>
    <input id="ccm-hair-color"
        value="${escapeHtml(char.facts?.hairColor?.value || "")}"
    style="${confidenceStyle(
        char.facts?.hairColor?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.hairColor?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-hair-color"
			${
				char.locks?.hairColor
					? "checked"
					: ""
			}
		>
		Lock Hair Colour
	</label>

    <label>Hair Style</label>
    <input id="ccm-hair-style"
        value="${escapeHtml(char.facts?.hairStyle?.value || "")}"
    style="${confidenceStyle(
        char.facts?.hairStyle?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.hairStyle?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-hair-style"
			${
				char.locks?.hairStyle
					? "checked"
					: ""
			}
		>
		Lock Hair Style
	</label>

	<label>Hair Length</label>
	<input id="ccm-hair-length"
		value="${escapeHtml(char.facts?.hairLength?.value || "")}"
    style="${confidenceStyle(
        char.facts?.hairLength?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.hairLength?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-hair-length"
			${
				char.locks?.hairLength
					? "checked"
					: ""
			}
		>
		Lock Hair Length
	</label>

    <label>Eye Color</label>
    <input
		id="ccm-eye-color"
		value="${escapeHtml(char.facts?.eyeColor?.value || "")}"
    style="${confidenceStyle(
        char.facts?.eyeColor?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.eyeColor?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-eye-color"
			${
				char.locks?.eyeColor
					? "checked"
					: ""
			}
		>
		Lock Eye Colour
	</label>

    <hr>

    <label>Usual Upper Clothing</label>
    <input id="ccm-usual-upper"
        value="${escapeHtml(char.facts?.usualUpper?.value || "")}"
    style="${confidenceStyle(
        char.facts?.usualUpper?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.usualUpper?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-usual-upper"
			${
				char.locks?.usualUpper
					? "checked"
					: ""
			}
		>
		Lock Usual Upper Clothing
	</label>

	<label>Usual Lower Clothing</label>
	<input id="ccm-usual-lower"
		value="${escapeHtml(char.facts?.usualLower?.value || "")}"
    style="${confidenceStyle(
        char.facts?.usualLower?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.usualLower?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-usual-lower"
			${
				char.locks?.usualLower
					? "checked"
					: ""
			}
		>
		Lock Usual Lower Clothing
	</label>

	<label>Usual Footwear</label>
	<input id="ccm-usual-footwear"
		value="${escapeHtml(char.facts?.usualFootwear?.value || "")}"
    style="${confidenceStyle(
        char.facts?.usualFootwear?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.usualFootwear?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-usual-footwear"
			${
				char.locks?.usualFootwear
					? "checked"
					: ""
			}
		>
		Lock Usual Footwear
	</label>

    <hr>

    <label>Upper Clothing</label>
    <input id="ccm-upper"
        value="${escapeHtml(char.facts?.upper?.value || "")}"
    style="${confidenceStyle(
        char.facts?.upper?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.upper?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-upper"
			${
				char.locks?.upper
					? "checked"
					: ""
			}
		>
		Lock Upper Clothing
	</label>

	<label>Outerwear</label>
	<input id="ccm-outerwear"
		value="${escapeHtml(char.facts?.outerwear?.value || "")}"
    style="${confidenceStyle(
        char.facts?.outerwear?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.outerwear?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-outerwear"
			${
				char.locks?.outerwear
					? "checked"
					: ""
			}
		>
		Lock Outerwear Clothing
	</label>

    <label>Lower Clothing</label>
    <input id="ccm-lower"
        value="${escapeHtml(char.facts?.lower?.value || "")}"
    style="${confidenceStyle(
        char.facts?.lower?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.lower?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-lower"
			${
				char.locks?.lower
					? "checked"
					: ""
			}
		>
		Lock Lower Clothing
	</label>

    <label>Footwear</label>
    <input id="ccm-footwear"
        value="${escapeHtml(char.facts?.footwear?.value || "")}"
    style="${confidenceStyle(
        char.facts?.footwear?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.footwear?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-footwear"
			${
				char.locks?.footwear
					? "checked"
					: ""
			}
		>
		Lock Footwear
	</label>

    <label>Underwear Top</label>
    <input id="ccm-underwear-top"
        value="${escapeHtml(char.facts?.underwearTop?.value || "")}"
    style="${confidenceStyle(
        char.facts?.underwearTop?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.underwearTop?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-underwear-top"
			${
				char.locks?.underwearTop
					? "checked"
					: ""
			}
		>
		Lock Underwear Top
	</label>

    <label>Underwear Bottom</label>
    <input id="ccm-underwear-bottom"
        value="${escapeHtml(char.facts?.underwearBottom?.value || "")}"
    style="${confidenceStyle(
        char.facts?.underwearBottom?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.underwearBottom?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-underwear-bottom"
			${
				char.locks?.underwearBottom
					? "checked"
					: ""
			}
		>
		Lock Underwear Bottom
	</label>

	<label>Covering (blanket, towel, sheet)</label>
	<input id="ccm-covering"
		value="${escapeHtml(char.facts?.covering?.value || "")}"
    style="${confidenceStyle(
        char.facts?.covering?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.covering?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-covering"
			${
				char.locks?.covering
					? "checked"
					: ""
			}
		>
		Lock Covering
	</label>


    <hr>

    <label>Location</label>
    <input id="ccm-location"
        value="${escapeHtml(char.facts?.location?.value || "")}"
    style="${confidenceStyle(
        char.facts?.location?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.location?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-location"
			${
				char.locks?.location
					? "checked"
					: ""
			}
		>
		Lock Location
	</label>

	<label>Area</label>
	<input id="ccm-area"
		value="${escapeHtml(char.facts?.area?.value || "")}"
    style="${confidenceStyle(
        char.facts?.area?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.area?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-area"
			${
				char.locks?.area
					? "checked"
					: ""
			}
		>
		Lock Area
	</label>

    <label>Position</label>
    <input id="ccm-position"
        value="${escapeHtml(char.facts?.position?.value || "")}"
    style="${confidenceStyle(
        char.facts?.position?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.position?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-position"
			${
				char.locks?.position
					? "checked"
					: ""
			}
		>
		Lock Position
	</label>

	<label>Body Pose</label>
	<input id="ccm-position-detail"
		value="${escapeHtml(char.facts?.positionDetail?.value || "")}"
    style="${confidenceStyle(
        char.facts?.positionDetail?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.positionDetail?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-position-detail"
			${
				char.locks?.positionDetail
					? "checked"
					: ""
			}
		>
		Lock Body Pose
	</label>

	<label>Legs</label>
	<input id="ccm-legs"
		value="${escapeHtml(char.facts?.legs?.value || "")}"
    style="${confidenceStyle(
        char.facts?.legs?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.legs?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-legs"
			${
				char.locks?.legs
					? "checked"
					: ""
			}
		>
		Lock Legs
	</label>

	<label>Left Hand</label>
	<input id="ccm-left-hand"
		value="${escapeHtml(char.facts?.leftHand?.value || "")}"
    style="${confidenceStyle(
        char.facts?.leftHand?.confidence || 0
    )}">
	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence: ${char.facts?.leftHand?.confidence || 0}%
	</div>
	<label style="display:flex;align-items:center;gap:6px;">
		<input type="checkbox" style="width:10px;margin:0;"
			id="ccm-lock-left-hand"
			${char.locks?.leftHand ? "checked" : ""}>
		Lock Left Hand
	</label>

	<label>Right Hand</label>
	<input id="ccm-right-hand"
		value="${escapeHtml(char.facts?.rightHand?.value || "")}"
    style="${confidenceStyle(
        char.facts?.rightHand?.confidence || 0
    )}">
	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence: ${char.facts?.rightHand?.confidence || 0}%
	</div>
	<label style="display:flex;align-items:center;gap:6px;">
		<input type="checkbox" style="width:10px;margin:0;"
			id="ccm-lock-right-hand"
			${char.locks?.rightHand ? "checked" : ""}>
		Lock Right Hand
	</label>

	<label>Head</label>
	<input id="ccm-head-position"
		value="${escapeHtml(char.facts?.headPosition?.value || "")}"
    style="${confidenceStyle(
        char.facts?.headPosition?.confidence || 0
    )}">
	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence: ${char.facts?.headPosition?.confidence || 0}%
	</div>
	<label style="display:flex;align-items:center;gap:6px;">
		<input type="checkbox" style="width:10px;margin:0;"
			id="ccm-lock-head-position"
			${char.locks?.headPosition ? "checked" : ""}>
		Lock Head
	</label>

	<label>Eyes</label>
	<input id="ccm-eye-direction"
		value="${escapeHtml(char.facts?.eyeDirection?.value || "")}"
    style="${confidenceStyle(
        char.facts?.eyeDirection?.confidence || 0
    )}">
	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence: ${char.facts?.eyeDirection?.confidence || 0}%
	</div>
	<label style="display:flex;align-items:center;gap:6px;">
		<input type="checkbox" style="width:10px;margin:0;"
			id="ccm-lock-eye-direction"
			${char.locks?.eyeDirection ? "checked" : ""}>
		Lock Eyes
	</label>

	<label>Expression</label>
	<input id="ccm-expression"
		value="${escapeHtml(char.facts?.expression?.value || "")}"
    style="${confidenceStyle(
        char.facts?.expression?.confidence || 0
    )}">
	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence: ${char.facts?.expression?.confidence || 0}%
	</div>
	<label style="display:flex;align-items:center;gap:6px;">
		<input type="checkbox" style="width:10px;margin:0;"
			id="ccm-lock-expression"
			${char.locks?.expression ? "checked" : ""}>
		Lock Expression
	</label>

    <label>Mood</label>
    <input id="ccm-mood"
        value="${escapeHtml(char.facts?.mood?.value || "")}"
    style="${confidenceStyle(
        char.facts?.mood?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.mood?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-mood"
			${
				char.locks?.mood
					? "checked"
					: ""
			}
		>
		Lock Mood
	</label>

	<label>Mood Intensity</label>
	<input id="ccm-mood-intensity"
		value="${escapeHtml(char.facts?.moodIntensity?.value || "")}"
    style="${confidenceStyle(
        char.facts?.moodIntensity?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.moodIntensity?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-mood-intensity"
			${
				char.locks?.moodIntensity
					? "checked"
					: ""
			}
		>
		Lock Mood Intensity
	</label>

    <label>Accessories</label>
    <input id="ccm-accessories"
        value="${escapeHtml(char.facts?.accessories?.value || "")}"
    style="${confidenceStyle(
        char.facts?.accessories?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.accessories?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-accessories"
			${
				char.locks?.accessories
					? "checked"
					: ""
			}
		>
		Lock Accessories
	</label>
		
	<label>Inventory</label>
	<input id="ccm-inventory"
		value="${escapeHtml((char.inventory || []).join(", "))}">

	<hr>

	<label>Penis (Average, Large, Small, Circumcised, Uncircumcised)</label>
	<input id="ccm-penis"
		value="${escapeHtml(char.facts?.penis?.value || "")}"
    style="${confidenceStyle(
        char.facts?.penis?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.penis?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-penis"
			${
				char.locks?.penis
					? "checked"
					: ""
			}
		>
		Lock Penis
	</label>

	<label>Penis State (Soft, Semi-Erect, Erect)</label>
	<input id="ccm-penis-state"
		value="${escapeHtml(char.facts?.penisState?.value || "")}"
    style="${confidenceStyle(
        char.facts?.penisState?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.penisState?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-penis-state"
			${
				char.locks?.penisState
					? "checked"
					: ""
			}
		>
		Lock Penis State
	</label>

	<label>Penis Condition</label>
	<input id="ccm-penis-condition"
		value="${escapeHtml(char.facts?.penisCondition?.value || "")}"
    style="${confidenceStyle(
        char.facts?.penisCondition?.confidence || 0
    )}">
	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence: ${char.facts?.penisCondition?.confidence || 0}%
	</div>
	<label style="display:flex;align-items:center;gap:6px;">
		<input type="checkbox" style="width:10px;margin:0;"
			id="ccm-lock-penis-condition"
			${char.locks?.penisCondition ? "checked" : ""}>
		Lock Penis Condition
	</label>

	<label>Pussy (Shaved, Trimmed, Natural)</label>
	<input id="ccm-pussy"
		value="${escapeHtml(char.facts?.pussy?.value || "")}"
    style="${confidenceStyle(
        char.facts?.pussy?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.pussy?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-pussy"
			${
				char.locks?.pussy
					? "checked"
					: ""
			}
		>
		Lock Pussy
	</label>

	<label>Pussy State (Dry, Moist, Wet)</label>
	<input id="ccm-pussy-state"
		value="${escapeHtml(char.facts?.pussyState?.value || "")}"
    style="${confidenceStyle(
        char.facts?.pussyState?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.pussyState?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-pussy-state"
			${
				char.locks?.pussyState
					? "checked"
					: ""
			}
		>
		Lock Pussy State
	</label>

	<label>Pussy Condition</label>
	<input id="ccm-pussy-condition"
		value="${escapeHtml(char.facts?.pussyCondition?.value || "")}"
    style="${confidenceStyle(
        char.facts?.pussyCondition?.confidence || 0
    )}">
	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence: ${char.facts?.pussyCondition?.confidence || 0}%
	</div>
	<label style="display:flex;align-items:center;gap:6px;">
		<input type="checkbox" style="width:10px;margin:0;"
			id="ccm-lock-pussy-condition"
			${char.locks?.pussyCondition ? "checked" : ""}>
		Lock Pussy Condition
	</label>

	<hr>

	<label>Condition</label>
	<input id="ccm-condition"
		value="${escapeHtml(char.facts?.condition?.value || "")}"
    style="${confidenceStyle(
        char.facts?.condition?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.condition?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-condition"
			${
				char.locks?.condition
					? "checked"
					: ""
			}
		>
		Lock Condition
	</label>

	<label>Injuries</label>
	<input id="ccm-injuries"
		value="${escapeHtml(char.facts?.injuries?.value || "")}"
    style="${confidenceStyle(
        char.facts?.injuries?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.injuries?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-injuries"
			${
				char.locks?.injuries
					? "checked"
					: ""
			}
		>
		Lock Injuries
	</label>

	<label>Notes</label>
	<input id="ccm-notes"
		value="${escapeHtml(char.facts?.notes?.value || "")}"
    style="${confidenceStyle(
        char.facts?.notes?.confidence || 0
    )}">

	<div style="opacity:.7;font-size:.85em;">
		AI read Confidence:
		${
			char.facts?.notes?.confidence || 0
		}%
	</div>

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
			id="ccm-lock-notes"
			${
				char.locks?.notes
					? "checked"
					: ""
			}
		>
		Lock Notes
	</label>
    <div class="ccm-editor-actions">
    <button id="ccm-copy-character" type="button">
        Copy JSON
    </button>
    <button id="ccm-save-character">
        Save
    </button>
    </div>

</div>
`;

    (SillyTavern.getContext()
        ?.Popup?.util?.getTopmostModalLayer?.()
        || document.body).appendChild(
        editor
    );
	document
		.getElementById("ccm-save-character")
		.addEventListener(
			"click",
			() => saveCharacter(
					id,
					refreshDashboard,
					groupId
				)
		);
    document
        .getElementById("ccm-copy-character")
        .addEventListener("click", async event => {
            const button = event.currentTarget;
            try {
                await copyEditorCharacterDetails(char);
                button.textContent = "Copied!";
            } catch (error) {
                console.error("[CCM] Failed to copy character JSON", error);
                button.textContent = "Copy failed";
            }
            setTimeout(() => {
                button.textContent = "Copy JSON";
            }, 1500);
        });
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
}

export function saveCharacter(
    id,
    refreshDashboard,
    groupId = ""
) {
    const char =
        getScopedCharacter(
            id,
            groupId
        );

    if (!char) return;

    updateScopedCharacter(
        id,
        getEditorCharacterUpdates(char),
        groupId
    );

    document
        .getElementById("ccm-editor")
        ?.remove();

    refreshDashboard(
        id,
        groupId
    );
}

