// scripts/ui/editor.js

import {
    getCharacter,
    updateCharacter
} from "../database.js";

import {
    confidenceStyle
} from "./confidence.js";

import {
    escapeHtml
} from "./escape.js";



export function openEditor(
    id,
    refreshDashboard
) {
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
		
    <button id="ccm-save-character">
        Save
    </button>

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
					refreshDashboard
				)
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
}

export function saveCharacter(
    id,
    refreshDashboard
) {
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

			const hairColorLocked =
				document.getElementById(
					"ccm-lock-hair-color"
				).checked;

			const hairStyleLocked =
				document.getElementById(
					"ccm-lock-hair-style"
				).checked;

			const hairLengthLocked =
				document.getElementById(
					"ccm-lock-hair-length"
				).checked;

			const eyeColorLocked =
				document.getElementById(
					"ccm-lock-eye-color"
				).checked;

			const skinLocked =
				document.getElementById(
					"ccm-lock-skin"
				).checked;
				
			const breastSizeLocked =
				document.getElementById(
					"ccm-lock-breast-size"
				).checked;
				
			const buttSizeLocked =
				document.getElementById(
					"ccm-lock-butt-size"
				).checked;
				
			const relationshipLocked =
				document.getElementById(
					"ccm-lock-relationship"
				).checked;
				
			const upperLocked =
				document.getElementById(
					"ccm-lock-upper"
				).checked;
				
			const outerwearLocked =
				document.getElementById(
					"ccm-lock-outerwear"
				).checked;
				
			const lowerLocked =
				document.getElementById(
					"ccm-lock-lower"
				).checked;
				
			const footwearLocked =
				document.getElementById(
					"ccm-lock-footwear"
				).checked;
				
			const underwearTopLocked =
				document.getElementById(
					"ccm-lock-underwear-top"
				).checked;
				
			const underwearBottomLocked =
				document.getElementById(
					"ccm-lock-underwear-bottom"
				).checked;
				
			const locationLocked =
				document.getElementById(
					"ccm-lock-location"
				).checked;
				
			const areaLocked =
				document.getElementById(
					"ccm-lock-area"
				).checked;
				
			const positionLocked =
				document.getElementById(
					"ccm-lock-position"
				).checked;
				
			const positionDetailLocked =
				document.getElementById(
					"ccm-lock-position-detail"
				).checked;

			const leftHandLocked =
				document.getElementById(
					"ccm-lock-left-hand"
				).checked;

			const rightHandLocked =
				document.getElementById(
					"ccm-lock-right-hand"
				).checked;

			const headPositionLocked =
				document.getElementById(
					"ccm-lock-head-position"
				).checked;

			const eyeDirectionLocked =
				document.getElementById(
					"ccm-lock-eye-direction"
				).checked;

			const expressionLocked =
				document.getElementById(
					"ccm-lock-expression"
				).checked;
				
			const moodLocked =
				document.getElementById(
					"ccm-lock-mood"
				).checked;
				
			const moodIntensityLocked =
				document.getElementById(
					"ccm-lock-mood-intensity"
				).checked;
				
			const accessoriesLocked =
				document.getElementById(
					"ccm-lock-accessories"
				).checked;
				
			const penisLocked =
				document.getElementById(
					"ccm-lock-penis"
				).checked;
				
			const penisStateLocked =
				document.getElementById(
					"ccm-lock-penis-state"
				).checked;

			const penisConditionLocked =
				document.getElementById(
					"ccm-lock-penis-condition"
				).checked;
				
			const pussyLocked =
				document.getElementById(
					"ccm-lock-pussy"
				).checked;
				
			const pussyStateLocked =
				document.getElementById(
					"ccm-lock-pussy-state"
				).checked;

			const pussyConditionLocked =
				document.getElementById(
					"ccm-lock-pussy-condition"
				).checked;
				
			const conditionLocked =
				document.getElementById(
					"ccm-lock-condition"
				).checked;

			const injuriesLocked =
				document.getElementById(
					"ccm-lock-injuries"
				).checked;
				
			const notesLocked =
				document.getElementById(
					"ccm-lock-notes"
				).checked;

			updateCharacter(id, {
				name: document.getElementById("ccm-name").value,
				locks: { ...char.locks, 
						characterName:
							Boolean(
								char.locks?.characterName
							) ||
							Boolean(
								document
									.getElementById(
										"ccm-character-name"
									)
									.value
									.trim()
							),
						species: speciesLocked,
						age: ageLocked,
						gender: genderLocked,
						height: heightLocked,
						bodyType: bodyTypeLocked,
						hairColor: hairColorLocked,
						hairStyle: hairStyleLocked,
						hairLength: hairLengthLocked,
						eyeColor: eyeColorLocked,
						skin: skinLocked,
						breastSize: breastSizeLocked,
						buttSize: buttSizeLocked,
						relationship: relationshipLocked,
						upper: upperLocked,
						outerwear: outerwearLocked,
						lower: lowerLocked,
						footwear: footwearLocked,
						underwearTop: underwearTopLocked,
						underwearBottom: underwearBottomLocked,
						location: locationLocked,
						area: areaLocked,
						position: positionLocked,
						positionDetail: positionDetailLocked,
						leftHand: leftHandLocked,
						rightHand: rightHandLocked,
						headPosition: headPositionLocked,
						eyeDirection: eyeDirectionLocked,
						expression: expressionLocked,
						mood: moodLocked,
						moodIntensity: moodIntensityLocked,
						accessories: accessoriesLocked,
						penis: penisLocked,
						penisState: penisStateLocked,
						penisCondition: penisConditionLocked,
						pussy: pussyLocked,
						pussyState: pussyStateLocked,
						pussyCondition: pussyConditionLocked,
						condition: conditionLocked,
						injuries: injuriesLocked,
						notes: notesLocked},
		
				facts: {
					...char.facts,

					characterName: {
						value: document.getElementById("ccm-character-name").value,
						confidence:
							char.facts?.characterName?.confidence || 0
					},

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
					},
					
					hairColor: {
						value: document.getElementById("ccm-hair-color").value,
						confidence:
							char.facts?.hairColor?.confidence || 0
					},

					hairLength: {
						value: document.getElementById("ccm-hair-length").value,
						confidence:
							char.facts?.hairLength?.confidence || 0
					},

					hairStyle: {
						value: document.getElementById("ccm-hair-style").value,
						confidence:
							char.facts?.hairStyle?.confidence || 0
					},
					
					eyeColor: {
						value: document.getElementById("ccm-eye-color").value,
						confidence:
							char.facts?.eyeColor?.confidence || 0
					},

					skin: {
						value: document.getElementById("ccm-skin").value,
						confidence:
							char.facts?.skin?.confidence || 0
					},
					
					breastSize: {
						value: document.getElementById("ccm-breast-size").value,
						confidence:
							char.facts?.breastSize?.confidence || 0
					},
					
					buttSize: {
						value: document.getElementById("ccm-butt-size").value,
						confidence:
							char.facts?.buttSize?.confidence || 0
					},
					
					relationship: {
						value: document.getElementById("ccm-relationship").value,
						confidence:
							char.facts?.relationship?.confidence || 0
					},
					
					upper: {
						value: document.getElementById("ccm-upper").value,
						confidence:
							char.facts?.upper?.confidence || 0
					},
					
					outerwear: {
						value: document.getElementById("ccm-outerwear").value,
						confidence:
							char.facts?.outerwear?.confidence || 0
					},
					
					lower: {
						value: document.getElementById("ccm-lower").value,
						confidence:
							char.facts?.lower?.confidence || 0
					},
					
					footwear: {
						value: document.getElementById("ccm-footwear").value,
						confidence:
							char.facts?.footwear?.confidence || 0
					},
					
					underwearTop: {
						value: document.getElementById("ccm-underwear-top").value,
						confidence:
							char.facts?.underwearTop?.confidence || 0
					},
					
					underwearBottom: {
						value: document.getElementById("ccm-underwear-bottom").value,
						confidence:
							char.facts?.underwearBottom?.confidence || 0
					},
					
					location: {
						value: document.getElementById("ccm-location").value,
						confidence:
							char.facts?.location?.confidence || 0
					},
					
					area: {
						value: document.getElementById("ccm-area").value,
						confidence:
							char.facts?.area?.confidence || 0
					},
					
					position: {
						value: document.getElementById("ccm-position").value,
						confidence:
							char.facts?.position?.confidence || 0
					},
					
					positionDetail: {
						value: document.getElementById("ccm-position-detail").value,
						confidence:
							char.facts?.positionDetail?.confidence || 0
					},

					leftHand: {
						value: document.getElementById("ccm-left-hand").value,
						confidence:
							char.facts?.leftHand?.confidence || 0
					},

					rightHand: {
						value: document.getElementById("ccm-right-hand").value,
						confidence:
							char.facts?.rightHand?.confidence || 0
					},

					headPosition: {
						value: document.getElementById("ccm-head-position").value,
						confidence:
							char.facts?.headPosition?.confidence || 0
					},

					eyeDirection: {
						value: document.getElementById("ccm-eye-direction").value,
						confidence:
							char.facts?.eyeDirection?.confidence || 0
					},

					expression: {
						value: document.getElementById("ccm-expression").value,
						confidence:
							char.facts?.expression?.confidence || 0
					},
					
					mood: {
						value: document.getElementById("ccm-mood").value,
						confidence:
							char.facts?.mood?.confidence || 0
					},
					
					moodIntensity: {
						value: document.getElementById("ccm-mood-intensity").value,
						confidence:
							char.facts?.moodIntensity?.confidence || 0
					},
					
					accessories: {
						value: document.getElementById("ccm-accessories").value,
						confidence:
							char.facts?.accessories?.confidence || 0
					},
					
					penis: {
						value: document.getElementById("ccm-penis").value,
						confidence:
							char.facts?.penis?.confidence || 0
					},
					
					penisState: {
						value: document.getElementById("ccm-penis-state").value,
						confidence:
							char.facts?.penisState?.confidence || 0
					},

					penisCondition: {
						value: document.getElementById("ccm-penis-condition").value,
						confidence:
							char.facts?.penisCondition?.confidence || 0
					},
					
					pussy: {
						value: document.getElementById("ccm-pussy").value,
						confidence:
							char.facts?.pussy?.confidence || 0
					},
					
					pussyState: {
						value: document.getElementById("ccm-pussy-state").value,
						confidence:
							char.facts?.pussyState?.confidence || 0
					},

					pussyCondition: {
						value: document.getElementById("ccm-pussy-condition").value,
						confidence:
							char.facts?.pussyCondition?.confidence || 0
					},
					
					condition: {
						value: document.getElementById("ccm-condition").value,
						confidence:
							char.facts?.condition?.confidence || 0
					},
					
					injuries: {
						value: document.getElementById("ccm-injuries").value,
						confidence:
							char.facts?.injuries?.confidence || 0
					},
					
					notes: {
						value: document.getElementById("ccm-notes").value,
						confidence:
							char.facts?.notes?.confidence || 0
					},
					
					
				},

		inventory:
			document
				.getElementById("ccm-inventory")
				.value
				.split(",")
				.map(x => x.trim())
				.filter(Boolean)
    });

    console.log(
		"[CCM] Character Updated",
		getCharacter(id)
	);

	document
		.getElementById("ccm-editor")
		?.remove();

	refreshDashboard(
		id
	);
}

