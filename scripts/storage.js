// storage.js

const STORAGE_KEY =
    "ccm_database";

export function loadDatabase() {
    try {
        const data =
            localStorage.getItem(
                STORAGE_KEY
            );

        if (!data) {
            return null;
        }

        return JSON.parse(data);

    } catch (err) {

        console.error(
            "[CCM] Load Failed",
            err
        );

        return null;
    }
}

export function saveDatabase(
    database
) {
    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(database)
        );

        console.log(
            "[CCM] Database Saved"
        );

    } catch (err) {

        console.error(
            "[CCM] Save Failed",
            err
        );
    }
}