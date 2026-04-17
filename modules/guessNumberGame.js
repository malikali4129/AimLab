function randomNumberBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createTonePlayer() {
  let context;

  function getContext() {
    if (!context) {
      const AudioContextRef = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextRef) {
        return null;
      }
      context = new AudioContextRef();
    }
    if (context.state === "suspended") {
      context.resume();
    }
    return context;
  }

  function playTone({ frequency, duration = 0.15, type = "sine", gain = 0.04, delay = 0 }) {
    const ctx = getContext();
    if (!ctx) return;

    const start = ctx.currentTime + delay;
    const end = start + duration;

    const oscillator = ctx.createOscillator();
    const amp = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(amp);
    amp.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
  }

  return {
    playFail() {
      playTone({ frequency: 188, duration: 0.11, type: "sawtooth", gain: 0.03 });
      playTone({ frequency: 150, duration: 0.1, type: "triangle", gain: 0.025, delay: 0.09 });
    },
    playWin() {
      playTone({ frequency: 392, duration: 0.14, type: "sine", gain: 0.045 });
      playTone({ frequency: 523.25, duration: 0.18, type: "sine", gain: 0.05, delay: 0.1 });
      playTone({ frequency: 659.25, duration: 0.22, type: "sine", gain: 0.055, delay: 0.22 });
    }
  };
}

function initGuessNumberGame(root) {
  if (!root) return;

  root.innerHTML = `
    <div class="guess-minimal-card">
      <h3 class="glitch guess-neon-title" data-text="GUESS NUMBER">GUESS NUMBER</h3>
      <p id="guess-result" class="guess-status-text" aria-live="polite">Enter a number from 1 to 100</p>
      <div class="guess-meta-row">
        <div class="time-pill"><strong id="guess-attempts">0</strong><span>attempts</span></div>
      </div>
      <div class="guess-input-row">
        <input id="guess-input" class="download-input" type="number" min="1" max="100" inputmode="numeric" placeholder="1 to 100" />
        <button type="button" class="cta-button" data-submit-guess>Submit</button>
      </div>
      <button type="button" class="ghost-button guess-retry" data-retry-guess>Retry</button>
    </div>
  `;

  const titleNode = root.querySelector(".guess-neon-title");
  const guessInput = root.querySelector("#guess-input");
  const resultNode = root.querySelector("#guess-result");
  const attemptsNode = root.querySelector("#guess-attempts");
  const submitGuessButton = root.querySelector("[data-submit-guess]");
  const retryButton = root.querySelector("[data-retry-guess]");

  const sounds = createTonePlayer();
  let secret = randomNumberBetween(1, 100);
  let attempts = 0;
  let gameOver = false;

  function setTitle(text) {
    titleNode.textContent = text;
    titleNode.setAttribute("data-text", text);
  }

  function shakeCard() {
    const card = root.querySelector(".guess-minimal-card");
    card.classList.remove("is-shaking");
    void card.offsetWidth;
    card.classList.add("is-shaking");
  }

  function setResult(message, tone = "neutral") {
    resultNode.textContent = message;
    resultNode.className = `guess-status-text is-${tone}`;
  }

  function resetGame(message = "Enter a number from 1 to 100") {
    secret = randomNumberBetween(1, 100);
    attempts = 0;
    gameOver = false;
    attemptsNode.textContent = "0";
    guessInput.value = "";
    document.body.classList.remove("guess-win-state");
    setTitle("GUESS NUMBER");
    setResult(message, "neutral");
    guessInput.focus();
  }

  function evaluateHint(guess) {
    const difference = Math.abs(secret - guess);
    if (guess < secret) {
      if (difference <= 2) return "Very close, please try a little higher";
      if (difference <= 7) return "Close, try higher";
      if (difference >= 25) return "Too low, go much higher";
      return "Please try higher number";
    }

    if (difference <= 2) return "Very close, please try a little lower";
    if (difference <= 7) return "Close, try lower";
    if (difference >= 25) return "Too high, go much lower";
    return "Please try lower number";
  }

  submitGuessButton.addEventListener("click", () => {
    if (gameOver) {
      resetGame();
      return;
    }

    const raw = guessInput.value.trim();
    if (!raw) {
      setTitle("WAIT");
      setResult("Enter a number first", "warn");
      shakeCard();
      sounds.playFail();
      return;
    }

    const guess = Number.parseInt(raw, 10);
    if (!Number.isInteger(guess)) {
      setTitle("INVALID");
      setResult("Enter a valid whole number", "warn");
      shakeCard();
      sounds.playFail();
      return;
    }

    if (guess < 1 || guess > 100) {
      setTitle("OUT OF RANGE");
      setResult("Enter a number between 1 and 100", "warn");
      shakeCard();
      sounds.playFail();
      return;
    }

    attempts += 1;
    attemptsNode.textContent = String(attempts);

    if (guess > secret) {
      setTitle("LOWER");
      setResult(evaluateHint(guess), "warn");
      shakeCard();
      sounds.playFail();
      return;
    }

    if (guess < secret) {
      setTitle("HIGHER");
      setResult(evaluateHint(guess), "warn");
      shakeCard();
      sounds.playFail();
      return;
    }

    gameOver = true;
    document.body.classList.add("guess-win-state");
    setTitle("YOU WON");
    setResult(`Correct in ${attempts} attempts. Press Retry for a new round.`, "win");
    sounds.playWin();
  });

  guessInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      submitGuessButton.click();
    }
  });

  retryButton.addEventListener("click", () => {
    resetGame("New round started. Enter a number from 1 to 100");
  });

  resetGame();
}

window.initGuessNumberGame = initGuessNumberGame;
