// scripts/config/height-defaults.js
//
// Height-fill configuration, loaded once at startup from
// config/heightDefaults.json. A missing or malformed file
// never crashes the app: the loader warns and falls back to
// the built-in defaults.

const BUILT_IN = Object.freeze({

    byAge: Object.freeze({

        "18": Object.freeze({

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

        })

    }),

    fallback: "nearest",

    unknownAge: "youngest",

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
let configStatus = {
    source: "built-in",
    valid: true,
    detail: "Built-in defaults active while configuration loads."
};

function isPlainObject(value) {

    return (
        Boolean(value) &&
        typeof value === "object" &&
        !Array.isArray(value)
    );

}

function isBandSet(entry) {

    if (!isPlainObject(entry)) {
        return false;
    }

    if (
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
            value > 0
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
        byAge,
        fallback,
        unknownAge,
        varietyCm,
        format,
        keywords
    } = raw;

    if (!isPlainObject(byAge)) {
        return null;
    }

    const entries =
        Object.entries(byAge);

    if (entries.length === 0) {
        return null;
    }

    for (const [key, entry] of entries) {

        if (
            !/^\d+$/.test(key) ||
            Number(key) <= 0
        ) {
            return null;
        }

        if (
            !isPlainObject(entry) ||
            !isBandSet(entry.female) ||
            !isBandSet(entry.male)
        ) {
            return null;
        }

    }

    if (
        fallback !== "nearest" &&
        fallback !== "floor"
    ) {
        return null;
    }

    if (
        unknownAge !== "youngest" &&
        unknownAge !== "blank"
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

    return {

        byAge:
            structuredClone(byAge),

        fallback,

        unknownAge,

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

export function getHeightConfigStatus() {
    return structuredClone(configStatus);
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
            configStatus = {
                source: "built-in",
                valid: false,
                detail: "Shipped configuration was malformed; built-in fallback is active."
            };

            return cachedConfig;

        }

        cachedConfig = validated;
        configStatus = {
            source: "config/heightDefaults.json",
            valid: true,
            detail: "Shipped height configuration loaded and validated."
        };

    } catch (error) {

        console.warn(
            "[CCM] Failed to load config/heightDefaults.json; using built-in height defaults.",
            error
        );

        cachedConfig = BUILT_IN;
        configStatus = {
            source: "built-in",
            valid: false,
            detail: "Shipped configuration could not be loaded; built-in fallback is active."
        };

    }

    return cachedConfig;

}

export {
    BUILT_IN as BUILT_IN_HEIGHT_CONFIG
};
