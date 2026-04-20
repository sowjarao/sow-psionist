// Configuration
let API_URL = "https://harshi-psionist.onrender.com";

if (window.location.hostname === "localhost") {
  API_URL = "http://localhost:10000";
}
console.log('Psionist game initialized. Backend API URL:', API_URL);
const MAX_GUESSES = 3;

// Game state
let gameState = {
    session_id: null,
    question_count: 0,
    current_question: 'Click Start Game to begin!',
    stage: 'start',
    history: [],
    guess_count: 0,
    final_guess: null,
    result_message: null,
    result_win: false
};

// DOM Elements
const screens = {
    start: document.getElementById('start-screen'),
    questioning: document.getElementById('questioning-screen'),
    guessing: document.getElementById('guessing-screen'),
    finished: document.getElementById('finished-screen')
};

const elements = {
    statsBar: document.getElementById('stats-bar'),
    progressWrap: document.getElementById('progress-wrap'),
    questionCount: document.getElementById('question-count'),
    guessesLeft: document.getElementById('guesses-left'),
    stageIcon: document.getElementById('stage-icon'),
    stageLabel: document.getElementById('stage-label'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    questionLabel: document.getElementById('question-label'),
    questionText: document.getElementById('question-text'),
    thinkingSpinner: document.getElementById('thinking-spinner'),
    guessReveal: document.getElementById('guess-reveal'),
    guessName: document.getElementById('guess-name'),
    guessButtons: document.getElementById('guess-buttons'),
    revealAnswerSection: document.getElementById('reveal-answer-section'),
    correctAnswerInput: document.getElementById('correct-answer-input'),
    finishBanner: document.getElementById('finish-banner'),
    finishIcon: document.getElementById('finish-icon'),
    finishMessage: document.getElementById('finish-message'),
    historyContent: document.getElementById('history-content')
};

// Buttons
const buttons = {
    start: document.getElementById('start-btn'),
    forceGuess: document.getElementById('force-guess-btn'),
    correct: document.getElementById('correct-btn'),
    wrong: document.getElementById('wrong-btn'),
    submitAnswer: document.getElementById('submit-answer-btn'),
    playAgain: document.getElementById('play-again-btn')
};

// Answer buttons
const answerButtons = document.querySelectorAll('.answer-btn');

// Utility Functions
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.style.display = 'none');
    screens[screenName].style.display = 'block';
}

function updateStats() {
    elements.questionCount.textContent = gameState.question_count;
    elements.guessesLeft.textContent = MAX_GUESSES - gameState.guess_count;
    
    const stageIcons = {
        questioning: '🔍',
        guessing: '🎯',
        finished: '🏁'
    };
    
    elements.stageIcon.textContent = stageIcons[gameState.stage] || '⏳';
    elements.stageLabel.textContent = gameState.stage.charAt(0).toUpperCase() + gameState.stage.slice(1);
}

function updateProgress() {
    const progress = Math.min(gameState.question_count / 20, 1.0);
    elements.progressFill.style.width = `${progress * 100}%`;
    elements.progressText.textContent = `Question progress: ${gameState.question_count} / 20`;
}

function showStats(show) {
    elements.statsBar.style.display = show ? 'grid' : 'none';
}

function showProgress(show) {
    elements.progressWrap.style.display = show ? 'block' : 'none';
}

// This function is no longer needed as we handle clicks directly

async function apiPost(path, payload = {}) {
    try {
        const response = await fetch(`${API_URL}${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Cannot connect to the backend. Make sure FastAPI is running on port 10000.');
        }
        throw error;
    }
}

function showError(message) {
    alert(`Error: ${message}`);
}

function triggerConfetti() {
    // Simple confetti effect using emoji
    const confettiCount = 50;
    const confettiChars = ['🎉', '🎊', '✨', '🌟', '💫'];
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.textContent = confettiChars[Math.floor(Math.random() * confettiChars.length)];
        confetti.style.position = 'fixed';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-50px';
        confetti.style.fontSize = '24px';
        confetti.style.zIndex = '9999';
        confetti.style.pointerEvents = 'none';
        confetti.style.animation = `fall ${2 + Math.random() * 2}s linear`;
        
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 4000);
    }
}

// Add CSS animation for confetti
const style = document.createElement('style');
style.textContent = `
    @keyframes fall {
        to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Game Logic
async function startGame() {
    try {
        buttons.start.disabled = true;
        buttons.start.textContent = 'Starting...';
        
        const data = await apiPost('/start_game');
        
        gameState = data.state;
        
        showStats(true);
        showProgress(true);
        updateStats();
        updateProgress();
        
        elements.questionLabel.textContent = `Question ${gameState.question_count}`;
        elements.questionText.textContent = gameState.current_question;
        
        showScreen('questioning');
    } catch (error) {
        showError(error.message);
        buttons.start.disabled = false;
        buttons.start.textContent = '✨ Start Game';
    }
}

async function submitAnswer(answer) {
    try {
        // Disable all answer buttons during submission
        answerButtons.forEach(btn => btn.disabled = true);
        
        const data = await apiPost('/answer_question', {
            session_id: gameState.session_id,
            answer: answer
        });
        
        gameState = data.state;
        gameState.stage = data.next_stage;
        
        updateStats();
        updateProgress();
        
        if (gameState.stage === 'guessing') {
            showProgress(false);
            showScreen('guessing');
            await makeGuess();
        } else {
            elements.questionLabel.textContent = `Question ${gameState.question_count}`;
            elements.questionText.textContent = gameState.current_question;
            // Re-enable answer buttons
            answerButtons.forEach(btn => btn.disabled = false);
        }
    } catch (error) {
        showError(error.message);
        // Re-enable answer buttons on error
        answerButtons.forEach(btn => btn.disabled = false);
    }
}

function forceGuess() {
    gameState.stage = 'guessing';
    showProgress(false);
    showScreen('guessing');
    makeGuess();
}

async function makeGuess() {
    try {
        elements.thinkingSpinner.style.display = 'block';
        elements.guessReveal.style.display = 'none';
        elements.guessButtons.style.display = 'none';
        
        const data = await apiPost('/make_guess', {
            session_id: gameState.session_id,
            answer: ''
        });
        
        gameState.guess_count = data.guess_count;
        gameState.final_guess = data.guess;
        
        updateStats();
        
        elements.thinkingSpinner.style.display = 'none';
        elements.guessName.textContent = gameState.final_guess;
        elements.guessReveal.style.display = 'block';
        elements.guessButtons.style.display = 'flex';
    } catch (error) {
        showError(error.message);
        elements.thinkingSpinner.style.display = 'none';
    }
}

function handleCorrectGuess() {
    triggerConfetti();
    gameState.result_message = `I correctly guessed **${gameState.final_guess}**!`;
    gameState.result_win = true;
    gameState.stage = 'finished';
    showFinished();
}

function handleWrongGuess() {
    gameState.guess_count++;
    updateStats();
    
    if (gameState.guess_count < MAX_GUESSES) {
        gameState.final_guess = null;
        elements.guessButtons.style.display = 'none';
        elements.guessReveal.style.display = 'none';
        makeGuess();
    } else {
        // Show input to get correct answer
        elements.guessButtons.style.display = 'none';
        elements.revealAnswerSection.style.display = 'block';
    }
}

function submitCorrectAnswer() {
    const correctAnswer = elements.correctAnswerInput.value.trim();
    
    if (!correctAnswer) {
        alert('Please enter the character name');
        return;
    }
    
    gameState.result_message = `Thank you for teaching me! The correct answer was: **${correctAnswer}**. I'll learn from this! 🎓`;
    gameState.result_win = false;
    gameState.stage = 'finished';
    gameState.correct_answer = correctAnswer;
    
    // Log for learning (in a real app, this would be sent to a database)
    console.log('Learning data:', {
        session_id: gameState.session_id,
        history: gameState.history,
        ai_guesses: [gameState.final_guess],
        correct_answer: correctAnswer,
        timestamp: new Date().toISOString()
    });
    
    showFinished();
}

function showFinished() {
    const bannerClass = gameState.result_win ? 'finish-win' : 'finish-lose';
    const icon = gameState.result_win ? '🎉' : '🎓';
    
    elements.finishBanner.className = `finish-banner ${bannerClass}`;
    elements.finishIcon.textContent = icon;
    elements.finishMessage.innerHTML = gameState.result_message || 'Game Over';
    
    // Build history
    let historyHTML = '';
    for (const msg of gameState.history) {
        if (msg.role === 'system') continue;
        
        if (msg.role === 'assistant') {
            try {
                const cleaned = msg.content.replace(/```json/g, '').replace(/```/g, '').trim();
                const data = JSON.parse(cleaned);
                const text = data.question || msg.content;
                historyHTML += `<div class="history-item"><strong>🧠 Psionist:</strong> ${text}</div>`;
            } catch {
                historyHTML += `<div class="history-item"><strong>🧠 Psionist:</strong> ${msg.content}</div>`;
            }
        } else {
            // Extract answer from user message
            const content = msg.content;
            if (content.includes('|')) {
                const parts = content.split('|');
                if (parts.length >= 2) {
                    const answer = parts[1].replace('A:', '').trim();
                    historyHTML += `<div class="history-item"><strong>👤 You:</strong> ${answer}</div>`;
                }
            } else {
                historyHTML += `<div class="history-item"><strong>👤 You:</strong> ${content}</div>`;
            }
        }
    }
    
    elements.historyContent.innerHTML = historyHTML || '<p style="color: #9ca3af;">No history available.</p>';
    
    showScreen('finished');
}

function playAgain() {
    gameState = {
        session_id: null,
        question_count: 0,
        current_question: 'Click Start Game to begin!',
        stage: 'start',
        history: [],
        guess_count: 0,
        final_guess: null,
        result_message: null,
        result_win: false
    };
    
    showStats(false);
    showProgress(false);
    buttons.start.disabled = false;
    buttons.start.textContent = '✨ Start Game';
    answerButtons.forEach(btn => btn.disabled = false);
    
    showScreen('start');
}

// Event Listeners
buttons.start.addEventListener('click', startGame);
buttons.forceGuess.addEventListener('click', forceGuess);
buttons.correct.addEventListener('click', handleCorrectGuess);
buttons.wrong.addEventListener('click', handleWrongGuess);
buttons.submitAnswer.addEventListener('click', submitCorrectAnswer);
buttons.playAgain.addEventListener('click', playAgain);

// Add click handlers to all answer buttons
answerButtons.forEach(button => {
    button.addEventListener('click', () => {
        const answer = button.getAttribute('data-answer');
        submitAnswer(answer);
    });
});

// Allow Enter key to submit correct answer
elements.correctAnswerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        submitCorrectAnswer();
    }
});

