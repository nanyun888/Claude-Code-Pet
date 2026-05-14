export interface Position {
  x: number;
  y: number;
}

export interface ScreenSize {
  width: number;
  height: number;
}

const PET_SIZE = { w: 180, h: 220 };
const MARGIN = 20;

export class MovementEngine {
  private pos: Position;
  private screen: ScreenSize;
  private walkTimer: ReturnType<typeof setTimeout> | null = null;
  private target: Position | null = null;
  private animFrame: number | null = null;
  private onMove: (x: number, y: number) => void;
  private onWalkStart: () => void;
  private onWalkEnd: () => void;
  private isWalking = false;

  constructor(
    initialPos: Position,
    screenSize: ScreenSize,
    callbacks: {
      onMove: (x: number, y: number) => void;
      onWalkStart: () => void;
      onWalkEnd: () => void;
    }
  ) {
    this.pos = { ...initialPos };
    this.screen = screenSize;
    this.onMove = callbacks.onMove;
    this.onWalkStart = callbacks.onWalkStart;
    this.onWalkEnd = callbacks.onWalkEnd;
  }

  startAutoWalk() {
    this.scheduleNextWalk();
  }

  stop() {
    if (this.walkTimer) { clearTimeout(this.walkTimer); this.walkTimer = null; }
    if (this.animFrame) { cancelAnimationFrame(this.animFrame); this.animFrame = null; }
    this.isWalking = false;
    this.target = null;
  }

  updateScreen(size: ScreenSize) {
    this.screen = size;
  }

  setPosition(pos: Position) {
    this.pos = { ...pos };
  }

  private scheduleNextWalk() {
    const delay = 5000 + Math.random() * 10000; // 5-15s
    this.walkTimer = setTimeout(() => {
      this.startWalk();
    }, delay);
  }

  private startWalk() {
    // Pick a random target within screen bounds
    this.target = {
      x: MARGIN + Math.random() * (this.screen.width - PET_SIZE.w - MARGIN * 2),
      y: this.screen.height - PET_SIZE.h - MARGIN + Math.random() * 20 - 10,
    };

    this.isWalking = true;
    this.onWalkStart();
    this.animate();
  }

  private animate() {
    if (!this.target) return;

    const dx = this.target.x - this.pos.x;
    const dy = this.target.y - this.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 2) {
      // Arrived
      this.isWalking = false;
      this.target = null;
      this.onWalkEnd();
      this.scheduleNextWalk();
      return;
    }

    const speed = 1.5;
    const step = Math.min(speed, dist);
    this.pos.x += (dx / dist) * step;
    this.pos.y += (dy / dist) * step;

    this.onMove(this.pos.x, this.pos.y);
    this.animFrame = requestAnimationFrame(() => this.animate());
  }

  /** Drag interaction */
  startDrag(offsetX: number, offsetY: number) {
    this.stop();
    this.isWalking = false;

    const onMove = (e: MouseEvent) => {
      this.pos.x = e.screenX - offsetX;
      this.pos.y = e.screenY - offsetY;
      // Clamp to screen
      this.pos.x = Math.max(MARGIN, Math.min(this.screen.width - PET_SIZE.w - MARGIN, this.pos.x));
      this.pos.y = Math.max(MARGIN, Math.min(this.screen.height - PET_SIZE.h - MARGIN, this.pos.y));
      this.onMove(this.pos.x, this.pos.y);
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      this.scheduleNextWalk();
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  destroy() {
    this.stop();
  }
}