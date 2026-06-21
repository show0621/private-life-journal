import { initTheme } from "./theme";
import { initMobileUX } from "./mobile";
import { applyReaderFontSize } from "./reader-prefs";
import { ensurePrivacyShield } from "./privacy-shield";
import "./styles.css";
import "./app";

initTheme();
initMobileUX();
applyReaderFontSize();
ensurePrivacyShield();