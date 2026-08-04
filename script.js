const typedText = document.getElementById("typed-text");
const particleLayer = document.getElementById("particles");
const birthdayModuleRoot = document.getElementById("birthday-module");
const downloadSpeedModuleRoot = document.getElementById("download-speed-module");
const passwordModuleRoot = document.getElementById("password-module");
const gpaModuleRoot = document.getElementById("gpa-module");
const roasterModuleRoot = document.getElementById("roaster-module");
const wheelModuleRoot = document.getElementById("wheel-module");
const lifeProgressModuleRoot = document.getElementById("life-progress-module");
const aboutModuleRoot = document.getElementById("about-module");
const lifeStatsModuleRoot = document.getElementById("life-stats-module");
const guessNumberModuleRoot = document.getElementById("guess-number-module");
const mindReaderModuleRoot = document.getElementById("mind-reader-module");
const websitesModuleRoot = document.getElementById("websites-module");
const qrGeneratorModuleRoot = document.getElementById("qr-generator-module");
const moduleVersion = document.getElementById("module-version");
const menuBtn = document.getElementById("menu-btn");
const menuDropdown = document.getElementById("menu-dropdown");
let revealItems = [];
let isNavigating = false;

const MODULE_REGISTRY = [
  {
    href: "index.html",
    iconName: "home",
    shortTitle: "Home",
    menuTitle: "Home",
    color: "#5ffbff"
  },
  {
    href: "birthday.html",
    iconName: "cake",
    shortTitle: "Birthday",
    menuTitle: "Birthday",
    homeTitle: "Birthday Calculator",
    homeDescription: "Find your age and next birthday",
    color: "#ff73d9"
  },
  {
    href: "download-speed.html",
    iconName: "zap",
    shortTitle: "Download",
    menuTitle: "Download",
    homeTitle: "Download Speed Calculator",
    homeDescription: "Calculate download times",
    color: "#ffd166"
  },
  {
    href: "password-checker.html",
    iconName: "shield-check",
    shortTitle: "Password",
    menuTitle: "Password",
    homeTitle: "Password Strength Checker",
    homeDescription: "Check password strength and safety tips",
    color: "#74f7b3"
  },
  {
    href: "gpa-calculator.html",
    iconName: "graduation-cap",
    shortTitle: "GPA",
    menuTitle: "GPA",
    homeTitle: "GPA Calculator",
    homeDescription: "Calculate semester and cumulative GPA",
    color: "#9d7dff"
  },
  {
    href: "roaster.html",
    iconName: "flame",
    shortTitle: "Roaster",
    menuTitle: "Roaster",
    homeTitle: "Roaster Module",
    homeDescription: "Generate funny roasts with intensity controls",
    color: "#ff5252"
  },
  {
    href: "wheel.html",
    iconName: "dices",
    shortTitle: "Wheel",
    menuTitle: "Wheel Picker",
    homeTitle: "Wheel Picker",
    homeDescription: "Spin two name wheels and pick a winner",
    color: "#38ef7d"
  },
  {
    href: "guess-number.html",
    iconName: "target",
    shortTitle: "Guess",
    menuTitle: "Guess Number",
    homeTitle: "Guess Number Game",
    homeDescription: "Play your classic school C game in web module style",
    color: "#ff4365"
  },
  {
    href: "life-progress-tracker.html",
    iconName: "hourglass",
    shortTitle: "Tracker",
    menuTitle: "Life Tracker",
    homeTitle: "Life Progress Tracker",
    homeDescription: "Track clock cycles, events, moon phases, and long-horizon milestones",
    color: "#4cc9f0"
  },
  {
    href: "life-stats.html",
    iconName: "activity",
    shortTitle: "Stats",
    menuTitle: "Life Stats",
    homeTitle: "Life Stats",
    homeDescription: "Scroll through live stats calculated from your birth date",
    color: "#00f5d4"
  },
  {
    href: "mind-reader.html",
    iconName: "brain",
    shortTitle: "Mind Reader",
    menuTitle: "Mind Reader",
    homeTitle: "Mind Reader",
    homeDescription: "Cinematic oracle story with live geolocation reveal",
    color: "#b5179e"
  },
  {
    href: "websites.html",
    iconName: "globe",
    shortTitle: "Websites",
    menuTitle: "Websites",
    homeTitle: "Websites Directory",
    homeDescription: "Browse useful websites with text-based search and category filters",
    color: "#4895ef"
  },
  {
    href: "qr-generator.html",
    iconName: "qr-code",
    shortTitle: "QR",
    menuTitle: "QR Generator",
    homeTitle: "QR Code Generator",
    homeDescription: "Create stylish QR codes with logos, gradients, and design templates",
    color: "#a06cd5"
  },
  {
    href: "about.html",
    iconName: "user",
    shortTitle: "About",
    menuTitle: "About Me",
    homeTitle: "About Me",
    homeDescription: "Bio section with a functional contact form",
    color: "#f72585"
  }
];

const typingLines = [
  "Neural networks are thinking about lunch.",
  "Confidence level: dangerously unverified.",
  "Our AI reads emotions using vibes and guessing.",
  "The lab is running on sarcasm and caffeine."
];

const typingState = {
  lineIndex: 0,
  charIndex: 0,
  deleting: false
};

function initializePageTransitions() {
  revealItems = [...document.querySelectorAll("[data-reveal]")];
  revealItems.forEach((item, index) => {
    item.style.setProperty("--reveal-delay", `${220 + index * 90}ms`);
  });
}

async function loadModuleVersion() {
  if (!moduleVersion) {
    return;
  }

  try {
    const response = await fetch(`version.json?noCache=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`Failed to load version.json: ${response.status}`);
    }

    const versionData = await response.json();
    const version = versionData && typeof versionData.version === "string" ? versionData.version.trim() : "";
    if (version) {
      moduleVersion.textContent = version;
      moduleVersion.setAttribute("aria-label", `Version ${version}`);
    }
  } catch (error) {
    console.error(error);
  }
}

function renderSharedNavigation() {
  const currentPath = window.location.pathname;
  const shortcutNav = document.querySelector(".header-shortcuts");
  if (shortcutNav) {
    shortcutNav.innerHTML = MODULE_REGISTRY.map((module) => {
      const isActive = currentPath.endsWith(module.href) || (module.href === "index.html" && (currentPath.endsWith("/") || currentPath === ""));
      return `<a href="${module.href}" class="shortcut-icon ${isActive ? "active" : ""}" style="--app-color: ${module.color}" title="${module.shortTitle}" aria-label="${module.shortTitle}"><i data-lucide="${module.iconName}"></i></a>`;
    }).join("");
  }

  if (menuDropdown) {
    menuDropdown.innerHTML = MODULE_REGISTRY.map((module) => {
      const isActive = currentPath.endsWith(module.href) || (module.href === "index.html" && (currentPath.endsWith("/") || currentPath === ""));
      return `<a href="${module.href}" class="menu-item ${isActive ? "active" : ""}" style="--app-color: ${module.color}"><i data-lucide="${module.iconName}"></i> ${module.menuTitle}</a>`;
    }).join("");
  }

  const activeModule = MODULE_REGISTRY.find((m) => currentPath.endsWith(m.href));
  const topModuleIcon = document.querySelector(".topbar .module-icon");
  if (topModuleIcon && activeModule && activeModule.color) {
    topModuleIcon.style.setProperty("--app-color", activeModule.color);
  }

  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

function renderHomeCards() {
  const appsGrid = document.querySelector(".apps-grid");
  if (!appsGrid) {
    return;
  }

  const modulesForHome = MODULE_REGISTRY.filter((module) => module.homeTitle && module.homeDescription);
  appsGrid.innerHTML = modulesForHome
    .map(
      (module) => `
        <a class="app-card" href="${module.href}" style="--app-color: ${module.color}" data-reveal>
          <div class="app-icon-wrapper">
            <i data-lucide="${module.iconName}"></i>
          </div>
          <h3>${module.homeTitle}</h3>
          <p>${module.homeDescription}</p>
        </a>
      `
    )
    .join("");

  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

function finishPageTransitions() {
  document.body.classList.add("page-ready");
}

function updateTyping() {
  if (!typedText) {
    return;
  }

  const current = typingLines[typingState.lineIndex];
  if (!typingState.deleting) {
    typingState.charIndex += 1;
    typedText.textContent = current.slice(0, typingState.charIndex);
    if (typingState.charIndex === current.length) {
      typingState.deleting = true;
      setTimeout(updateTyping, 1300);
      return;
    }
  } else {
    typingState.charIndex -= 1;
    typedText.textContent = current.slice(0, typingState.charIndex);
    if (typingState.charIndex === 0) {
      typingState.deleting = false;
      typingState.lineIndex = (typingState.lineIndex + 1) % typingLines.length;
    }
  }

  setTimeout(updateTyping, typingState.deleting ? 32 : 44);
}

function createParticles() {
  if (!particleLayer) {
    return;
  }

  const count = window.innerWidth < 700 ? 16 : 28;
  for (let index = 0; index < count; index += 1) {
    const particle = document.createElement("span");
    particle.className = "particle";
    const size = 3 + Math.random() * 5;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDuration = `${10 + Math.random() * 16}s`;
    particle.style.animationDelay = `${Math.random() * 8}s`;
    particle.style.opacity = `${0.2 + Math.random() * 0.6}`;
    particleLayer.appendChild(particle);
  }
}

function setupMobileMenu() {
  if (!menuBtn || !menuDropdown) {
    return;
  }

  function closeMenu() {
    menuDropdown.classList.remove("open");
    menuBtn.classList.remove("active");
    menuBtn.setAttribute("aria-expanded", "false");
  }

  function openMenu() {
    menuDropdown.classList.add("open");
    menuBtn.classList.add("active");
    menuBtn.setAttribute("aria-expanded", "true");
  }

  function toggleMenu(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (menuDropdown.classList.contains("open")) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  menuBtn.addEventListener("click", toggleMenu);

  // Event delegation on menuDropdown links
  menuDropdown.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      closeMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (!menuDropdown.classList.contains("open")) {
      return;
    }
    if (!menuDropdown.contains(event.target) && !menuBtn.contains(event.target)) {
      closeMenu();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuDropdown.classList.contains("open")) {
      closeMenu();
    }
  });
}

function setupPageSwitchTransitions() {
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || isNavigating) {
      return;
    }

    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || link.hasAttribute("download") || link.target === "_blank") {
      return;
    }

    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin) {
      return;
    }

    if (!/\.html?$/.test(destination.pathname) && destination.pathname !== "/") {
      return;
    }

    if (destination.href === window.location.href) {
      return;
    }

    event.preventDefault();
    isNavigating = true;
    document.body.classList.add("page-transition-out");

    window.setTimeout(() => {
      window.location.href = destination.href;
    }, 230);
  });

  window.addEventListener("pageshow", (event) => {
    isNavigating = false;
    document.body.classList.remove("page-transition-out");

    if (event.persisted) {
      document.body.classList.add("page-transition-in");
      window.setTimeout(() => {
        document.body.classList.remove("page-transition-in");
      }, 360);
    }
  });
}

document.querySelectorAll(".chip, .ghost-button, .cta-button").forEach((element) => {
  element.addEventListener("pointerdown", () => element.classList.add("glow-pulse"));
  element.addEventListener("pointerup", () => element.classList.remove("glow-pulse"));
  element.addEventListener("pointerleave", () => element.classList.remove("glow-pulse"));
});

renderSharedNavigation();
renderHomeCards();
initializePageTransitions();
loadModuleVersion();

createParticles();
if (typedText) {
  updateTyping();
}
if (window.initBirthdayCalculator && birthdayModuleRoot) {
  window.initBirthdayCalculator(birthdayModuleRoot);
}
if (window.initDownloadSpeedCalculator && downloadSpeedModuleRoot) {
  window.initDownloadSpeedCalculator(downloadSpeedModuleRoot);
}
if (window.initPasswordChecker && passwordModuleRoot) {
  window.initPasswordChecker(passwordModuleRoot);
}
if (window.initGpaCalculator && gpaModuleRoot) {
  window.initGpaCalculator(gpaModuleRoot);
}
if (window.initRoaster && roasterModuleRoot) {
  window.initRoaster(roasterModuleRoot);
}
if (window.initWheelPicker && wheelModuleRoot) {
  window.initWheelPicker(wheelModuleRoot);
}
if (window.initLifeProgressTracker && lifeProgressModuleRoot) {
  window.initLifeProgressTracker(lifeProgressModuleRoot);
}
if (window.initAboutMe && aboutModuleRoot) {
  window.initAboutMe(aboutModuleRoot);
}
if (window.initLifeStats && lifeStatsModuleRoot) {
  window.initLifeStats(lifeStatsModuleRoot);
}
if (window.initGuessNumberGame && guessNumberModuleRoot) {
  window.initGuessNumberGame(guessNumberModuleRoot);
}
if (window.initMindReader && mindReaderModuleRoot) {
  window.initMindReader(mindReaderModuleRoot);
}
if (window.initWebsites && websitesModuleRoot) {
  window.initWebsites(websitesModuleRoot);
}
if (window.initQrGenerator && qrGeneratorModuleRoot) {
  window.initQrGenerator(qrGeneratorModuleRoot);
}
setupMobileMenu();
setupPageSwitchTransitions();

if (window.lucide && typeof window.lucide.createIcons === "function") {
  window.lucide.createIcons();
}

requestAnimationFrame(() => {
  setTimeout(finishPageTransitions, 80);
});
