let activePopup = null;
let activeEscapeHandler = null;

const ensureStyles = () => {
  if (document.getElementById("zeta-popup-styles")) return;

  const style = document.createElement("style");
  style.id = "zeta-popup-styles";
  style.textContent = `
    .zeta-popup-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background:
        radial-gradient(circle at 20% 0%, rgba(59, 130, 246, 0.2), transparent 52%),
        radial-gradient(circle at 80% 100%, rgba(244, 63, 94, 0.18), transparent 55%),
        rgba(2, 6, 23, 0.78);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      animation: zetaPopupFadeIn 0.18s ease-out;
      backdrop-filter: blur(3px);
    }
    .zeta-popup-card {
      width: min(94vw, 480px);
      border-radius: 18px;
      border: 1px solid rgba(148, 163, 184, 0.35);
      background:
        linear-gradient(160deg, rgba(15, 23, 42, 0.98) 0%, rgba(8, 14, 28, 0.98) 100%);
      color: #e5e7eb;
      box-shadow:
        0 20px 44px rgba(2, 6, 23, 0.55),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
      overflow: hidden;
      animation: zetaPopupSlideIn 0.2s ease-out;
    }
    .zeta-popup-header {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 18px 20px 12px;
    }
    .zeta-popup-icon {
      width: 30px;
      height: 30px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-weight: 900;
      font-size: 14px;
      border: 1px solid transparent;
    }
    .zeta-popup-icon.info {
      background: rgba(59, 130, 246, 0.2);
      border-color: rgba(96, 165, 250, 0.35);
      color: #bfdbfe;
    }
    .zeta-popup-icon.success {
      background: rgba(16, 185, 129, 0.2);
      border-color: rgba(52, 211, 153, 0.35);
      color: #a7f3d0;
    }
    .zeta-popup-icon.warning {
      background: rgba(245, 158, 11, 0.2);
      border-color: rgba(251, 191, 36, 0.35);
      color: #fde68a;
    }
    .zeta-popup-icon.danger {
      background: rgba(244, 63, 94, 0.2);
      border-color: rgba(251, 113, 133, 0.35);
      color: #fecdd3;
    }
    .zeta-popup-title {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 800;
      letter-spacing: 0.01em;
      color: #f8fafc;
    }
    .zeta-popup-message {
      margin: 6px 0 0 0;
      color: #cbd5e1;
      line-height: 1.5;
      white-space: pre-wrap;
    }
    .zeta-popup-body {
      padding: 0 20px 16px;
    }
    .zeta-popup-input-wrap {
      margin-top: 10px;
    }
    .zeta-popup-input {
      width: 100%;
      border: 1px solid rgba(100, 116, 139, 0.7);
      border-radius: 10px;
      background: rgba(15, 23, 42, 0.9);
      color: #f8fafc;
      padding: 10px 12px;
      font-size: 14px;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .zeta-popup-input:focus {
      border-color: rgba(59, 130, 246, 0.8);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }
    .zeta-popup-input.invalid {
      border-color: rgba(244, 63, 94, 0.85);
      box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.15);
    }
    .zeta-popup-input-error {
      margin-top: 6px;
      font-size: 12px;
      color: #fda4af;
      min-height: 16px;
    }
    .zeta-popup-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 0 20px 18px;
    }
    .zeta-popup-btn {
      border: 1px solid transparent;
      border-radius: 10px;
      padding: 9px 14px;
      font-weight: 700;
      cursor: pointer;
      color: #f8fafc;
      background: rgba(51, 65, 85, 0.85);
      transition: transform 0.12s ease, opacity 0.12s ease, background-color 0.12s ease;
    }
    .zeta-popup-btn:hover {
      transform: translateY(-1px);
    }
    .zeta-popup-btn.cancel {
      border-color: rgba(100, 116, 139, 0.6);
      background: rgba(30, 41, 59, 0.9);
      color: #e2e8f0;
    }
    .zeta-popup-btn.info {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      border-color: rgba(147, 197, 253, 0.35);
    }
    .zeta-popup-btn.success {
      background: linear-gradient(135deg, #16a34a, #15803d);
      border-color: rgba(134, 239, 172, 0.35);
    }
    .zeta-popup-btn.warning {
      background: linear-gradient(135deg, #d97706, #b45309);
      border-color: rgba(253, 224, 71, 0.35);
    }
    .zeta-popup-btn.danger {
      background: linear-gradient(135deg, #e11d48, #be123c);
      border-color: rgba(253, 164, 175, 0.35);
    }
    @keyframes zetaPopupFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes zetaPopupSlideIn {
      from { transform: translateY(8px) scale(0.98); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }
  `;

  document.head.appendChild(style);
};

const cleanup = () => {
  if (activeEscapeHandler) {
    document.removeEventListener("keydown", activeEscapeHandler);
    activeEscapeHandler = null;
  }

  if (activePopup?.parentNode) {
    activePopup.parentNode.removeChild(activePopup);
  }

  activePopup = null;
};

const createPopup = ({
  title,
  message,
  showInput = false,
  okText = "OK",
  cancelText = null,
  tone = "info",
  placeholder = "Type here",
  defaultValue = "",
  requireInput = false,
}) =>
  new Promise((resolve) => {
    cleanup();
    ensureStyles();

    const overlay = document.createElement("div");
    overlay.className = "zeta-popup-overlay";

    const card = document.createElement("div");
    card.className = "zeta-popup-card";

    const header = document.createElement("div");
    header.className = "zeta-popup-header";

    const icon = document.createElement("span");
    icon.className = `zeta-popup-icon ${tone}`;
    icon.textContent = tone === "danger" ? "!" : tone === "warning" ? "?" : "i";

    const headingWrap = document.createElement("div");
    const titleEl = document.createElement("h3");
    titleEl.className = "zeta-popup-title";
    titleEl.textContent = title || "Notification";

    const messageEl = document.createElement("p");
    messageEl.className = "zeta-popup-message";
    messageEl.textContent = message || "";

    headingWrap.appendChild(titleEl);
    headingWrap.appendChild(messageEl);
    header.appendChild(icon);
    header.appendChild(headingWrap);

    const body = document.createElement("div");
    body.className = "zeta-popup-body";

    const inputWrap = document.createElement("div");
    inputWrap.className = "zeta-popup-input-wrap";

    let input = null;
    let inputError = null;

    if (showInput) {
      input = document.createElement("input");
      input.className = "zeta-popup-input";
      input.placeholder = placeholder;
      input.value = defaultValue;
      input.type = "text";
      input.autocomplete = "off";

      inputError = document.createElement("div");
      inputError.className = "zeta-popup-input-error";

      inputWrap.appendChild(input);
      inputWrap.appendChild(inputError);
      body.appendChild(inputWrap);
    }

    const actions = document.createElement("div");
    actions.className = "zeta-popup-actions";

    const finalize = (value) => {
      cleanup();
      resolve(value);
    };

    if (cancelText) {
      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "zeta-popup-btn cancel";
      cancelBtn.textContent = cancelText;
      cancelBtn.onclick = () => finalize(showInput ? null : false);
      actions.appendChild(cancelBtn);
    }

    const okBtn = document.createElement("button");
    okBtn.type = "button";
    okBtn.className = `zeta-popup-btn ${tone}`;
    okBtn.textContent = okText;
    okBtn.onclick = () => {
      if (!showInput) {
        finalize(true);
        return;
      }

      const value = String(input?.value || "");
      if (requireInput && !value.trim()) {
        input?.classList.add("invalid");
        if (inputError) {
          inputError.textContent = "This field is required.";
        }
        return;
      }

      finalize(value);
    };
    actions.appendChild(okBtn);

    if (showInput && input) {
      const submitOnEnter = (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          okBtn.click();
        }
      };
      input.addEventListener("keydown", submitOnEnter);
      input.addEventListener("input", () => {
        input.classList.remove("invalid");
        if (inputError) inputError.textContent = "";
      });
    }

    overlay.onclick = (event) => {
      if (event.target === overlay) {
        finalize(showInput ? null : false);
      }
    };

    activeEscapeHandler = (event) => {
      if (event.key === "Escape") {
        finalize(showInput ? null : false);
      }
    };
    document.addEventListener("keydown", activeEscapeHandler);

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(actions);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    activePopup = overlay;

    if (showInput && input) {
      window.setTimeout(() => input?.focus(), 0);
    } else {
      window.setTimeout(() => okBtn.focus(), 0);
    }
  });

export const showPopup = (message, title = "Notification", options = {}) =>
  createPopup({
    title,
    message,
    okText: options.okText || "OK",
    tone: options.tone || "info",
  });

export const showConfirm = (message, title = "Confirm", options = {}) =>
  createPopup({
    title,
    message,
    okText: options.okText || "Confirm",
    cancelText: options.cancelText || "Cancel",
    tone: options.tone || "danger",
  });

export const showPrompt = (message, title = "Confirm Input", options = {}) =>
  createPopup({
    title,
    message,
    showInput: true,
    okText: options.okText || "Submit",
    cancelText: options.cancelText || "Cancel",
    tone: options.tone || "info",
    placeholder: options.placeholder || "Type here",
    defaultValue: options.defaultValue || "",
    requireInput: Boolean(options.requireInput),
  });
