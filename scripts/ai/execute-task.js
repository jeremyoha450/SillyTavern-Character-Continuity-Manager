// scripts/ai/execute-task.js

import {
    getCurrentDriver
} from "./registry.js";

import {
    getDriverSettings
} from "./settings.js";

import {
    recordUsage
} from "../usage.js";

export async function executeTask(
    task,
    input,
    metadata = {}
) {

    const driver =
        getCurrentDriver();

    if (!driver) {

        throw new Error(
            "No AI driver selected."
        );

    }

    const response =
        await driver.sendRequest(

        task,

        getDriverSettings(),

        input

    );

    if (
        response &&
        typeof response === "object" &&
        "result" in response
    ) {
        recordUsage({
            usage: response.usage,
            task,
            provider: driver,
            model:
                response.model ||
                getDriverSettings().model,
            metadata
        });

        return response.result;
    }

    return response;

}
