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

import characterCastPlanTask
from "./character-creator/plan.js";

import characterCardTask
from "./character-creator/card.js";

import characterCardFieldTask
from "./character-creator/field.js";

const tasks = {

    facts: factsTask,

    state: stateTask,
	
	knowledge: knowledgeTask,
	
	"knowledge-update": knowledgeUpdateTask,

    "image-prompt": imagePromptTask,

    "character-cast-plan": characterCastPlanTask,

    "character-card": characterCardTask,

    "character-card-field": characterCardFieldTask

};

export function getTask(
    id
) {

    return tasks[id];

}
