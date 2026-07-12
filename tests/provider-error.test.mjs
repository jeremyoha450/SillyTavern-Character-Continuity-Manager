import assert from "node:assert/strict";
import test from "node:test";

import {
    CCMProviderError,
    classifyProviderError,
    createSafeErrorReport,
    getSafeErrorMessage
} from "../scripts/provider-error.js";

test("provider errors distinguish billing, rate limiting, filtering, and overload", () => {
    assert.equal(classifyProviderError({ status: 402 }), "billing");
    assert.equal(classifyProviderError({ status: 429, type: "rate_limit_error" }), "rate_limit");
    assert.equal(classifyProviderError({ finishReason: "content_filter" }), "content_filter");
    assert.equal(classifyProviderError({ status: 529, type: "overloaded_error" }), "provider_overloaded");
});

test("safe error reports exclude raw provider messages and private AI content", () => {
    const error = new CCMProviderError("Provider echoed private prompt text", {
        provider: "Example",
        category: "billing",
        status: 402,
        code: "insufficient_credit",
        requestId: "req_safe",
        debugRawOutput: "PRIVATE CHARACTER OUTPUT"
    });
    const report = createSafeErrorReport(error, "Manual state update");

    assert.match(report, /insufficient_credit/);
    assert.match(report, /req_safe/);
    assert.doesNotMatch(report, /private prompt/i);
    assert.doesNotMatch(report, /PRIVATE CHARACTER OUTPUT/);
    assert.match(getSafeErrorMessage(error), /insufficient credit/i);
});
