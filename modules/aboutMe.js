function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const CONTACT_DELIVERY = {
  services: {
    web3formsAccessKey: "28ae7436-435b-4258-8ae7-636791431d40"
  }
};

const GITHUB_USERNAME = "malikali4129";

async function fetchGitHubProfile() {
  try {
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${GITHUB_USERNAME}`),
      fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=6`)
    ]);

    const user = userRes.ok ? await userRes.json() : null;
    const repos = reposRes.ok ? await reposRes.json() : [];

    return { user, repos };
  } catch (error) {
    console.warn("Failed to fetch live GitHub details:", error);
    return { user: null, repos: [] };
  }
}

function renderGitHubProfileCard(user) {
  const avatar = user?.avatar_url || "https://github.com/malikali4129.png";
  const name = user?.name || "Malik Ali";
  const login = user?.login || GITHUB_USERNAME;
  const bio = user?.bio || "Full-stack web developer building practical applications, multi-purpose modules, and interactive interfaces.";
  const location = user?.location || "Pakistan";
  const publicRepos = user?.public_repos ?? 12;
  const followers = user?.followers ?? 0;
  const following = user?.following ?? 0;
  const profileUrl = user?.html_url || `https://github.com/${GITHUB_USERNAME}`;

  return `
    <div class="github-profile-hero glass-card">
      <div class="github-profile-avatar-wrapper">
        <img src="${escapeHtml(avatar)}" alt="${escapeHtml(name)}" class="github-avatar" />
        <span class="github-online-badge" title="Active on GitHub"></span>
      </div>
      <div class="github-profile-info">
        <div class="github-profile-header">
          <div>
            <h2 class="github-name">${escapeHtml(name)}</h2>
            <a href="${escapeHtml(profileUrl)}" target="_blank" rel="noopener" class="github-handle">
              <i data-lucide="github"></i> @${escapeHtml(login)} <i data-lucide="external-link" class="mini-icon"></i>
            </a>
          </div>
          <a href="${escapeHtml(profileUrl)}" target="_blank" rel="noopener" class="cta-button github-follow-btn">
            <i data-lucide="github"></i> View GitHub Profile
          </a>
        </div>
        <p class="github-bio">${escapeHtml(bio)}</p>
        <div class="github-meta-pills">
          <span class="meta-pill"><i data-lucide="map-pin"></i> ${escapeHtml(location)}</span>
          <span class="meta-pill"><i data-lucide="folder-git-2"></i> ${publicRepos} Repositories</span>
          <span class="meta-pill"><i data-lucide="users"></i> ${followers} Followers · ${following} Following</span>
        </div>
      </div>
    </div>
  `;
}

function renderGitHubReposGrid(repos) {
  if (!repos || repos.length === 0) {
    return `
      <div class="github-repos-section">
        <h3 class="section-title"><i data-lucide="folder-git-2"></i> GitHub Repositories</h3>
        <p class="github-empty-state">Visit <a href="https://github.com/${GITHUB_USERNAME}" target="_blank" rel="noopener">github.com/${GITHUB_USERNAME}</a> to check out all projects.</p>
      </div>
    `;
  }

  const repoCards = repos
    .map((repo) => {
      const name = repo.name;
      const desc = repo.description || "No description provided.";
      const lang = repo.language || "JavaScript";
      const stars = repo.stargazers_count || 0;
      const forks = repo.forks_count || 0;
      const url = repo.html_url;

      return `
        <a href="${escapeHtml(url)}" target="_blank" rel="noopener" class="repo-card glass-card">
          <div class="repo-card-head">
            <h4 class="repo-name"><i data-lucide="code-2"></i> ${escapeHtml(name)}</h4>
            <i data-lucide="external-link" class="repo-ext-icon"></i>
          </div>
          <p class="repo-desc">${escapeHtml(desc)}</p>
          <div class="repo-card-footer">
            <span class="repo-lang-badge"><span class="lang-dot"></span> ${escapeHtml(lang)}</span>
            <div class="repo-stats">
              <span title="Stars"><i data-lucide="star"></i> ${stars}</span>
              <span title="Forks"><i data-lucide="git-fork"></i> ${forks}</span>
            </div>
          </div>
        </a>
      `;
    })
    .join("");

  return `
    <div class="github-repos-section">
      <h3 class="section-title"><i data-lucide="folder-git-2"></i> Recent GitHub Repositories</h3>
      <div class="github-repos-grid">
        ${repoCards}
      </div>
    </div>
  `;
}

function createAboutMeModule(root) {
  if (!root) return;

  root.innerHTML = `
    <div class="about-shell">
      <div id="github-profile-container">
        ${renderGitHubProfileCard(null)}
      </div>

      <div id="github-repos-container"></div>

      <article class="about-card glass-card">
        <h3 class="section-title"><i data-lucide="mail"></i> Get In Touch</h3>
        <p class="subtitle">Have a project idea, feedback, or custom module request? Send me a message directly!</p>
        <form class="contact-form" data-contact-form novalidate>
          <div class="form-grid">
            <div>
              <label class="download-label" for="contact-name">Your Name</label>
              <input id="contact-name" name="name" class="download-input" type="text" autocomplete="name" placeholder="Enter your name" required />
            </div>
            <div>
              <label class="download-label" for="contact-email">Your Email</label>
              <input id="contact-email" name="email" class="download-input" type="email" autocomplete="email" placeholder="name@example.com" required />
            </div>
          </div>

          <label class="download-label" for="contact-message">Message</label>
          <textarea id="contact-message" name="message" class="about-textarea" rows="4" placeholder="Write your message here..." required></textarea>

          <button type="submit" class="cta-button">
            <i data-lucide="send"></i> Send Message
          </button>
          <p class="about-note">Delivered instantly via Web3Forms.</p>
          <p class="about-form-status" data-contact-status aria-live="polite"></p>
        </form>
      </article>
    </div>
  `;

  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }

  fetchGitHubProfile().then(({ user, repos }) => {
    const profileContainer = root.querySelector("#github-profile-container");
    const reposContainer = root.querySelector("#github-repos-container");

    if (profileContainer && user) {
      profileContainer.innerHTML = renderGitHubProfileCard(user);
    }
    if (reposContainer && repos && repos.length > 0) {
      reposContainer.innerHTML = renderGitHubReposGrid(repos);
    }
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  });

  const form = root.querySelector("[data-contact-form]");
  const status = root.querySelector("[data-contact-status]");

  function setStatus(message, type) {
    status.textContent = message;
    status.dataset.state = type;
  }

  async function sendToWeb3Forms(payload) {
    const accessKey = CONTACT_DELIVERY.services.web3formsAccessKey;
    if (!accessKey) {
      return false;
    }

    const web3FormData = new FormData();
    web3FormData.append("access_key", accessKey);
    web3FormData.append("subject", "New About Contact Form Submission");
    web3FormData.append("name", payload.name);
    web3FormData.append("email", payload.email);
    web3FormData.append("message", payload.message);
    web3FormData.append("source", payload.source);
    web3FormData.append("timestamp", String(payload.timestamp));

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: web3FormData
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
      throw new Error(`Web3Forms failed: ${data.message || response.status}`);
    }

    return true;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!name || !email || !message) {
      setStatus("Please fill in all fields.", "error");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailPattern.test(email)) {
      setStatus("Please enter a valid email address.", "error");
      return;
    }

    const payload = { name, email, message, timestamp: Date.now(), source: "AIM LAB About Form" };
    form.reset();

    try {
      await sendToWeb3Forms(payload);
      setStatus("Message sent successfully!", "success");
    } catch (error) {
      setStatus("Failed to send message. Please try again.", "error");
    }
  });
}

window.initAboutMe = createAboutMeModule;
