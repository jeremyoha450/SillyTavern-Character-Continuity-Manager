// scripts/tasks/index.js

import factsTask
from "./facts/index.js";

import stateTask
from "./state/index.js";

import knowledgeTask
from "./knowledge/index.js";

import knowledgeUpdateTask
from "./knowledge-update/index.js";

import imagePromptTask
from "./image/index.js";

const tasks = {

    facts: factsTask,

    state: stateTask,
	
	knowledge: knowledgeTask,
	
	"knowledge-update": knowledgeUpdateTask,

    "image-prompt": imagePromptTask

};

export function getTask(
    id
) {

    return tasks[id];

}
