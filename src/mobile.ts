export function initMobileUX(): void {
  document.documentElement.classList.add("touch-device");

  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    document.documentElement.classList.add("ios");
  }

  if (window.matchMedia("(max-width: 768px)").matches) {
    document.documentElement.classList.add("mobile-layout");
  }

  window.matchMedia("(max-width: 768px)").addEventListener("change", (event) => {
    document.documentElement.classList.toggle("mobile-layout", event.matches);
  });

  const viewport = window.visualViewport;
  if (!viewport) return;

  const syncKeyboardOffset = (): void => {
    const keyboard = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
    document.documentElement.style.setProperty("--keyboard-offset", `${Math.round(keyboard)}px`);
  };

  viewport.addEventListener("resize", syncKeyboardOffset);
  viewport.addEventListener("scroll", syncKeyboardOffset);
  syncKeyboardOffset();
}

export function scrollInputIntoView(element: HTMLElement): void {
  if (!document.documentElement.classList.contains("mobile-layout")) return;
  window.setTimeout(() => {
    element.scrollIntoView({ block: "center", behavior: "smooth" });
  }, 280);
}
