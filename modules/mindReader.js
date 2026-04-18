const IP_GEO_API_URL = "https://api.ipgeolocation.io/ipgeo";
const IP_GEO_API_KEY = "c3813f2e823345888d6d03a9b83065e9";

function normalizeValue(value, fallback = "N/A") {
  if (value === null || value === undefined) {
    return fallback;
  }

  const text = String(value).trim();
  return text || fallback;
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function getDeviceType() {
  const ua = navigator.userAgent || "";
  if (/tablet|ipad/i.test(ua)) return "Tablet";
  if (/mobi|android|iphone/i.test(ua)) return "Mobile";
  return "Desktop";
}

function getLocalTimeString() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

async function fetchGeoData() {
  const url = new URL(IP_GEO_API_URL);
  url.searchParams.set("apiKey", IP_GEO_API_KEY);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = await response.json();
  if (!data || typeof data !== "object") {
    throw new Error("Invalid API response");
  }

  return data;
}

function initMindReader(root) {
  if (!root) return;

  root.innerHTML = `
    <section class="oracle-cinematic" id="oracle-cinematic">
      <div class="oracle-noise" aria-hidden="true"></div>
      <div class="oracle-scanlines" aria-hidden="true"></div>
      <div class="oracle-flash" id="oracle-flash" aria-hidden="true"></div>
      <button type="button" class="oracle-pause-btn" id="oracle-pause-btn" aria-pressed="false">PAUSE</button>
      <div class="oracle-entry" id="oracle-entry">
        <button type="button" class="oracle-enter-btn" id="oracle-enter-btn" data-text="ENTER">ENTER</button>
        <p class="oracle-entry-tip">PRESS ENTER TO BEGIN TRANSMISSION</p>
      </div>
      <div class="oracle-stage" id="oracle-stage" aria-live="polite" aria-atomic="false"></div>
    </section>
  `;

  const stage = root.querySelector("#oracle-stage");
  const flashLayer = root.querySelector("#oracle-flash");
  const cinematic = root.querySelector("#oracle-cinematic");
  const pauseButton = root.querySelector("#oracle-pause-btn");
  const enterLayer = root.querySelector("#oracle-entry");
  const enterButton = root.querySelector("#oracle-enter-btn");

  let activeRun = 0;
  let started = false;
  let isPaused = false;

  function flash() {
    flashLayer.classList.remove("is-active");
    void flashLayer.offsetWidth;
    flashLayer.classList.add("is-active");
  }

  function createLine(className) {
    const line = document.createElement("p");
    line.className = `oracle-line ${className}`;

    const textNode = document.createElement("span");
    textNode.className = "oracle-line-text";

    const cursor = document.createElement("span");
    cursor.className = "oracle-cursor";

    line.append(textNode, cursor);
    stage.innerHTML = "";
    stage.appendChild(line);
    line.classList.add("is-visible");

    return { line, textNode, cursor };
  }

  function showHomePrompt() {
    const promptWrap = document.createElement("div");
    promptWrap.className = "oracle-line is-end is-visible";

    const link = document.createElement("a");
    link.className = "oracle-home-link";
    link.href = "index.html";
    link.textContent = "GO TO HOME PAGE";

    promptWrap.append(link);
    stage.appendChild(promptWrap);
  }

  async function waitWhilePaused(runId) {
    while (isPaused && runId === activeRun) {
      await wait(90);
    }
  }

  function setPaused(nextPaused) {
    if (!started) return;
    isPaused = nextPaused;
    cinematic.classList.toggle("is-paused", isPaused);
    pauseButton.textContent = isPaused ? "RESUME" : "PAUSE";
    pauseButton.setAttribute("aria-pressed", isPaused ? "true" : "false");
  }

  async function typeSceneLine({ text, className = "", speed = 56, hold = 2200, doFlash = false }, runId) {
    if (runId !== activeRun) return;

    const { textNode, cursor } = createLine(className);
    if (doFlash) {
      flash();
    }

    for (const char of text) {
      if (runId !== activeRun) {
        return;
      }

      await waitWhilePaused(runId);
      if (runId !== activeRun) {
        return;
      }

      textNode.textContent += char;
      await wait(speed + Math.random() * 28);
    }

    cursor.remove();

    let held = 0;
    while (held < hold) {
      await waitWhilePaused(runId);
      if (runId !== activeRun) {
        return;
      }
      const step = Math.min(90, hold - held);
      await wait(step);
      held += step;
    }
  }

  async function playStory() {
    activeRun += 1;
    const runId = activeRun;

    cinematic.classList.remove("is-ending");
    cinematic.classList.add("is-ready");

    const visitTime = getLocalTimeString();
    const deviceType = getDeviceType();

    let geo = null;
    try {
      geo = await fetchGeoData();
    } catch (error) {
      // Continue with fallback values.
    }

    const city = normalizeValue(geo?.city, "Unknown City");
    const region = normalizeValue(geo?.state_prov, "Unknown Region");
    const country = normalizeValue(geo?.country_name, "Unknown Country");
    const network = normalizeValue(geo?.organization || geo?.isp, "Unknown Network");

    const customLocation = city.toUpperCase() === "N/A"
      ? "RAWALPINDI"
      : city.toUpperCase();

    const scenes = [
      { text: "> BOOTING ORACLE CORE...", className: "is-quiet", hold: 1700 },
      { text: "> LINK STABLE. SUBJECT FOUND.", className: "is-quiet", hold: 1700 },
      { text: "YOU THOUGHT THIS WAS JUST A PAGE.", className: "is-reveal", hold: 2200, doFlash: true },
      { text: "IT WAS A MIRROR.", className: "is-reveal", hold: 2000 },
      { text: `I CAN HEAR YOUR SIGNAL FROM ${country.toUpperCase()}.`, className: "is-reveal", hold: 2400 },
      { text: `YOUR NETWORK SPEAKS IN SILENCE: ${network.toUpperCase()}.`, className: "is-quiet", hold: 2500 },
      { text: `YOU ARE FROM... ${customLocation} >`, className: "is-location", speed: 70, hold: 3200, doFlash: true },
      { text: `REGION: ${region.toUpperCase()}`, className: "is-quiet", hold: 1800 },
      { text: `VISIT TIME: ${visitTime} | DEVICE: ${deviceType.toUpperCase()}`, className: "is-quiet", speed: 48, hold: 2200 },
      { text: "NOT HACKING. JUST DATA, FEAR, AND TIMING.", className: "is-reveal", hold: 2400 },
      { text: "CONNECTION WILL TERMINATE NOW.", className: "is-end", hold: 1800, doFlash: true },
      { text: "[ SIGNAL LOST ]", className: "is-end", hold: 1200 }
    ];

    for (const scene of scenes) {
      await typeSceneLine(scene, runId);
    }

    if (runId === activeRun) {
      cinematic.classList.add("is-ending");
      showHomePrompt();
    }
  }

  async function startExperience() {
    if (started) return;
    started = true;
    enterButton.disabled = true;
    enterLayer.setAttribute("aria-hidden", "true");
    await playStory();
  }

  pauseButton.addEventListener("click", () => {
    setPaused(!isPaused);
  });

  enterButton.addEventListener("click", startExperience);
  enterLayer.addEventListener("click", (event) => {
    if (event.target === enterLayer) {
      startExperience();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      startExperience();
    }
  });
}

window.initMindReader = initMindReader;
window.initIpLookup = initMindReader;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("mind-reader-module");
    initMindReader(root);
  });
} else {
  const root = document.getElementById("mind-reader-module");
  initMindReader(root);
}
