const SHIELD_ID = "privacy-shield";

export function ensurePrivacyShield(): HTMLElement {
  let el = document.getElementById(SHIELD_ID);
  if (el) return el;

  el = document.createElement("div");
  el.id = SHIELD_ID;
  el.className = "privacy-shield hidden";
  el.innerHTML = `
    <div class="privacy-shield-panel">
      <p class="brand-mark">The Hideaway</p>
      <p class="privacy-shield-hint">內容已隱藏</p>
      <p class="privacy-shield-action">點一下以繼續</p>
    </div>
  `;
  el.addEventListener("click", () => hidePrivacyShield());
  document.body.appendChild(el);
  return el;
}

export function isPrivacyShieldVisible(): boolean {
  const el = document.getElementById(SHIELD_ID);
  return !!el && !el.classList.contains("hidden");
}

export function showPrivacyShield(): void {
  ensurePrivacyShield().classList.remove("hidden");
}

export function hidePrivacyShield(): void {
  document.getElementById(SHIELD_ID)?.classList.add("hidden");
}

export function togglePrivacyShield(): boolean {
  if (isPrivacyShieldVisible()) {
    hidePrivacyShield();
    return false;
  }
  showPrivacyShield();
  return true;
}
