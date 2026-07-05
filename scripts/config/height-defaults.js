// scripts/config/height-defaults.js
//
// Height-fill configuration, loaded once at startup from
// config/heightDefaults.json. A missing or malformed file
// never crashes the app: the loader warns and falls back to
// the built-in defaults.

const BUILT_IN = Object.freeze({

    defaults: Object.freeze({

        female: Object.freeze({
            short: 152,
            average: 163,
            tall: 172
        }),

        male: Object.freeze({
            short: 165,
            average: 176,
            tall: 188
        })

    }),

    speciesOverrides: Object.freeze({}),

    varietyCm: 0,

    format: "{cm} cm",

    keywords: Object.freeze({

        short: Object.freeze([
            "short",
            "petite",
            "small",
            "tiny"
        ]),

        tall: Object.freeze([
            "tall",
            "towering",
            "lanky",
            "statuesque"
        ])

    })

});

const HEIGHT_BANDS = [
    "short",
    "average",
    "tall"
];

let cachedConfig = BUILT_IN;

function isPlainObject(value) {

    return (
        Boolean(value) &&
        typeof value === "object" &&
        !Array.isArray(value)
    );

}

// A defaults band set must carry a positive number for all
// three bands; an override band set may leave bands out or
// zero them as inert placeholders that fall through to the
// defaults at fill time.
function isBandSet(entry, { requireAll }) {

    if (!isPlainObject(entry)) {
        return false;
    }

    if (
        requireAll &&
        !HEIGHT_BANDS.every(
            band => band in entry
        )
    ) {
        return false;
    }

    return Object.values(entry).every(
        value =>
            typeof value === "number" &&
            Number.isFinite(value) &&
            (requireAll ? value > 0 : value >= 0)
    );

}

function isKeywordList(value) {

    return (
        Array.isArray(value) &&
        value.every(
            word =>
                typeof word === "string" &&
                word.trim() !== ""
        )
    );

}

// Returns a validated copy of the raw config, or null when
// any part of it is malformed.
export function validateHeightConfig(raw) {

    if (!isPlainObject(raw)) {
        return null;
    }

    const {
        defaults,
        speciesOverrides,
        varietyCm,
        format,
        keywords
    } = raw;

    if (
        !isPlainObject(defaults) ||
        !isBandSet(defaults.female, { requireAll: true }) ||
        !isBandSet(defaults.male, { requireAll: true })
    ) {
        return null;
    }

    if (
        typeof varietyCm !== "number" ||
        !Number.isFinite(varietyCm) ||
        varietyCm < 0
    ) {
        return null;
    }

    if (
        typeof format !== "string" ||
        !format.includes("{cm}")
    ) {
        return null;
    }

    if (
        !isPlainObject(keywords) ||
        !isKeywordList(keywords.short) ||
        !isKeywordList(keywords.tall)
    ) {
        return null;
    }

    const overrides =
        speciesOverrides ?? {};

    if (!isPlainObject(overrides)) {
        return null;
    }

    for (
        const species
        of Object.values(overrides)
    ) {

        if (!isPlainObject(species)) {
            return null;
        }

        for (
            const bands
            of Object.values(species)
        ) {

            if (
                !isBandSet(bands, { requireAll: false })
            ) {
                return null;
            }

        }

    }

    return {

        defaults:
            structuredClone(defaults),

        speciesOverrides:
            structuredClone(overrides),

        varietyCm,

        format,

        keywords: {
            short: [...keywords.short],
            tall: [...keywords.tall]
        }

    };

}

export function getHeightConfig() {
    return cachedConfig;
}

export async function loadHeightDefaults() {

    try {

        const response =
            await fetch(
                new URL(
                    "../../config/heightDefaults.json",
                    import.meta.url
                )
            );

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const validated =
            validateHeightConfig(
                await response.json()
            );

        if (!validated) {

            console.warn(
                "[CCM] config/heightDefaults.json is malformed; using built-in height defaults."
            );

            cachedConfig = BUILT_IN;

            return cachedConfig;

        }

        cachedConfig = validated;

    } catch (error) {

        console.warn(
            "[CCM] Failed to load config/heightDefaults.json; using built-in height defaults.",
            error
        );

        cachedConfig = BUILT_IN;

    }

    return cachedConfig;

}

export {
    BUILT_IN as BUILT_IN_HEIGHT_CONFIG
};
