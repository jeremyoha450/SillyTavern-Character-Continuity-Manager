const SEATED_OR_RECLINING = /\b(sit|sitting|seated|lie|lying|reclin|kneel)/i;
const FURNITURE_SURFACE = /^on (?:the )?(?:couch|sofa|chair|bed|bench|seat)\b/i;

const STANDING_INCOMPATIBLE_DETAIL =
    /\b(?:knees? (?:drawn |pulled )?up|knees to (?:the |her |his |their )?chest|hugging (?:own |her |his |their )?knees|cross-legged|lying|seated|sitting|kneeling|squatting|fetal position)\b/i;

export function reconcilePostureTransition(
    previous,
    incoming,
    locks = {}
) {
    const result = structuredClone(incoming);
    const oldPosition = String(previous.position?.value || "").trim();
    const newPosition = String(result.position?.value || "").trim();

    // A blank incoming position means "unchanged", so the
    // stored position stays authoritative for conflicts.
    const effectivePosition = newPosition || oldPosition;

    const incomingDetail =
        String(result.positionDetail?.value || "").trim();
    const storedDetail =
        String(previous.positionDetail?.value || "").trim();

    const conflictsWithPosition = detail =>
        /^standing\b/i.test(effectivePosition) &&
        STANDING_INCOMPATIBLE_DETAIL.test(detail);

    const clearDetail = incomingDetail
        ? conflictsWithPosition(incomingDetail)
        : Boolean(storedDetail) &&
          (
              (newPosition && newPosition !== oldPosition) ||
              conflictsWithPosition(storedDetail)
          );

    if (!locks.positionDetail && clearDetail) {
        result.positionDetail = {
            value: "",
            confidence: 0,
            clear: true
        };
    }

    const oldArea = String(previous.area?.value || "").trim();
    const newArea = String(result.area?.value || "").trim();

    if (
        !locks.area &&
        !newArea &&
        SEATED_OR_RECLINING.test(oldPosition) &&
        /^standing\b/i.test(newPosition) &&
        FURNITURE_SURFACE.test(oldArea)
    ) {
        result.area = {
            value: "",
            confidence: 0,
            clear: true
        };
    }

    return result;
}
