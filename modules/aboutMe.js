function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function loadRecentContacts() {
  try {
    const raw = window.localStorage.getItem("aimlab-about-contacts");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveRecentContacts(items) {
  try {
    window.localStorage.setItem("aimlab-about-contacts", JSON.stringify(items));
  } catch (error) {
    // Ignore storage failures and keep form functional.
  }
}

function createAboutMeModule(root) {
  if (!root) return;

  root.innerHTML = `
    <section class="about-shell">
      <article class="about-card">
        <h3>Hi, I am Malik</h3>
        <p>
          I build practical web tools and experiment with playful interfaces.
          This section is sample text for now, and will later be replaced with final bio content.
        </p>
        <p>
          I enjoy turning small daily problems into simple, useful apps with clean UX and clear behavior.
        </p>
      </article>

      <article class="about-card">
        <h3>Contact Now</h3>
        <form class="contact-form" data-contact-form novalidate>
          <label class="download-label" for="contact-name">Name</label>
          <input id="contact-name" name="name" class="download-input" type="text" autocomplete="name" required />

          <label class="download-label" for="contact-email">Email</label>
          <input id="contact-email" name="email" class="download-input" type="email" autocomplete="email" required />

          <label class="download-label" for="contact-message">Message</label>
          <textarea id="contact-message" name="message" class="about-textarea" rows="5" required></textarea>

          <button type="submit" class="cta-button">Send Message</button>
          <p class="about-form-status" data-contact-status aria-live="polite"></p>
        </form>

        <div class="about-recent" data-contact-recent>
          <p class="download-label">Recent messages</p>
          <div class="about-recent-list" data-contact-list></div>
        </div>
      </article>
    </section>
  `;

  const form = root.querySelector("[data-contact-form]");
  const status = root.querySelector("[data-contact-status]");
  const list = root.querySelector("[data-contact-list]");

  function renderRecent() {
    const items = loadRecentContacts();
    if (!items.length) {
      list.innerHTML = '<p class="about-empty">No messages yet.</p>';
      return;
    }

    list.innerHTML = items
      .map((item) => {
        const date = new Date(item.timestamp).toLocaleString();
        return `
          <article class="about-recent-item">
            <h4>${escapeHtml(item.name)}</h4>
            <p>${escapeHtml(item.email)}</p>
            <p>${escapeHtml(item.message)}</p>
            <small>${escapeHtml(date)}</small>
          </article>
        `;
      })
      .join("");
  }

  function setStatus(message, type) {
    status.textContent = message;
    status.dataset.state = type;
  }

  form.addEventListener("submit", (event) => {
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

    const nextItems = [
      {
        name,
        email,
        message,
        timestamp: Date.now()
      },
      ...loadRecentContacts()
    ].slice(0, 4);

    saveRecentContacts(nextItems);
    renderRecent();
    form.reset();
    setStatus("Message sent successfully. Thanks for reaching out.", "success");
  });

  renderRecent();
}

window.initAboutMe = createAboutMeModule;
