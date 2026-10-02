import { isRate, type Rate } from "../lib/speed";
import { local } from "../lib/storage";

const KEY_SPEED = "speed";

/** What is set under Einstellungen. */
class Settings {
  /** The speed every video starts at. */
  defaultSpeed = $state.raw<Rate>(readSpeed());

  setDefaultSpeed(rate: Rate) {
    this.defaultSpeed = rate;
    local.put(KEY_SPEED, String(rate));
  }
}

function readSpeed(): Rate {
  const stored = Number(local.get(KEY_SPEED));
  return isRate(stored) ? stored : 1;
}

export const settings = new Settings();
