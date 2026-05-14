export type CoreState = 'idle' | 'working' | 'talking' | 'walk' | 'celebrate' | 'error';
export type BonusState = 'wink' | 'nibble' | 'sleep' | 'jump';
export type PetState = CoreState | BonusState;

interface BonusAction {
  name: BonusState;
  weight: number;
  duration: number;
}

const BONUS_ACTIONS: BonusAction[] = [
  { name: 'wink',   weight: 30, duration: 3000 },
  { name: 'nibble', weight: 30, duration: 4000 },
  { name: 'sleep',  weight: 20, duration: 8000 },
  { name: 'jump',   weight: 20, duration: 2000 },
];

const PRIORITY: Record<string, number> = {
  error: 100,
  working: 80,
  talking: 80,
  celebrate: 60,
  walk: 50,
  idle: 10,
  wink: 5,
  nibble: 5,
  sleep: 5,
  jump: 5,
};

export class StateMachine {
  private currentState: PetState = 'idle';
  private coreState: CoreState = 'idle';
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private bonusTimer: ReturnType<typeof setTimeout> | null = null;
  private onChange: (state: PetState) => void;

  constructor(onChange: (state: PetState) => void) {
    this.onChange = onChange;
  }

  get state(): PetState {
    return this.currentState;
  }

  /** Send a core state event (from hooks or user) */
  emit(state: CoreState) {
    // Clear any idle/bonus timers
    this.clearTimers();

    // Priority check
    if (PRIORITY[state] < PRIORITY[this.currentState] && this.currentState !== 'idle') {
      // Lower priority event — ignore unless current is a bonus
      if (!this.isBonus(this.currentState)) return;
    }

    this.coreState = state;
    this.setState(state);

    // If returned to idle, start bonus rotation timer
    if (state === 'idle') {
      this.startIdleTimer();
    }
  }

  /** Force set state (for UI testing) */
  forceSet(state: PetState) {
    this.clearTimers();
    if (this.isBonus(state)) {
      this.setState(state);
      // Auto-return to idle after bonus duration
      const action = BONUS_ACTIONS.find(a => a.name === state);
      if (action) {
        this.bonusTimer = setTimeout(() => {
          this.emit('idle');
        }, action.duration);
      }
    } else {
      this.emit(state as CoreState);
    }
  }

  private setState(state: PetState) {
    if (this.currentState === state) return;
    this.currentState = state;
    this.onChange(state);
  }

  private isBonus(state: PetState): boolean {
    return BONUS_ACTIONS.some(a => a.name === state);
  }

  private startIdleTimer() {
    const delay = 8000 + Math.random() * 7000; // 8-15s
    this.idleTimer = setTimeout(() => {
      this.playRandomBonus();
    }, delay);
  }

  private playRandomBonus() {
    const roll = Math.random() * 100;
    let acc = 0;
    for (const action of BONUS_ACTIONS) {
      acc += action.weight;
      if (roll < acc) {
        this.setState(action.name);
        this.bonusTimer = setTimeout(() => {
          this.emit('idle'); // back to idle, restart timer
        }, action.duration);
        return;
      }
    }
    // Fallback
    this.emit('idle');
  }

  private clearTimers() {
    if (this.idleTimer) { clearTimeout(this.idleTimer); this.idleTimer = null; }
    if (this.bonusTimer) { clearTimeout(this.bonusTimer); this.bonusTimer = null; }
  }

  destroy() {
    this.clearTimers();
  }
}