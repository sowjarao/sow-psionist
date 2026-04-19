# RTRP_PROJECT - Psionist 🧠

Psionist is an intelligent mind deduction game (similar to Akinator) that uses AI to guess the character you're thinking of by asking strategic yes/no questions.

## Project Structure

```
RTRP_PROJECT/
├── server.js               # Node.js Express backend
├── index.html              # Main HTML file
├── styles.css              # Styling
├── app.js                  # Frontend JavaScript logic
├── package.json            # npm configuration
├── .env                    # Environment variables (GROQ_API_KEY)
├── .gitignore              # Git ignore file
└── README.md               # This file
```

## Features

- 🎯 AI-powered character guessing using Groq LLM
- 💬 Strategic yes/no questioning system
- 🎨 Beautiful gradient UI with smooth animations
- 📊 Real-time progress tracking
- 🎉 Confetti celebration on correct guesses
- 📜 Conversation history viewer
- 📱 Responsive design for mobile and desktop
- 🚀 Full-stack Node.js application

## Prerequisites

- Node.js 14+ and npm
- Groq API key (get one at https://console.groq.com)

## Setup Instructions

### 1. Install Dependencies

```bash
# Install all npm dependencies
npm install
```

### 2. Configure Environment Variables

Create or edit the `.env` file in the root directory:

```bash
GROQ_API_KEY=your_groq_api_key_here
PORT=10000
```

Replace `your_groq_api_key_here` with your actual Groq API key.

## Running the Application

### Start the Server

```bash
# Production mode
npm start

# Development mode (with auto-reload)
npm run dev
```

The application will be available at `http://localhost:10000`

The server serves both the backend API and frontend static files, so you only need to run one command!

## How to Play

1. Open `http://localhost:10000` in your browser
2. Think of any real or fictional character (person, superhero, historical figure, movie character, etc.)
3. Click "Start Game" to begin
4. Answer Psionist's yes/no questions honestly
5. Psionist will try to guess your character in up to 20 questions and 3 guesses
6. Confirm if the guess is correct or let Psionist try again

## API Endpoints

- `GET /` - Serves the frontend and health check
- `POST /start_game` - Initialize a new game session
- `POST /answer_question` - Submit an answer to the current question
- `POST /make_guess` - Request the AI to make a guess

## Technologies Used

### Backend
- **Express.js** - Fast, minimalist web framework for Node.js
- **Groq API** - Fast LLM inference API
- **dotenv** - Environment variable management
- **CORS** - Cross-Origin Resource Sharing middleware

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling with gradients and animations
- **Vanilla JavaScript** - Game logic and API communication

## Configuration

### Backend Configuration
Edit `server.js` to modify:
- `MAX_QUESTIONS = 20` - Maximum questions before forcing a guess
- `AUTO_GUESS_AFTER = 10` - Questions before auto-switching to guess mode
- `MAX_GUESSES = 3` - Maximum number of guesses allowed
- `MODEL = "llama-3.3-70b-versatile"` - LLM model to use
- `PORT = 10000` - Server port (can also be set in .env)

### Frontend Configuration
Edit `app.js` to modify:
- `API_URL = 'http://localhost:10000'` - Backend API URL
- `MAX_GUESSES = 3` - Maximum guesses (should match backend)

## Project Files

### Core Files
- **server.js** - Express backend with Groq API integration
- **index.html** - Main HTML structure with all game screens
- **styles.css** - Complete styling with animations and responsive design
- **app.js** - Frontend game logic and API communication
- **package.json** - npm dependencies and scripts
- **.env** - Environment variables (not committed to git)

## Troubleshooting

### Server won't start
- Ensure all dependencies are installed: `npm install`
- Check that your GROQ_API_KEY is set in `.env`
- Verify port 8000 is not in use (or change PORT in .env)
- Check Node.js version: `node --version` (should be 14+)

### Game not working properly
- Open browser developer console (F12) to check for errors
- Ensure you have a stable internet connection (required for Groq API)
- Try refreshing the page and starting a new game
- Check server logs in the terminal for error messages

### API Key Issues
- Verify your Groq API key is valid at https://console.groq.com
- Make sure the key is properly set in the `.env` file
- Restart the server after changing the `.env` file

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses nodemon to automatically restart the server when you make changes to `server.js`.

### Project Structure Explanation

```
RTRP_PROJECT/
├── server.js          # Backend API + serves static files
├── index.html         # Frontend HTML
├── styles.css         # Frontend CSS
├── app.js            # Frontend JavaScript
├── package.json      # Dependencies & scripts
├── .env             # Environment variables
├── .gitignore       # Git ignore patterns
└── README.md        # Documentation
```

### Building for Production

For production deployment:

1. **Set environment variables** on your hosting platform:
   - `GROQ_API_KEY` - Your Groq API key
   - `PORT` - Server port (usually provided by hosting platform)

2. **Deploy to hosting service** (e.g., Railway, Render, Heroku):
   ```bash
   # Example for Railway
   railway up
   
   # Example for Render
   # Connect your GitHub repo and it will auto-deploy
   ```

3. **Update frontend API URL** if needed:
   - If backend is on a different domain, update `API_URL` in `app.js`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GROQ_API_KEY` | Your Groq API key (required) | - |
| `PORT` | Server port | 10000 |

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the server in production mode |
| `npm run dev` | Start the server with auto-reload (development) |

## License

MIT

## Credits

Built with ❤️ using:
- Groq's fast LLM inference
- Express.js for the backend
- Modern vanilla JavaScript for the frontend
- Beautiful gradient design inspired by modern web aesthetics

---

**Note:** The old Python FastAPI backend has been replaced with a Node.js Express backend for a unified npm-based stack.