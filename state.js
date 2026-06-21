export function getSavedStates() {
    const states = localStorage.getItem('shuffle_steps');
    return states ? JSON.parse(states) : {};
}

export function saveStepState(stepId, isLearned) {
    const states = getSavedStates();
    states[stepId] = isLearned;
    localStorage.setItem('shuffle_steps', JSON.stringify(states));
}
