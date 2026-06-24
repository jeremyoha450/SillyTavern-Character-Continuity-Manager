export function showContinuityDialog(
    characterName
) {
    return new Promise(
        resolve => {

            const useExisting =
                confirm(
                    `${characterName} already exists.\n\nUse existing continuity?\n\nOK = Use Existing\nCancel = Start Fresh`
                );

            resolve(
                useExisting
                    ? "reuse"
                    : "fresh"
            );
        }
    );
}