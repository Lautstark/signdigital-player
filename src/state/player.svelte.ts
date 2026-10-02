import type { Rate } from "../lib/speed";
import type { SignRef } from "../lib/signdigital";
import { settings } from "./settings.svelte";

/** The sign playing full screen, the list it was started from, and its speed. */
class Player {
  playing = $state.raw<SignRef | null>(null);
  /** The list it was started from; its neighbours there are offered on pause. */
  fromList = $state.raw<string | null>(null);
  /** The default, until changed in the player; it holds while stepping through a list. */
  speed = $state.raw<Rate>(settings.defaultSpeed);

  /** Opens the player and gives it a history entry, so the phone's back gesture closes it. */
  play(sign: SignRef, fromList: string | null = null) {
    history.pushState({ playing: true }, "");
    this.playing = sign;
    this.fromList = fromList;
    this.speed = settings.defaultSpeed;
  }

  /** Moves to another sign of the same list, in place: no new history entry. */
  step(sign: SignRef) {
    this.playing = sign;
  }

  close() {
    if (history.state?.playing) history.back();
    else this.closed();
  }

  /** The history entry is gone: by the back arrow, or the phone's back gesture. */
  closed() {
    this.playing = null;
  }
}

export const player = new Player();
