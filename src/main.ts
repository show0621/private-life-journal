import { initTheme } from "./theme";
import { initMobileUX } from "./mobile";
import { applyReaderScale } from "./reader-prefs";
import { ensurePrivacyShield } from "./privacy-shield";
import "./styles.css";
import "./app";

initTheme();
initMobileUX();
applyReaderScale();
ensurePrivacyShield();