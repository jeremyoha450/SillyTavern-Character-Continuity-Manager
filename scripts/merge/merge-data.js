// scripts/merge/merge-data.js

export function mergeData(
    existing,
    incoming,
    locks = {}
) {
	
	    console.log(
        "[CCM] Running Merge Data"
    );

    const merged =
        structuredClone(
            existing
        );

    const changes = [];

    for (const key of Object.keys(incoming)) {

        if (!(key in merged)) {
            continue;
        }

        if (locks[key]) {
            continue;
        }

        const field =
            structuredClone(
                incoming[key]
            );

        if (!field) {
            continue;
        }

        if (field.value == null) {
            field.value = "";
        }

        if (field.confidence <= 0) {
            continue;
        }

        if (field.value === "") {
            continue;
        }

        const current =
            merged[key];

        if (
            current?.value === field.value
        ) {
            // Identical value is not a change: keep the
            // stored entry untouched and record no event.
            continue;
        }

        const oldValue =
            structuredClone(
                current
            );

        merged[key] =
            field;

        changes.push({
            field: key,
            old: oldValue,
            new: structuredClone(
                field
            )
        });

    }

    return {
        data: merged,
        changed:
            changes.length > 0,
        changes
    };

}