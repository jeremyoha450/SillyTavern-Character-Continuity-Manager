// scripts/extraction/age-guard.js
//
// Characters with a stated age below 18 are unsupported:
// state extraction, image prompt generation and height fill
// all skip them. A blank or non-numeric age is treated as
// unknown, not underage.

export const UNDERAGE_MESSAGE =
    "Characters under 18 are not supported — state tracking and image generation are disabled.";

export function isUnderage(facts) {

    const digits =
        String(
            facts?.age?.value ?? ""
        ).replace(/\D+/g, "");

    if (!digits) {
        return false;
    }

    return Number(digits) < 18;

}
