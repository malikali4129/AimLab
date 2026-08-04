/* =====================================================================
   QR Code Generator Module — qrGenerator.js
   Exposes: window.initQrGenerator(root)
   ===================================================================== */

const QR_TEMPLATES = [
  {
    id: "dark",
    label: "🌙 Dark",
    dotsColor: "#a855f7",
    bgColor: "#0d0d0d",
    dotsType: "rounded",
    cornerType: "extra-rounded",
    gradient: false
  },
  {
    id: "neon",
    label: "⚡ Neon",
    dotsColor: "#00ffe7",
    bgColor: "#050505",
    dotsType: "dots",
    cornerType: "dot",
    gradient: false
  },
  {
    id: "corporate",
    label: "🏢 Corporate",
    dotsColor: "#1e3a8a",
    bgColor: "#ffffff",
    dotsType: "square",
    cornerType: "square",
    gradient: false
  },
  {
    id: "minimal",
    label: "🌸 Minimal",
    dotsColor: "#ec4899",
    bgColor: "#fdf2f8",
    dotsType: "classy",
    cornerType: "extra-rounded",
    gradient: false
  },
  {
    id: "fire",
    label: "🔥 Fire",
    dotsColor: "#ff4500",
    dotsColor2: "#ffd700",
    bgColor: "#111111",
    dotsType: "extra-rounded",
    cornerType: "extra-rounded",
    gradient: true,
    gradientType: "linear"
  },
  {
    id: "nature",
    label: "🌿 Nature",
    dotsColor: "#16a34a",
    bgColor: "#f0fdf4",
    dotsType: "classy-rounded",
    cornerType: "extra-rounded",
    gradient: false
  }
];

const QR_TYPES = [
  { id: "text",  label: "📝 Text",    title: "Text / Message" },
  { id: "url",   label: "🔗 URL",     title: "Website URL"    },
  { id: "wifi",  label: "📶 Wi-Fi",   title: "Wi-Fi Network"  },
  { id: "email", label: "📧 Email",   title: "Email"          },
  { id: "phone", label: "📞 Phone",   title: "Phone Number"   },
  { id: "sms",   label: "💬 SMS",     title: "SMS Message"    },
  { id: "vcard", label: "👤 vCard",   title: "Contact Card"   }
];

function extractDominantColor(imgEl) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 40;
    canvas.height = 40;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imgEl, 0, 0, 40, 40);
    const data = ctx.getImageData(0, 0, 40, 40).data;
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < data.length; i += 16) {
      const alpha = data[i + 3];
      if (alpha < 30) continue;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }
    if (count === 0) return null;
    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  } catch {
    return null;
  }
}

function buildQrData(type, fields) {
  switch (type) {
    case "text":
      return fields.text || "";
    case "url": {
      const url = (fields.url || "").trim();
      if (!url) return "";
      return /^https?:\/\//i.test(url) ? url : `https://${url}`;
    }
    case "wifi": {
      const ssid = (fields.wifiSsid || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/"/g, '\\"');
      const pass = (fields.wifiPass || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/"/g, '\\"');
      const auth = fields.wifiAuth || "WPA";
      const hidden = fields.wifiHidden ? "true" : "false";
      return `WIFI:T:${auth};S:${ssid};P:${pass};H:${hidden};;`;
    }
    case "email": {
      const to = encodeURIComponent(fields.emailTo || "");
      const subject = encodeURIComponent(fields.emailSubject || "");
      const body = encodeURIComponent(fields.emailBody || "");
      return `mailto:${to}?subject=${subject}&body=${body}`;
    }
    case "phone":
      return `tel:${(fields.phone || "").replace(/\s/g, "")}`;
    case "sms": {
      const num = (fields.smsNumber || "").replace(/\s/g, "");
      const msg = encodeURIComponent(fields.smsMessage || "");
      return `sms:${num}?body=${msg}`;
    }
    case "vcard": {
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${fields.vcardName || ""}`,
        `TEL:${fields.vcardPhone || ""}`,
        `EMAIL:${fields.vcardEmail || ""}`,
        `URL:${fields.vcardWebsite || ""}`,
        `ORG:${fields.vcardOrg || ""}`,
        "END:VCARD"
      ];
      return lines.join("\n");
    }
    default:
      return "";
  }
}

function initQrGenerator(root) {
  if (!root) return;

  let currentType = "text";
  let logoDataUrl = null;
  let qrInstance = null;

  /* ---- Inline styles for the module ---- */
  const style = document.createElement("style");
  style.textContent = `
    .qr-wrap {
      display: flex;
      flex-direction: column;
      gap: 22px;
    }

    /* Type tabs */
    .qr-type-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .qr-type-tab {
      padding: 6px 14px;
      border-radius: 999px;
      border: 1.5px solid var(--stroke);
      background: transparent;
      color: var(--muted);
      font-size: 0.82rem;
      cursor: pointer;
      transition: all 180ms ease;
      font-family: inherit;
    }
    .qr-type-tab:hover {
      border-color: var(--violet);
      color: var(--text);
    }
    .qr-type-tab.active {
      background: linear-gradient(135deg, var(--violet), var(--cyan));
      border-color: transparent;
      color: #fff;
      font-weight: 600;
    }

    /* Type forms */
    .qr-type-form { display: none; flex-direction: column; gap: 12px; }
    .qr-type-form.active { display: flex; }

    .qr-field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    @media (max-width: 600px) {
      .qr-field-row { grid-template-columns: 1fr; }
    }

    .qr-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .qr-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--muted);
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .qr-input, .qr-select, .qr-textarea {
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      border: 1.5px solid var(--stroke);
      background: rgba(255,255,255,0.04);
      color: var(--text);
      font-family: inherit;
      font-size: 0.92rem;
      outline: none;
      transition: border-color 180ms ease;
      width: 100%;
    }
    .qr-input:focus, .qr-select:focus, .qr-textarea:focus {
      border-color: var(--violet);
    }
    .qr-select option { background: #0d0d1a; }
    .qr-textarea { resize: vertical; min-height: 80px; }

    /* Toggle */
    .qr-toggle-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .qr-toggle {
      appearance: none;
      width: 38px;
      height: 20px;
      border-radius: 999px;
      background: rgba(255,255,255,0.1);
      border: 1.5px solid var(--stroke);
      cursor: pointer;
      position: relative;
      transition: background 200ms;
    }
    .qr-toggle::after {
      content: "";
      position: absolute;
      top: 1px;
      left: 2px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--muted);
      transition: transform 200ms, background 200ms;
    }
    .qr-toggle:checked { background: linear-gradient(90deg, var(--violet), var(--cyan)); border-color: transparent; }
    .qr-toggle:checked::after { transform: translateX(18px); background: #fff; }

    /* Divider */
    .qr-divider {
      border: none;
      border-top: 1px solid var(--stroke);
      margin: 0;
    }

    /* Design panel */
    .qr-design-panel {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    @media (max-width: 600px) {
      .qr-design-panel { grid-template-columns: 1fr; }
    }

    .qr-color-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .qr-color-swatch {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: 2px solid var(--stroke);
      padding: 2px;
      background: none;
      cursor: pointer;
    }

    /* Templates */
    .qr-templates {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .qr-template-btn {
      padding: 7px 14px;
      border-radius: var(--radius-sm);
      border: 1.5px solid var(--stroke);
      background: rgba(255,255,255,0.04);
      color: var(--text);
      font-size: 0.82rem;
      cursor: pointer;
      font-family: inherit;
      transition: all 180ms ease;
    }
    .qr-template-btn:hover {
      border-color: var(--cyan);
      background: rgba(95, 251, 255, 0.06);
    }

    /* Size slider */
    .qr-size-row {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .qr-size-row input[type=range] {
      flex: 1;
    }
    .qr-size-label {
      font-size: 0.85rem;
      color: var(--muted);
      min-width: 52px;
      text-align: right;
    }

    /* Logo upload */
    .qr-logo-upload {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .qr-logo-file-label {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      border: 1.5px dashed var(--stroke);
      color: var(--muted);
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 180ms ease;
    }
    .qr-logo-file-label:hover {
      border-color: var(--violet);
      color: var(--text);
    }
    #qr-logo-input { display: none; }
    .qr-logo-thumb {
      width: 36px;
      height: 36px;
      border-radius: 6px;
      object-fit: contain;
      border: 1.5px solid var(--stroke);
      display: none;
    }
    .qr-logo-thumb.visible { display: block; }
    .qr-logo-clear {
      font-size: 0.78rem;
      color: var(--muted);
      cursor: pointer;
      background: none;
      border: none;
      font-family: inherit;
      padding: 0;
      display: none;
      text-decoration: underline;
    }
    .qr-logo-clear.visible { display: inline; }
    .qr-palette-hint {
      font-size: 0.74rem;
      color: var(--cyan);
      display: none;
    }
    .qr-palette-hint.visible { display: inline; }

    /* Gradient extra color */
    .qr-gradient-extra {
      display: none;
      align-items: center;
      gap: 10px;
    }
    .qr-gradient-extra.visible { display: flex; }

    /* Preview + actions */
    .qr-output-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 18px;
    }
    .qr-preview-box {
      min-width: 140px;
      min-height: 140px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--stroke);
      background: rgba(255,255,255,0.03);
      overflow: hidden;
      padding: 12px;
      transition: border-color 300ms;
    }
    .qr-preview-box.has-qr {
      border-color: var(--violet);
    }
    .qr-preview-placeholder {
      color: var(--muted);
      font-size: 0.88rem;
      text-align: center;
      padding: 20px;
    }

    .qr-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
    }

    .qr-status {
      font-size: 0.82rem;
      color: var(--muted);
      min-height: 18px;
      text-align: center;
    }
    .qr-status.ok { color: var(--green); }
    .qr-status.warn { color: var(--warning); }
    .qr-status.err { color: var(--pink); }

    /* Main layout */
    .qr-main-grid {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 28px;
      align-items: start;
    }
    @media (max-width: 820px) {
      .qr-main-grid {
        grid-template-columns: 1fr;
      }
      .qr-output-area {
        order: -1;
      }
    }
  `;
  document.head.appendChild(style);

  /* ---- Build HTML ---- */
  root.innerHTML = `
    <div class="qr-wrap">

      <!-- Type tabs -->
      <div class="qr-type-tabs" role="tablist" aria-label="QR type">
        ${QR_TYPES.map(t => `
          <button type="button" class="qr-type-tab${t.id === "text" ? " active" : ""}"
            data-qr-type="${t.id}" role="tab" aria-selected="${t.id === "text"}"
            title="${t.title}">${t.label}</button>
        `).join("")}
      </div>

      <!-- Type forms -->
      <div class="qr-forms-area">

        <!-- Text -->
        <div class="qr-type-form active" data-form="text">
          <div class="qr-field">
            <label class="qr-label" for="qr-text-input">Message or text</label>
            <textarea class="qr-textarea" id="qr-text-input" placeholder="Enter any text…" rows="3"></textarea>
          </div>
        </div>

        <!-- URL -->
        <div class="qr-type-form" data-form="url">
          <div class="qr-field">
            <label class="qr-label" for="qr-url-input">Website URL</label>
            <input class="qr-input" id="qr-url-input" type="url" placeholder="https://example.com" />
          </div>
        </div>

        <!-- Wi-Fi -->
        <div class="qr-type-form" data-form="wifi">
          <div class="qr-field-row">
            <div class="qr-field">
              <label class="qr-label" for="qr-wifi-ssid">Network name (SSID)</label>
              <input class="qr-input" id="qr-wifi-ssid" type="text" placeholder="MyNetwork" />
            </div>
            <div class="qr-field">
              <label class="qr-label" for="qr-wifi-pass">Password</label>
              <input class="qr-input" id="qr-wifi-pass" type="password" placeholder="Password" />
            </div>
          </div>
          <div class="qr-field-row">
            <div class="qr-field">
              <label class="qr-label" for="qr-wifi-auth">Security type</label>
              <select class="qr-select" id="qr-wifi-auth">
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">None (open)</option>
              </select>
            </div>
            <div class="qr-field" style="justify-content:flex-end;">
              <span class="qr-label">Hidden network?</span>
              <div class="qr-toggle-row">
                <input class="qr-toggle" id="qr-wifi-hidden" type="checkbox" />
                <label for="qr-wifi-hidden" class="qr-label" style="text-transform:none;letter-spacing:0">Yes, this network is hidden</label>
              </div>
            </div>
          </div>
        </div>

        <!-- Email -->
        <div class="qr-type-form" data-form="email">
          <div class="qr-field">
            <label class="qr-label" for="qr-email-to">Recipient email</label>
            <input class="qr-input" id="qr-email-to" type="email" placeholder="someone@example.com" />
          </div>
          <div class="qr-field">
            <label class="qr-label" for="qr-email-subject">Subject</label>
            <input class="qr-input" id="qr-email-subject" type="text" placeholder="Hello!" />
          </div>
          <div class="qr-field">
            <label class="qr-label" for="qr-email-body">Body</label>
            <textarea class="qr-textarea" id="qr-email-body" placeholder="Message body…" rows="3"></textarea>
          </div>
        </div>

        <!-- Phone -->
        <div class="qr-type-form" data-form="phone">
          <div class="qr-field">
            <label class="qr-label" for="qr-phone-input">Phone number</label>
            <input class="qr-input" id="qr-phone-input" type="tel" placeholder="+1 555 000 0000" />
          </div>
        </div>

        <!-- SMS -->
        <div class="qr-type-form" data-form="sms">
          <div class="qr-field">
            <label class="qr-label" for="qr-sms-number">Phone number</label>
            <input class="qr-input" id="qr-sms-number" type="tel" placeholder="+1 555 000 0000" />
          </div>
          <div class="qr-field">
            <label class="qr-label" for="qr-sms-message">Message</label>
            <textarea class="qr-textarea" id="qr-sms-message" placeholder="Hi there!" rows="3"></textarea>
          </div>
        </div>

        <!-- vCard -->
        <div class="qr-type-form" data-form="vcard">
          <div class="qr-field-row">
            <div class="qr-field">
              <label class="qr-label" for="qr-vc-name">Full name</label>
              <input class="qr-input" id="qr-vc-name" type="text" placeholder="Jane Doe" />
            </div>
            <div class="qr-field">
              <label class="qr-label" for="qr-vc-phone">Phone</label>
              <input class="qr-input" id="qr-vc-phone" type="tel" placeholder="+1 555 000 0000" />
            </div>
          </div>
          <div class="qr-field-row">
            <div class="qr-field">
              <label class="qr-label" for="qr-vc-email">Email</label>
              <input class="qr-input" id="qr-vc-email" type="email" placeholder="jane@example.com" />
            </div>
            <div class="qr-field">
              <label class="qr-label" for="qr-vc-org">Organization</label>
              <input class="qr-input" id="qr-vc-org" type="text" placeholder="Acme Corp" />
            </div>
          </div>
          <div class="qr-field">
            <label class="qr-label" for="qr-vc-website">Website</label>
            <input class="qr-input" id="qr-vc-website" type="url" placeholder="https://janedoe.com" />
          </div>
        </div>

      </div><!-- /qr-forms-area -->

      <hr class="qr-divider" />

      <!-- Design section -->
      <div>
        <p class="qr-label" style="margin:0 0 10px">Design &amp; Style</p>

        <!-- Templates -->
        <div class="qr-templates" aria-label="Design templates">
          ${QR_TEMPLATES.map(t => `
            <button type="button" class="qr-template-btn" data-template="${t.id}">${t.label}</button>
          `).join("")}
        </div>
      </div>

      <div class="qr-main-grid">
        <!-- Left: controls -->
        <div style="display:flex;flex-direction:column;gap:16px;">

          <div class="qr-design-panel">
            <!-- Foreground color -->
            <div class="qr-field">
              <label class="qr-label" for="qr-fg-color">Foreground color</label>
              <div class="qr-color-row">
                <input class="qr-color-swatch" id="qr-fg-color" type="color" value="#9d7dff" />
                <span id="qr-fg-hex" style="font-size:0.82rem;color:var(--muted)">#9d7dff</span>
              </div>
            </div>

            <!-- Background color -->
            <div class="qr-field">
              <label class="qr-label" for="qr-bg-color">Background color</label>
              <div class="qr-color-row">
                <input class="qr-color-swatch" id="qr-bg-color" type="color" value="#050510" />
                <span id="qr-bg-hex" style="font-size:0.82rem;color:var(--muted)">#050510</span>
              </div>
            </div>

            <!-- Dot style -->
            <div class="qr-field">
              <label class="qr-label" for="qr-dot-style">Dot style</label>
              <select class="qr-select" id="qr-dot-style">
                <option value="square">Square</option>
                <option value="dots">Dots</option>
                <option value="rounded" selected>Rounded</option>
                <option value="classy">Classy</option>
                <option value="classy-rounded">Classy rounded</option>
                <option value="extra-rounded">Extra rounded</option>
              </select>
            </div>

            <!-- Corner style -->
            <div class="qr-field">
              <label class="qr-label" for="qr-corner-style">Corner style</label>
              <select class="qr-select" id="qr-corner-style">
                <option value="square">Square</option>
                <option value="dot">Dot</option>
                <option value="extra-rounded" selected>Extra rounded</option>
              </select>
            </div>
          </div>

          <!-- Gradient toggle -->
          <div class="qr-field">
            <span class="qr-label">Gradient foreground</span>
            <div class="qr-toggle-row">
              <input class="qr-toggle" id="qr-gradient-toggle" type="checkbox" />
              <label for="qr-gradient-toggle" class="qr-label" style="text-transform:none;letter-spacing:0">Enable gradient</label>
            </div>
          </div>

          <!-- Gradient extra controls -->
          <div class="qr-gradient-extra" id="qr-gradient-extra">
            <div class="qr-field" style="flex:1">
              <label class="qr-label" for="qr-fg-color2">Gradient end color</label>
              <div class="qr-color-row">
                <input class="qr-color-swatch" id="qr-fg-color2" type="color" value="#5ffbff" />
                <span id="qr-fg2-hex" style="font-size:0.82rem;color:var(--muted)">#5ffbff</span>
              </div>
            </div>
            <div class="qr-field" style="flex:1">
              <label class="qr-label" for="qr-gradient-type">Type</label>
              <select class="qr-select" id="qr-gradient-type">
                <option value="linear">Linear</option>
                <option value="radial">Radial</option>
              </select>
            </div>
          </div>

          <!-- Size slider -->
          <div class="qr-field">
            <label class="qr-label" for="qr-size-slider">QR size</label>
            <div class="qr-size-row">
              <input id="qr-size-slider" type="range" min="128" max="1024" step="32" value="300" />
              <span class="qr-size-label" id="qr-size-display">300 px</span>
            </div>
          </div>

          <!-- Logo -->
          <div class="qr-field">
            <span class="qr-label">Center logo (optional)</span>
            <div class="qr-logo-upload">
              <label class="qr-logo-file-label" for="qr-logo-input">
                ⬆ Upload logo
              </label>
              <input type="file" id="qr-logo-input" accept="image/*" />
              <img class="qr-logo-thumb" id="qr-logo-thumb" alt="Logo preview" />
              <button type="button" class="qr-logo-clear" id="qr-logo-clear">Remove</button>
              <span class="qr-palette-hint" id="qr-palette-hint">🎨 Colors auto-applied from logo!</span>
            </div>
          </div>

        </div><!-- /left -->

        <!-- Right: preview + actions -->
        <div class="qr-output-area">
          <div class="qr-preview-box" id="qr-preview-box">
            <div class="qr-preview-placeholder" id="qr-placeholder">
              📱<br/>Your QR code<br/>will appear here
            </div>
            <div id="qr-canvas-area"></div>
          </div>
          <div class="qr-status" id="qr-status" aria-live="polite"></div>
          <div class="qr-actions">
            <button type="button" class="cta-button" id="qr-generate-btn">Generate QR</button>
            <button type="button" class="ghost-button" id="qr-dl-png" disabled>⬇ PNG</button>
            <button type="button" class="ghost-button" id="qr-dl-jpeg" disabled>⬇ JPEG</button>
            <button type="button" class="ghost-button" id="qr-dl-svg" disabled>⬇ SVG</button>
          </div>
        </div>
      </div><!-- /qr-main-grid -->

    </div><!-- /qr-wrap -->
  `;

  /* ---- Wire up references ---- */
  const tabBtns      = [...root.querySelectorAll(".qr-type-tab")];
  const forms        = [...root.querySelectorAll(".qr-type-form")];
  const templateBtns = [...root.querySelectorAll(".qr-template-btn")];
  const generateBtn  = root.querySelector("#qr-generate-btn");
  const dlPng        = root.querySelector("#qr-dl-png");
  const dlJpeg       = root.querySelector("#qr-dl-jpeg");
  const dlSvg        = root.querySelector("#qr-dl-svg");
  const statusEl     = root.querySelector("#qr-status");
  const previewBox   = root.querySelector("#qr-preview-box");
  const canvasArea   = root.querySelector("#qr-canvas-area");
  const placeholder  = root.querySelector("#qr-placeholder");

  const fgColor      = root.querySelector("#qr-fg-color");
  const fgHex        = root.querySelector("#qr-fg-hex");
  const bgColor      = root.querySelector("#qr-bg-color");
  const bgHex        = root.querySelector("#qr-bg-hex");
  const fgColor2     = root.querySelector("#qr-fg-color2");
  const fg2Hex       = root.querySelector("#qr-fg2-hex");
  const dotStyle     = root.querySelector("#qr-dot-style");
  const cornerStyle  = root.querySelector("#qr-corner-style");
  const gradToggle   = root.querySelector("#qr-gradient-toggle");
  const gradExtra    = root.querySelector("#qr-gradient-extra");
  const gradType     = root.querySelector("#qr-gradient-type");
  const sizeSlider   = root.querySelector("#qr-size-slider");
  const sizeDisplay  = root.querySelector("#qr-size-display");
  const logoInput    = root.querySelector("#qr-logo-input");
  const logoThumb    = root.querySelector("#qr-logo-thumb");
  const logoClear    = root.querySelector("#qr-logo-clear");
  const paletteHint  = root.querySelector("#qr-palette-hint");

  /* ---- Helpers ---- */
  function setStatus(msg, type = "") {
    statusEl.textContent = msg;
    statusEl.className = `qr-status ${type}`;
  }

  function getFields() {
    return {
      text:         root.querySelector("#qr-text-input")?.value || "",
      url:          root.querySelector("#qr-url-input")?.value || "",
      wifiSsid:     root.querySelector("#qr-wifi-ssid")?.value || "",
      wifiPass:     root.querySelector("#qr-wifi-pass")?.value || "",
      wifiAuth:     root.querySelector("#qr-wifi-auth")?.value || "WPA",
      wifiHidden:   root.querySelector("#qr-wifi-hidden")?.checked || false,
      emailTo:      root.querySelector("#qr-email-to")?.value || "",
      emailSubject: root.querySelector("#qr-email-subject")?.value || "",
      emailBody:    root.querySelector("#qr-email-body")?.value || "",
      phone:        root.querySelector("#qr-phone-input")?.value || "",
      smsNumber:    root.querySelector("#qr-sms-number")?.value || "",
      smsMessage:   root.querySelector("#qr-sms-message")?.value || "",
      vcardName:    root.querySelector("#qr-vc-name")?.value || "",
      vcardPhone:   root.querySelector("#qr-vc-phone")?.value || "",
      vcardEmail:   root.querySelector("#qr-vc-email")?.value || "",
      vcardOrg:     root.querySelector("#qr-vc-org")?.value || "",
      vcardWebsite: root.querySelector("#qr-vc-website")?.value || ""
    };
  }

  function getQrOptions(data, size) {
    const useGradient = gradToggle.checked;
    const dotsOptions = useGradient
      ? {
          type: dotStyle.value,
          gradient: {
            type: gradType.value,
            rotation: 0,
            colorStops: [
              { offset: 0, color: fgColor.value },
              { offset: 1, color: fgColor2.value }
            ]
          }
        }
      : { type: dotStyle.value, color: fgColor.value };

    const options = {
      width: size,
      height: size,
      data,
      dotsOptions,
      backgroundOptions: { color: bgColor.value },
      cornersSquareOptions: { type: cornerStyle.value, color: fgColor.value },
      cornersDotOptions: { color: fgColor.value },
      qrOptions: { errorCorrectionLevel: logoDataUrl ? "H" : "M" }
    };

    if (logoDataUrl) {
      options.image = logoDataUrl;
      options.imageOptions = { crossOrigin: "anonymous", margin: 4, imageSize: 0.3 };
    }

    return options;
  }

  function enableDownloads(enable) {
    dlPng.disabled  = !enable;
    dlJpeg.disabled = !enable;
    dlSvg.disabled  = !enable;
  }

  /* ---- Tab switching ---- */
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      currentType = btn.dataset.qrType;
      tabBtns.forEach(b => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
      forms.forEach(f => f.classList.toggle("active", f.dataset.form === currentType));
      setStatus("");
    });
  });

  /* ---- Design template buttons ---- */
  templateBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const tpl = QR_TEMPLATES.find(t => t.id === btn.dataset.template);
      if (!tpl) return;
      fgColor.value = tpl.dotsColor;
      fgHex.textContent = tpl.dotsColor;
      bgColor.value = tpl.bgColor;
      bgHex.textContent = tpl.bgColor;
      dotStyle.value = tpl.dotsType;
      cornerStyle.value = tpl.cornerType;
      gradToggle.checked = tpl.gradient || false;
      gradExtra.classList.toggle("visible", tpl.gradient || false);
      if (tpl.gradient && tpl.dotsColor2) {
        fgColor2.value = tpl.dotsColor2;
        fg2Hex.textContent = tpl.dotsColor2;
        gradType.value = tpl.gradientType || "linear";
      }
      setStatus(`Template "${tpl.label}" applied`, "ok");
    });
  });

  /* ---- Color pickers ---- */
  fgColor.addEventListener("input", () => { fgHex.textContent = fgColor.value; });
  bgColor.addEventListener("input", () => { bgHex.textContent = bgColor.value; });
  fgColor2.addEventListener("input", () => { fg2Hex.textContent = fgColor2.value; });

  /* ---- Gradient toggle ---- */
  gradToggle.addEventListener("change", () => {
    gradExtra.classList.toggle("visible", gradToggle.checked);
  });

  /* ---- Size slider ---- */
  sizeSlider.addEventListener("input", () => {
    sizeDisplay.textContent = `${sizeSlider.value} px`;
  });

  /* ---- Logo upload ---- */
  logoInput.addEventListener("change", () => {
    const file = logoInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      logoDataUrl = e.target.result;
      logoThumb.src = logoDataUrl;
      logoThumb.classList.add("visible");
      logoClear.classList.add("visible");

      // Extract palette
      const img = new Image();
      img.onload = () => {
        const dominant = extractDominantColor(img);
        if (dominant) {
          fgColor.value = dominant;
          fgHex.textContent = dominant;
          paletteHint.classList.add("visible");
          setTimeout(() => paletteHint.classList.remove("visible"), 3000);
        }
      };
      img.src = logoDataUrl;
    };
    reader.readAsDataURL(file);
  });

  logoClear.addEventListener("click", () => {
    logoDataUrl = null;
    logoInput.value = "";
    logoThumb.src = "";
    logoThumb.classList.remove("visible");
    logoClear.classList.remove("visible");
    paletteHint.classList.remove("visible");
  });

  /* ---- Generate ---- */
  generateBtn.addEventListener("click", () => {
    const data = buildQrData(currentType, getFields());

    if (!data.trim()) {
      setStatus("Please fill in the required fields.", "warn");
      return;
    }

    const size = parseInt(sizeSlider.value, 10);
    const options = getQrOptions(data, size);

    if (typeof QRCodeStyling === "undefined") {
      setStatus("QR library failed to load. Check your connection.", "err");
      return;
    }

    setStatus("Generating…", "");
    generateBtn.disabled = true;

    // Clear previous
    canvasArea.innerHTML = "";
    placeholder.style.display = "none";
    previewBox.classList.remove("has-qr");

    try {
      qrInstance = new QRCodeStyling(options);
      qrInstance.append(canvasArea);
      previewBox.classList.add("has-qr");
      enableDownloads(true);
      setStatus("QR code generated! Scan to test.", "ok");
    } catch (err) {
      setStatus("Failed to generate QR code. Try different input.", "err");
      placeholder.style.display = "";
    } finally {
      generateBtn.disabled = false;
    }
  });

  /* ---- Download handlers ---- */
  dlPng.addEventListener("click", () => {
    if (!qrInstance) return;
    qrInstance.download({ name: "qr-code", extension: "png" });
    setStatus("PNG downloaded.", "ok");
  });

  dlJpeg.addEventListener("click", () => {
    if (!qrInstance) return;
    qrInstance.download({ name: "qr-code", extension: "jpeg" });
    setStatus("JPEG downloaded.", "ok");
  });

  dlSvg.addEventListener("click", () => {
    if (!qrInstance) return;
    qrInstance.download({ name: "qr-code", extension: "svg" });
    setStatus("SVG downloaded.", "ok");
  });
}

window.initQrGenerator = initQrGenerator;
