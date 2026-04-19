const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const MAX_QUESTIONS = 20;
const AUTO_GUESS_AFTER = 10;
const MAX_GUESSES = 3;
const GAME_SESSIONS = {};

// Prompts
const SYSTEM_PROMPT = `You are Akinator. Guess the character by asking yes/no questions.
Respond ONLY as JSON: {"question": "...", "next_action": "continue" or "guess"}

Rules:
- Ask yes/no questions only
- Follow this order: human? → fictional? → medium(movie/anime/comic/sport) → universe/franchise → gender → role → traits
- Branch on answers: if real person → actor/athlete/politician? → country → specific traits
- If fictional → Marvel/DC/anime/Disney? → hero/villain? → powers/traits
- NEVER ask a person's name directly — ask traits instead
- Guess after 6-8 good answers when confident
- Keep questions short and clear`;

const GUESS_PROMPT = `You are Akinator. Based on the Q&A history, name the exact character.
Analyze all the yes/no answers carefully to find a character that matches ALL the clues.
Respond with ONLY the character's full name — nothing else. No explanation.`;

// Helper function to call Groq API
async function callGroqAPI(messages, maxTokens = 150, temperature = 0.7) {
    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: messages,
                max_tokens: maxTokens,
                temperature: temperature
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Groq API Error:', error);
        throw error;
    }
}

// Parse JSON response from LLM
function parseJSON(raw) {
    const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch (e) {
        const match = cleaned.match(/\{.*?\}/s);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch (e2) {
                // Fallback
            }
        }
    }
    return { question: "Is the character human?", next_action: "continue" };
}

// Trim history to save tokens
function trimHistory(history, keep = 8) {
    const system = history.filter(m => m.role === 'system');
    const rest = history.filter(m => m.role !== 'system');
    return [...system, ...rest.slice(-keep)];
}

// Generate unique session ID
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Routes
app.get('/config', (req, res) => {
    res.json({
        apiUrl: process.env.API_URL || `http://localhost:${PORT}`
    });
});

app.get('/', (req, res) => {
    res.json({ message: 'Psionist backend running.' });
});

app.post('/start_game', async (req, res) => {
    try {
        const sessionId = generateSessionId();
        const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
        
        const raw = await callGroqAPI(messages);
        const data = parseJSON(raw);
        
        const state = {
            session_id: sessionId,
            history: [...messages, { role: 'assistant', content: raw }],
            question_count: 1,
            guess_count: 0,
            current_question: data.question,
            stage: 'questioning',
            final_guess: null,
            result_message: null,
            has_guessed_once: false
        };
        
        GAME_SESSIONS[sessionId] = state;
        
        res.json({ state });
    } catch (error) {
        console.error('Start game error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/answer_question', async (req, res) => {
    try {
        const { session_id, answer } = req.body;
        const state = GAME_SESSIONS[session_id];
        
        if (!state) {
            return res.status(404).json({ error: 'Session not found.' });
        }
        
        if (state.stage !== 'questioning') {
            return res.status(400).json({ error: 'Wrong stage.' });
        }
        
        state.history.push({
            role: 'user',
            content: `Q: ${state.current_question} | A: ${answer}`
        });
        state.question_count += 1;
        
        if (state.question_count >= AUTO_GUESS_AFTER) {
            state.stage = 'guessing';
            GAME_SESSIONS[session_id] = state;
            return res.json({ next_stage: 'guessing', state });
        }
        
        const messages = trimHistory(state.history);
        const raw = await callGroqAPI(messages);
        const data = parseJSON(raw);
        
        state.current_question = data.question;
        state.history.push({ role: 'assistant', content: raw });
        
        if (data.next_action === 'guess') {
            state.stage = 'guessing';
        }
        
        GAME_SESSIONS[session_id] = state;
        
        res.json({ next_stage: state.stage, state });
    } catch (error) {
        console.error('Answer question error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/make_guess', async (req, res) => {
    try {
        const { session_id } = req.body;
        const state = GAME_SESSIONS[session_id];
        
        if (!state) {
            return res.status(404).json({ error: 'Session not found.' });
        }
        
        if (state.guess_count >= MAX_GUESSES) {
            state.stage = 'finished';
            GAME_SESSIONS[session_id] = state;
            return res.json({ 
                guess: 'I give up!', 
                guess_count: state.guess_count, 
                state 
            });
        }
        
        state.stage = 'guessing';
        if (state.has_guessed_once) {
            state.guess_count += 1;
        }
        state.has_guessed_once = true;
        
        // Initialize previous guesses array if not exists
        if (!state.previous_guesses) {
            state.previous_guesses = [];
        }
        
        // Build concise summary for guess
        const qaLines = state.history
            .filter(m => m.role === 'user')
            .map(m => m.content);
        const summary = qaLines.slice(-10).join('\n');
        
        // Add previous guesses to the prompt to avoid repetition
        let guessPrompt = GUESS_PROMPT;
        if (state.previous_guesses.length > 0) {
            guessPrompt += `\n\nPrevious incorrect guesses: ${state.previous_guesses.join(', ')}.
These were WRONG, so DO NOT repeat them.
Carefully re-analyze the Q&A answers and think of a DIFFERENT character that better matches ALL the yes/no clues provided.
Consider characters with similar traits but different identities.`;
        }
        
        const messages = [
            { role: 'system', content: guessPrompt },
            { role: 'user', content: `Here are the answers:\n${summary}\n\nWho is it?` }
        ];
        
        const guess = await callGroqAPI(messages, 30, 0.1);
        
        // Store this guess
        state.previous_guesses.push(guess);
        
        GAME_SESSIONS[session_id] = state;
        
        res.json({ guess, guess_count: state.guess_count, state });
    } catch (error) {
        console.error('Make guess error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🧠 Psionist backend running on http://localhost:${PORT}`);
    console.log(`Make sure GROQ_API_KEY is set in .env file`);
});

// Made with Bob
