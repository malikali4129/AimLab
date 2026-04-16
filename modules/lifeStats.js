const MS_SECOND = 1000;
const MS_MINUTE = 60 * MS_SECOND;
const MS_HOUR = 60 * MS_MINUTE;
const MS_DAY = 24 * MS_HOUR;
const DAYS_PER_YEAR = 365.2425;
const MOON_CYCLE_DAYS = 29.530588;

const HEARTBEATS_PER_SECOND = 1.2;
const BREATHS_PER_SECOND = 0.27;
const BLINKS_PER_SECOND = 0.28;

const fastNumber = new Intl.NumberFormat("en-US");
const decimalNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

const STAT_DEFINITIONS = [
  {
    id: "days",
    title: "Days Alive",
    visual: "calendar",
    updater: "slow",
    prefix: "A lot has happened in the ",
    value: (s) => fastNumber.format(s.daysAlive),
    suffix: " days since you were born.",
    rateLabel: "Daily milestone"
  },
  {
    id: "seconds",
    title: "Seconds Lived",
    visual: "clock",
    updater: "fast",
    prefix: "You have experienced around ",
    value: (s) => fastNumber.format(s.secondsAlive),
    suffix: " seconds of life.",
    rateLabel: "Updates every second"
  },
  {
    id: "heartbeats",
    title: "Heart Beat",
    visual: "pulse",
    updater: "fast",
    prefix: "Your heart has beaten about ",
    value: (s) => fastNumber.format(s.heartbeats),
    suffix: " times so far.",
    rateLabel: `~${HEARTBEATS_PER_SECOND.toFixed(1)} beats/sec`
  },
  {
    id: "breaths",
    title: "Lung Breaths",
    visual: "lungs",
    updater: "fast",
    prefix: "You have taken about ",
    value: (s) => fastNumber.format(s.breaths),
    suffix: " breaths.",
    rateLabel: `~${BREATHS_PER_SECOND.toFixed(2)} breaths/sec`
  },
  {
    id: "blood",
    title: "Red Blood Cells",
    visual: "blood",
    updater: "fast",
    prefix: "Your body has produced about ",
    value: (s) => fastNumber.format(s.bloodCells),
    suffix: " red blood cells.",
    rateLabel: "Modeled biological estimate"
  },
  {
    id: "sleep",
    title: "Sleep Hours",
    visual: "sleep",
    updater: "slow",
    prefix: "You have spent roughly ",
    value: (s) => fastNumber.format(s.sleepHours),
    suffix: " hours sleeping.",
    rateLabel: "Assumes one-third of time asleep"
  },
  {
    id: "blinks",
    title: "Blink Count",
    visual: "eye",
    updater: "fast",
    prefix: "You have blinked around ",
    value: (s) => fastNumber.format(s.blinks),
    suffix: " times.",
    rateLabel: `~${BLINKS_PER_SECOND.toFixed(2)} blinks/sec`
  },
  {
    id: "steps",
    title: "Steps Walked",
    visual: "steps",
    updater: "slow",
    prefix: "If your pace is average, you have walked about ",
    value: (s) => fastNumber.format(s.steps),
    suffix: " steps.",
    rateLabel: "Estimated with 6,000 steps/day"
  },
  {
    id: "water",
    title: "Water Intake",
    visual: "water",
    updater: "slow",
    prefix: "You have likely consumed about ",
    value: (s) => fastNumber.format(s.waterLiters),
    suffix: " liters of water.",
    rateLabel: "Estimated with 2.3L/day"
  },
  {
    id: "weekends",
    title: "Weekend Days",
    visual: "weekend",
    updater: "slow",
    prefix: "You have lived through around ",
    value: (s) => fastNumber.format(s.weekendDays),
    suffix: " weekend days.",
    rateLabel: "Two out of seven days"
  },
  {
    id: "moons",
    title: "Moon Cycles",
    visual: "moon",
    updater: "slow",
    prefix: "The moon has completed about ",
    value: (s) => decimalNumber.format(s.moonCycles),
    suffix: " cycles in your lifetime.",
    rateLabel: "Synodic month estimate"
  },
  {
    id: "seasons",
    title: "Seasons Passed",
    visual: "season",
    updater: "slow",
    prefix: "You have passed through nearly ",
    value: (s) => fastNumber.format(s.seasons),
    suffix: " seasons.",
    rateLabel: "Four seasons each year"
  },
  {
    id: "birthdays",
    title: "Birthdays Celebrated",
    visual: "cake",
    updater: "slow",
    prefix: "You have celebrated ",
    value: (s) => fastNumber.format(s.birthdays),
    suffix: " birthdays.",
    rateLabel: "Yearly milestone"
  },
  {
    id: "orbit",
    title: "Solar Orbits",
    visual: "orbit",
    updater: "slow",
    prefix: "You have traveled around the sun about ",
    value: (s) => decimalNumber.format(s.yearsAlive),
    suffix: " times.",
    rateLabel: "Earth orbit count"
  },
  {
    id: "next-birthday",
    title: "Next Birthday",
    visual: "countdown",
    updater: "fast",
    prefix: "Your next birthday is in ",
    value: (s) => s.nextBirthdayCountdown,
    suffix: ".",
    rateLabel: "Live countdown"
  }
];

function isValidDob(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false;
  const now = Date.now();
  const min = new Date(1900, 0, 1).getTime();
  return date.getTime() >= min && date.getTime() < now;
}

function parseDob(month, day, year) {
  const m = Number.parseInt(month, 10);
  const d = Number.parseInt(day, 10);
  const y = Number.parseInt(year, 10);
  if (!Number.isInteger(m) || !Number.isInteger(d) || !Number.isInteger(y)) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900) return null;

  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return isValidDob(date) ? date : null;
}

function getBirthdaysCount(dob, now) {
  let count = now.getFullYear() - dob.getFullYear();
  const thisYearBirthday = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
  if (now < thisYearBirthday) {
    count -= 1;
  }
  return Math.max(0, count);
}

function getNextBirthday(dob, now) {
  const thisYearBirthday = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
  if (now <= thisYearBirthday) {
    return thisYearBirthday;
  }
  return new Date(now.getFullYear() + 1, dob.getMonth(), dob.getDate());
}

function formatCountdown(ms) {
  const safeMs = Math.max(0, ms);
  const days = Math.floor(safeMs / MS_DAY);
  const hours = Math.floor((safeMs % MS_DAY) / MS_HOUR);
  const minutes = Math.floor((safeMs % MS_HOUR) / MS_MINUTE);
  const seconds = Math.floor((safeMs % MS_MINUTE) / MS_SECOND);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function getLifeSnapshot(dob, now) {
  const elapsedMs = Math.max(0, now.getTime() - dob.getTime());
  const elapsedSeconds = elapsedMs / MS_SECOND;
  const secondsAlive = Math.floor(elapsedSeconds);
  const minutesAlive = elapsedMs / MS_MINUTE;
  const hoursAlive = Math.floor(elapsedMs / MS_HOUR);
  const daysAlive = Math.floor(elapsedMs / MS_DAY);
  const yearsAlive = elapsedMs / (DAYS_PER_YEAR * MS_DAY);

  const nextBirthday = getNextBirthday(dob, now);
  const nextBirthdayMs = Math.max(0, nextBirthday.getTime() - now.getTime());

  return {
    secondsAlive,
    daysAlive,
    yearsAlive,
    heartbeats: Math.floor(elapsedSeconds * HEARTBEATS_PER_SECOND),
    breaths: Math.floor(elapsedSeconds * BREATHS_PER_SECOND),
    bloodCells: Math.floor(secondsAlive * 2400000),
    sleepHours: Math.floor(hoursAlive * 0.33),
    blinks: Math.floor(elapsedSeconds * BLINKS_PER_SECOND),
    steps: Math.floor(daysAlive * 6000),
    waterLiters: Math.floor(daysAlive * 2.3),
    weekendDays: Math.floor(daysAlive * (2 / 7)),
    moonCycles: daysAlive / MOON_CYCLE_DAYS,
    seasons: Math.floor(yearsAlive * 4),
    birthdays: getBirthdaysCount(dob, now),
    nextBirthdayCountdown: formatCountdown(nextBirthdayMs),
    nextBirthday
  };
}

function createVisualMarkup(type, dob) {
  if (type === "calendar") {
    const weekday = dob.toLocaleDateString(undefined, { weekday: "long" });
    const month = dob.toLocaleDateString(undefined, { month: "short" });
    return `
      <article class="life-stats-calendar-card">
        <header>${weekday}</header>
        <div class="life-stats-calendar-day">${dob.getDate()}</div>
        <footer>${month} ${dob.getFullYear()}</footer>
      </article>
    `;
  }

  if (type === "blood") {
    return `
      <div class="life-stats-blood-wrap" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span>
      </div>
    `;
  }

  if (type === "pulse") {
    return `
      <div class="life-stats-pulse-wrap" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
    `;
  }

  return `<div class="life-stats-icon-wrap" aria-hidden="true">${visualEmoji(type)}</div>`;
}

function animateDial(dialElement, newValue) {
  if (!dialElement) return;

  const next = String(newValue);
  const previous = dialElement.dataset.value || "";

  if (!previous) {
    const first = document.createElement("span");
    first.className = "life-stats-dial-item is-current";
    first.textContent = next;
    dialElement.innerHTML = "";
    dialElement.appendChild(first);
    dialElement.dataset.value = next;
    return;
  }

  if (previous === next) {
    return;
  }

  const currentNode = dialElement.querySelector(".life-stats-dial-item.is-current");
  if (currentNode) {
    currentNode.classList.remove("is-current");
    currentNode.classList.add("is-leaving");
    window.setTimeout(() => {
      if (currentNode.parentElement === dialElement) {
        currentNode.remove();
      }
    }, 320);
  }

  const incoming = document.createElement("span");
  incoming.className = "life-stats-dial-item is-entering";
  incoming.textContent = next;
  dialElement.appendChild(incoming);
  requestAnimationFrame(() => {
    incoming.classList.remove("is-entering");
    incoming.classList.add("is-current");
  });

  dialElement.dataset.value = next;
}

function visualEmoji(type) {
  const map = {
    clock: "⏱️",
    lungs: "🫁",
    sleep: "🌙",
    eye: "👁️",
    steps: "👣",
    water: "💧",
    weekend: "🎉",
    moon: "🌕",
    season: "🍃",
    cake: "🎂",
    orbit: "🌍",
    countdown: "🎈"
  };
  return map[type] || "✨";
}

function createLifeStatsModule(root) {
  if (!root) return;

  const sectionMap = new Map();
  let activeStatId = STAT_DEFINITIONS[0].id;
  let currentDob = null;
  let updateTimer = null;
  let observer = null;
  let closeTimer = null;
  let isClosing = false;

  root.innerHTML = `
    <section class="life-stats-shell">
      <article class="life-stats-gate" data-life-stats-gate>
        <p class="life-stats-avatar" aria-hidden="true">🧑</p>
        <h3>Life Stats</h3>
        <p class="life-stats-gate-copy">Your Birthdate:</p>

        <form class="life-stats-form" data-life-stats-form novalidate>
          <div class="life-stats-fields">
            <input class="download-input" type="number" min="1" max="12" inputmode="numeric" placeholder="Month" aria-label="Birth month" data-life-month required />
            <input class="download-input" type="number" min="1" max="31" inputmode="numeric" placeholder="Day" aria-label="Birth day" data-life-day required />
            <input class="download-input" type="number" min="1900" max="2100" inputmode="numeric" placeholder="Year" aria-label="Birth year" data-life-year required />
          </div>
          <button type="submit" class="cta-button life-stats-go">Go >>></button>
          <p class="life-stats-note">All values are dynamic estimates for educational use.</p>
          <p class="about-form-status" data-life-status aria-live="polite"></p>
        </form>
      </article>

      <section class="life-stats-overlay" data-life-stats-overlay hidden aria-hidden="true">
        <header class="life-stats-overlay-head">
          <p class="life-stats-overlay-title">Life Stats Timeline</p>
          <button type="button" class="life-stats-close" data-life-stats-close aria-label="Close Life Stats">✕</button>
        </header>

        <div class="life-stats-overlay-scroll" data-life-stats-scroll>
          <div class="life-stats-story" data-life-stats-story>
            <div class="life-stats-progress" data-life-progress aria-hidden="true"></div>
            <div class="life-stats-sections" data-life-sections></div>
          </div>
        </div>
      </section>
    </section>
  `;

  const gate = root.querySelector("[data-life-stats-gate]");
  const form = root.querySelector("[data-life-stats-form]");
  const status = root.querySelector("[data-life-status]");
  const overlay = root.querySelector("[data-life-stats-overlay]");
  const closeButton = root.querySelector("[data-life-stats-close]");
  const overlayScroll = root.querySelector("[data-life-stats-scroll]");
  const story = root.querySelector("[data-life-stats-story]");
  const sectionsRoot = root.querySelector("[data-life-sections]");
  const progress = root.querySelector("[data-life-progress]");
  const monthInput = root.querySelector("[data-life-month]");
  const dayInput = root.querySelector("[data-life-day]");
  const yearInput = root.querySelector("[data-life-year]");

  function setStatus(message, tone) {
    status.textContent = message;
    status.dataset.state = tone;
  }

  function clearRuntime() {
    if (updateTimer) {
      window.clearInterval(updateTimer);
      updateTimer = null;
    }
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  function updateProgressDots() {
    const nodes = [...progress.querySelectorAll("button")];
    nodes.forEach((node) => {
      node.classList.toggle("is-active", node.dataset.statId === activeStatId);
    });
  }

  function updateSection(statId, now) {
    const row = sectionMap.get(statId);
    if (!row || !currentDob) return;

    const snapshot = getLifeSnapshot(currentDob, now);
    row.title.textContent = row.definition.title;
    row.prefix.textContent = row.definition.prefix;
    row.suffix.textContent = row.definition.suffix;
    row.rate.textContent = row.definition.rateLabel;
    animateDial(row.dial, row.definition.value(snapshot));

    if (row.definition.id === "next-birthday") {
      row.meta.textContent = `Target: ${snapshot.nextBirthday.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}`;
      return;
    }

    row.meta.textContent = `Updated: ${now.toLocaleTimeString()}`;
  }

  function tick() {
    const now = new Date();
    const active = sectionMap.get(activeStatId);
    if (!active) return;

    updateSection(activeStatId, now);

    const shouldSlowUpdate = now.getSeconds() % 15 === 0;
    if (!shouldSlowUpdate) {
      return;
    }

    sectionMap.forEach((entry, id) => {
      if (id !== activeStatId && entry.definition.updater === "slow") {
        updateSection(id, now);
      }
    });
  }

  function buildStory() {
    sectionsRoot.innerHTML = "";
    progress.innerHTML = "";
    sectionMap.clear();

    STAT_DEFINITIONS.forEach((definition, index) => {
      const section = document.createElement("article");
      section.className = "life-stats-section";
      section.dataset.statId = definition.id;
      section.innerHTML = `
        <div class="life-stats-visual life-stats-visual-${definition.visual}">
          ${createVisualMarkup(definition.visual, currentDob)}
        </div>
        <div class="life-stats-text">
          <p class="life-stats-title">${definition.title}</p>
          <p class="life-stats-rate">${definition.rateLabel}</p>
          <p class="life-stats-statement">
            <span class="life-stats-prefix"></span>
            <span class="life-stats-dial" data-life-dial></span>
            <span class="life-stats-suffix"></span>
          </p>
          <p class="life-stats-meta">Calculating...</p>
        </div>
      `;

      const title = section.querySelector(".life-stats-title");
      const rate = section.querySelector(".life-stats-rate");
      const prefix = section.querySelector(".life-stats-prefix");
      const dial = section.querySelector("[data-life-dial]");
      const suffix = section.querySelector(".life-stats-suffix");
      const meta = section.querySelector(".life-stats-meta");

      sectionMap.set(definition.id, {
        definition,
        section,
        title,
        rate,
        prefix,
        dial,
        suffix,
        meta
      });

      sectionsRoot.appendChild(section);

      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "life-stats-dot";
      dot.dataset.statId = definition.id;
      dot.setAttribute("aria-label", `Jump to stat ${index + 1}`);
      dot.addEventListener("click", () => {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      progress.appendChild(dot);
    });

    observer = new IntersectionObserver(
      (entries) => {
        let topEntry = null;
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          if (!topEntry || entry.intersectionRatio > topEntry.intersectionRatio) {
            topEntry = entry;
          }
        });

        if (!topEntry) return;

        activeStatId = topEntry.target.dataset.statId;
        sectionMap.forEach((item, id) => {
          item.section.classList.toggle("is-active", id === activeStatId);
        });
        updateProgressDots();
        updateSection(activeStatId, new Date());
      },
      {
        root: overlayScroll,
        threshold: [0.5, 0.65, 0.8],
        rootMargin: "-8% 0px -18% 0px"
      }
    );

    sectionMap.forEach((entry) => observer.observe(entry.section));

    activeStatId = STAT_DEFINITIONS[0].id;
    sectionMap.forEach((item, id) => {
      item.section.classList.toggle("is-active", id === activeStatId);
    });
    updateProgressDots();

    const now = new Date();
    sectionMap.forEach((entry, id) => {
      if (id === activeStatId || entry.definition.updater === "slow") {
        updateSection(id, now);
      }
    });
  }

  function startStory(dob) {
    currentDob = dob;
    isClosing = false;
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }
    gate.hidden = true;
    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("life-stats-overlay-open");
    requestAnimationFrame(() => {
      overlay.classList.add("is-open");
    });
    overlayScroll.scrollTop = 0;

    clearRuntime();
    buildStory();
    updateTimer = window.setInterval(tick, 1000);
    tick();
  }

  function closeStory() {
    if (isClosing) return;
    isClosing = true;
    clearRuntime();
    overlay.classList.remove("is-open");
    closeTimer = window.setTimeout(() => {
      overlay.hidden = true;
      overlay.setAttribute("aria-hidden", "true");
      gate.hidden = false;
      document.body.classList.remove("life-stats-overlay-open");
      isClosing = false;
    }, 220);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const dob = parseDob(monthInput.value, dayInput.value, yearInput.value);
    if (!dob) {
      setStatus("Enter a valid date of birth (MM/DD/YYYY).", "error");
      return;
    }

    setStatus("", "success");
    startStory(dob);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && currentDob && !overlay.hidden) {
      tick();
    }
  });

  function handleCloseInteraction(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    closeStory();
  }

  closeButton.addEventListener("click", handleCloseInteraction);
  closeButton.addEventListener("touchend", handleCloseInteraction, { passive: false });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) {
      closeStory();
    }
  });

  root.addEventListener("remove", clearRuntime);
}

window.initLifeStats = createLifeStatsModule;
