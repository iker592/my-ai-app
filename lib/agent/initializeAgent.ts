// initializeAgent.ts

import fs from 'fs';
import path from 'path';

class Agent {
    constructor() {
        this.resume = this.loadResume();
        this.systemPrompt = this.loadSystemPrompt();
    }

    loadResume() {
        const resumePath = path.join(__dirname, 'path/to/resume.txt'); // Adjust the path accordingly
        return fs.readFileSync(resumePath, 'utf-8');
    }

    loadSystemPrompt() {
        const promptPath = path.join(__dirname, 'path/to/systemPrompt.txt'); // Adjust the path accordingly
        return fs.readFileSync(promptPath, 'utf-8');
    }

    initialize() {
        console.log('Agent Initialized with Resume and System Prompt');
        // Further initialization code
    }
}

const agent = new Agent();
agent.initialize();

export default agent;