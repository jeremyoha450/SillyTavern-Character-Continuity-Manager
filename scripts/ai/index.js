// scripts/ai/index.js

import {
    executeTask
} from "./execute-task.js";

import {
    getTask
} from "../tasks/index.js";

export async function execute(
    taskId,
    input,
    metadata = {}
) {

    const task =
        getTask(
            taskId
        );

    if (!task) {

        throw new Error(
            `Unknown task '${taskId}'.`
        );

    }

    return await executeTask(
        task,
        input,
        metadata
    );

}
