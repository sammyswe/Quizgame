import Phaser from "phaser";
import {
  LOOT_PER_QUESTION,
  LOOT_STEP,
  emptyAllocations,
  type ItemUsedPayload,
  type RevealPayload,
  type RoomStatePublic,
} from "../../../../shared/src/types";
import { gameEventBridge } from "../GameEventBridge";
import { gameSettings } from "../settings";
import { PROC } from "../assets/spriteKeys";
import { AnswerIsland } from "../objects/AnswerIsland";
import { PlayerAvatar } from "../objects/PlayerAvatar";
import { PlayerShip } from "../objects/PlayerShip";
import { CoinPile } from "../objects/CoinPile";
import { CoinChip } from "../objects/CoinChip";
import { LockInButton } from "../objects/LockInButton";
import { ScoreTicker } from "../objects/ScoreTicker";
import { TargetReticle } from "../objects/TargetReticle";
import { RevealDirector } from "../systems/RevealDirector";
import { soundEventBus } from "../systems/SoundEventBus";
import { BaseScene } from "./BaseScene";

const W = 1280;
const H = 720;

const ISLAND_POSITIONS: [number, number][] = [
  [330, 240],
  [950, 240],
  [330, 470],
  [950, 470],
];

/**
 * The Loot Drop vertical slice: a full animated pirate-casino ocean scene.
 * Players drag treasure from their pile onto answer islands, slam LOCK IN,
 * and watch raider ships plunder the wrong islands during the reveal.
 */
export class LootDropScene extends BaseScene {
  private revealDirector!: RevealDirector;

  // world
  private islands: AnswerIsland[] = [];
  private waves: Phaser.GameObjects.TileSprite[] = [];

  // player dock
  private coinPile!: CoinPile;
  private lockBtn!: LockInButton;
  private scoreTicker!: ScoreTicker;
  private localAvatar: PlayerAvatar | null = null;
  private itemSlot!: Phaser.GameObjects.Container;
  private itemIcon!: Phaser.GameObjects.Image;

  // hud
  private questionText!: Phaser.GameObjects.Text;
  private roundText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private leaderboardPanel: Phaser.GameObjects.Container | null = null;

  // state
  private otherAvatars = new Map<string, PlayerAvatar>();
  private allocations: number[] = emptyAllocations();
  private lockedLocal = false;
  private questionIndex = -1;
  private endsAt = 0;
  private flaggedPlayers = new Set<string>();
  private itemAvailable = true;

  // interaction
  private dragCoin: CoinChip | null = null;
  private hoveredIsland: number | null = null;
  private reticle: TargetReticle | null = null;
  private targetedPlayerId: string | null = null;
  private lootSyncTimer: Phaser.Time.TimerEvent | null = null;

  private unsubscribeBridge: (() => void) | null = null;
  private unsubscribeSettings: (() => void) | null = null;
  private lastAssetMode = gameSettings.assetMode;

  constructor() {
    super("LootDrop");
  }

  create(): void {
    this.initSystems();
    this.revealDirector = new RevealDirector(this);

    this.createBackground();
    this.createIslands();
    this.createHud();
    this.createDock();
    this.setupPointerHandlers();

    this.camDirector.startIdleDrift();

    this.unsubscribeBridge = gameEventBridge.subscribe({
      onRoomState: (state) => this.applyRoomState(state),
      onReveal: (payload) => this.playReveal(payload),
      onItem: (payload) => this.playItemEffect(payload),
    });
    this.unsubscribeSettings = gameSettings.subscribe(() => {
      if (gameSettings.assetMode !== this.lastAssetMode) {
        this.lastAssetMode = gameSettings.assetMode;
        this.scene.restart();
      }
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribeBridge?.();
      this.unsubscribeSettings?.();
      this.revealDirector.cancel();
      this.otherAvatars.clear();
      this.islands = [];
      this.waves = [];
      this.localAvatar = null;
      this.leaderboardPanel = null;
    });

    // catch up with whatever the server already told us
    if (gameEventBridge.lastRoomState) this.applyRoomState(gameEventBridge.lastRoomState);
  }

  // =============================================================== creation

  private createBackground(): void {
    const bgKey = this.assets.background();
    const bg = this.add.image(W / 2, H / 2, bgKey).setDepth(0);
    bg.setDisplaySize(W, H);

    if (bgKey === PROC.oceanBg) {
      const moon = this.add.image(1130, 96, PROC.moon).setDepth(10).setAlpha(0.95);
      this.tweens.add({
        targets: moon,
        alpha: 0.75,
        duration: 2600,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // distant drifting ship silhouettes on the horizon
    for (const [x, y, dir] of [
      [180, 312, 1],
      [1010, 318, -1],
    ] as const) {
      const s = this.add
        .image(x, y, PROC.shipEnemy)
        .setScale(0.22)
        .setTint(0x0a1830)
        .setAlpha(0.85)
        .setDepth(20)
        .setFlipX(dir < 0);
      this.tweens.add({
        targets: s,
        x: x + dir * 90,
        duration: 26000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // parallax fog banks
    for (const [y, scale, dur, alpha] of [
      [330, 1.4, 34000, 0.5],
      [420, 1.9, 46000, 0.35],
      [210, 1.1, 52000, 0.3],
    ] as const) {
      const fog = this.add.image(Phaser.Math.Between(200, 1000), y, PROC.fog).setScale(scale).setAlpha(alpha).setDepth(30);
      this.tweens.add({
        targets: fog,
        x: fog.x > W / 2 ? -240 : W + 240,
        duration: dur,
        repeat: -1,
        yoyo: true,
        ease: "Sine.easeInOut",
      });
    }

    // moving wave bands across the bottom
    for (const [y, alpha, depth] of [
      [618, 0.35, 100],
      [660, 0.45, 110],
      [706, 0.6, 120],
    ] as const) {
      const wave = this.add.tileSprite(W / 2, y, W, 96, PROC.waveLayer).setAlpha(alpha).setDepth(depth);
      this.waves.push(wave);
    }

    // ambient golden sparkles drifting over the water
    this.add
      .particles(0, 0, PROC.spark, {
        x: { min: 0, max: W },
        y: { min: 330, max: 600 },
        scale: { start: 0.7, end: 0 },
        alpha: { start: 0.7, end: 0 },
        tint: [0xffd23e, 0x2ee6ff, 0xff4fd8],
        lifespan: { min: 1500, max: 3200 },
        frequency: 240,
        blendMode: Phaser.BlendModes.ADD,
      })
      .setDepth(40);
  }

  private createIslands(): void {
    this.islands = ISLAND_POSITIONS.map(
      ([x, y], i) =>
        new AnswerIsland(this, x, y, i, this.assets, {
          onTapAdd: (index) => this.tryAllocate(index, LOOT_STEP),
          onRemove: (index) => this.tryAllocate(index, -LOOT_STEP),
          onHover: (index, over) => {
            this.hoveredIsland = over ? index : this.hoveredIsland === index ? null : this.hoveredIsland;
          },
        }),
    );
  }

  private createHud(): void {
    this.addPanel(240, 14, 800, 108, 0xffd23e).setDepth(740);

    this.roundText = this.add
      .text(268, 28, "", {
        fontFamily: '"Luckiest Guy", "Arial Black", sans-serif',
        fontSize: "18px",
        color: "#2ee6ff",
      })
      .setDepth(750);

    this.timerText = this.add
      .text(1012, 28, "", {
        fontFamily: '"Luckiest Guy", "Arial Black", sans-serif',
        fontSize: "24px",
        color: "#ffd23e",
      })
      .setOrigin(1, 0)
      .setDepth(750);

    this.questionText = this.add
      .text(640, 78, "Waiting for the round to start...", {
        fontFamily: '"Nunito", sans-serif',
        fontSize: "25px",
        fontStyle: "900",
        color: "#fdf6dd",
        align: "center",
        wordWrap: { width: 740 },
      })
      .setOrigin(0.5)
      .setDepth(750);
  }

  private createDock(): void {
    this.addPanel(16, 586, 1248, 122, 0x2ee6ff).setDepth(540);

    new PlayerShip(this, 208, 636, this.assets);
    this.coinPile = new CoinPile(this, 372, 648);
    this.scoreTicker = new ScoreTicker(this, 660, 648);

    // reset button
    const reset = this.add.container(816, 648).setDepth(800);
    const resetBg = this.add.graphics();
    resetBg.fillStyle(0x123252, 1);
    resetBg.fillRoundedRect(-58, -24, 116, 48, 14);
    resetBg.lineStyle(3, 0x2ee6ff, 0.8);
    resetBg.strokeRoundedRect(-58, -24, 116, 48, 14);
    const resetLabel = this.add
      .text(0, 0, "RESET", {
        fontFamily: '"Luckiest Guy", "Arial Black", sans-serif',
        fontSize: "20px",
        color: "#9fdcff",
      })
      .setOrigin(0.5);
    reset.add([resetBg, resetLabel]);
    reset.setSize(116, 48).setInteractive({ useHandCursor: true });
    reset.on("pointerdown", () => {
      if (this.lockedLocal || this.revealDirector.playing) return;
      this.tweens.add({ targets: reset, scale: { from: 0.9, to: 1 }, duration: 150 });
      this.resetAllocations(true);
      gameEventBridge.sendResetLoot();
    });

    this.lockBtn = new LockInButton(this, 1078, 648, () => this.lockIn());

    // fear shot item slot
    this.itemSlot = this.add.container(500, 648).setDepth(800);
    const slotBg = this.add.graphics();
    slotBg.fillStyle(0x1c1230, 0.9);
    slotBg.fillRoundedRect(-34, -34, 68, 68, 16);
    slotBg.lineStyle(3, 0xff4fd8, 0.9);
    slotBg.strokeRoundedRect(-34, -34, 68, 68, 16);
    this.itemIcon = this.add.image(0, -4, PROC.reticle).setScale(0.62);
    const slotLabel = this.add
      .text(0, 26, "FEAR SHOT", {
        fontFamily: '"Nunito", sans-serif',
        fontSize: "9px",
        fontStyle: "900",
        color: "#ff9ae6",
      })
      .setOrigin(0.5);
    this.itemSlot.add([slotBg, this.itemIcon, slotLabel]);
    this.itemSlot.setSize(68, 68).setInteractive({ useHandCursor: true });
    this.itemSlot.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.startItemDrag(pointer));
    this.tweens.add({
      targets: this.itemIcon,
      angle: 360,
      duration: 6000,
      repeat: -1,
    });
  }

  // =========================================================== interactions

  private setupPointerHandlers(): void {
    // dragging a coin from the pile
    this.coinPile.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.lockedLocal || this.revealDirector.playing) return;
      if (this.remainingLoot() <= 0) {
        this.tweens.add({ targets: this.coinPile, x: { from: this.coinPile.x - 5, to: this.coinPile.x + 5 }, duration: 50, yoyo: true, repeat: 2 });
        return;
      }
      this.dragCoin?.destroy();
      this.dragCoin = new CoinChip(this, pointer.worldX, pointer.worldY, "coin");
      this.dragCoin.setScale(1.15);
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      this.dragCoin?.setPosition(pointer.worldX, pointer.worldY);
      if (this.reticle) {
        this.reticle.setPosition(pointer.worldX, pointer.worldY);
        this.updateItemTarget(pointer);
      }
    });

    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (this.dragCoin) {
        const coin = this.dragCoin;
        this.dragCoin = null;
        const island = this.islandUnderPointer(pointer);
        if (island && this.canAllocate(island.index, LOOT_STEP)) {
          coin.flyTo(island.x, island.y - 10, 240, () => {
            this.applyAllocation(island.index, LOOT_STEP);
          });
        } else {
          coin.flyTo(this.coinPile.x, this.coinPile.y, 300);
        }
      }
      if (this.reticle) this.releaseItemDrag();
    });
  }

  private islandUnderPointer(pointer: Phaser.Input.Pointer): AnswerIsland | null {
    for (const island of this.islands) {
      const dx = pointer.worldX - island.x;
      const dy = pointer.worldY - island.y;
      if (Math.abs(dx) < 145 && dy > -115 && dy < 125) return island;
    }
    return null;
  }

  private remainingLoot(): number {
    return LOOT_PER_QUESTION - this.allocations.reduce((a, b) => a + b, 0);
  }

  private canAllocate(index: number, delta: number): boolean {
    if (this.lockedLocal || this.revealDirector.playing) return false;
    const next = this.allocations[index] + delta;
    if (next < 0) return false;
    if (delta > 0 && this.remainingLoot() < delta) return false;
    return true;
  }

  /** Tap-to-add / right-click-to-remove path: animates a coin flight first. */
  private tryAllocate(index: number, delta: number): void {
    if (!this.canAllocate(index, delta)) {
      if (delta > 0 && this.remainingLoot() < delta && !this.lockedLocal) {
        this.vfx.scorePop(this.islands[index].x, this.islands[index].y - 90, "NO LOOT LEFT!", "#ff5566");
      }
      return;
    }
    const island = this.islands[index];
    if (delta > 0) {
      const coin = new CoinChip(this, this.coinPile.x, this.coinPile.y - 20, "coin");
      coin.flyTo(island.x, island.y - 10, 380, () => this.applyAllocation(index, delta));
    } else {
      const coin = new CoinChip(this, island.x, island.y - 10, "chip");
      coin.flyTo(this.coinPile.x, this.coinPile.y, 380);
      this.applyAllocation(index, delta);
    }
  }

  private applyAllocation(index: number, delta: number): void {
    if (!this.canAllocate(index, delta)) return;
    this.allocations[index] += delta;
    const island = this.islands[index];
    island.setAllocation(this.allocations[index]);
    this.coinPile.setRemaining(this.remainingLoot());
    if (delta > 0) {
      island.receivePulse();
      this.vfx.sparkleBurst(island.x, island.y - 10, 0xffd23e, 6);
      soundEventBus.emit("coinPlace");
    }
    this.scheduleLootSync();
  }

  private scheduleLootSync(): void {
    this.lootSyncTimer?.remove();
    this.lootSyncTimer = this.time.delayedCall(180, () => {
      gameEventBridge.sendLoot([...this.allocations]);
    });
  }

  private resetAllocations(animate: boolean): void {
    this.allocations = emptyAllocations();
    this.islands.forEach((island) => island.setAllocation(0));
    this.coinPile.setRemaining(LOOT_PER_QUESTION);
    if (animate) this.vfx.coinBurst(this.coinPile.x, this.coinPile.y - 20, 6);
  }

  private lockIn(): void {
    if (this.lockedLocal || this.revealDirector.playing) return;
    this.lockedLocal = true;
    this.lockBtn.slam();
    soundEventBus.emit("lockIn");
    this.camDirector.lockInPunch();
    this.camDirector.shake(0.004, 150);
    this.vfx.sparkleBurst(this.lockBtn.x, this.lockBtn.y, 0xff5566, 16);
    this.localAvatar?.setLocked(true);
    gameEventBridge.sendLoot([...this.allocations]);
    gameEventBridge.sendLockIn();
  }

  // ---------------------------------------------------------- item targeting

  private startItemDrag(pointer: Phaser.Input.Pointer): void {
    if (!this.itemAvailable || this.revealDirector.playing) return;
    if (this.otherAvatars.size === 0) {
      this.vfx.scorePop(this.itemSlot.x, this.itemSlot.y - 60, "NO TARGETS!", "#9fdcff");
      return;
    }
    this.reticle?.destroy();
    this.reticle = new TargetReticle(this, pointer.worldX, pointer.worldY);
    this.itemIcon.setAlpha(0.3);
  }

  private updateItemTarget(pointer: Phaser.Input.Pointer): void {
    let found: string | null = null;
    for (const [id, avatar] of this.otherAvatars) {
      const d = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, avatar.x, avatar.y);
      if (d < 60) {
        found = id;
        break;
      }
    }
    if (found !== this.targetedPlayerId) {
      if (this.targetedPlayerId) this.otherAvatars.get(this.targetedPlayerId)?.setTargeted(false);
      if (found) this.otherAvatars.get(found)?.setTargeted(true);
      this.targetedPlayerId = found;
    }
  }

  private releaseItemDrag(): void {
    const target = this.targetedPlayerId;
    if (target) {
      this.otherAvatars.get(target)?.setTargeted(false);
      gameEventBridge.sendFearShot(target);
      soundEventBus.emit("itemUse");
      this.itemAvailable = false;
      this.itemIcon.setAlpha(0.15);
    } else {
      this.itemIcon.setAlpha(this.itemAvailable ? 1 : 0.15);
    }
    this.reticle?.destroy();
    this.reticle = null;
    this.targetedPlayerId = null;
  }

  private playItemEffect(payload: ItemUsedPayload): void {
    if (payload.type !== "fearShot") return;
    const from =
      payload.fromId === gameEventBridge.localPlayerId
        ? { x: this.itemSlot.x, y: this.itemSlot.y }
        : this.avatarPoint(payload.fromId);
    const to =
      payload.targetId === gameEventBridge.localPlayerId
        ? { x: this.coinPile.x - 170, y: 645 }
        : this.avatarPoint(payload.targetId);
    if (!from || !to) return;
    const shot = this.add.image(from.x, from.y, PROC.cannonball).setDepth(960).setScale(1.2);
    this.tweens.add({
      targets: shot,
      x: to.x,
      y: to.y,
      duration: 420,
      ease: "Quad.easeIn",
      onComplete: () => {
        shot.destroy();
        this.vfx.cannonImpact(to.x, to.y);
        this.camDirector.shake(0.006, 200);
        if (payload.targetId === gameEventBridge.localPlayerId) {
          this.localAvatar?.react("scared");
          this.vfx.scorePop(W / 2, 360, "YOU'VE BEEN FEAR SHOT!", "#ff5566");
        } else {
          this.otherAvatars.get(payload.targetId)?.react("scared");
        }
      },
    });
  }

  private avatarPoint(playerId: string): { x: number; y: number } | null {
    if (playerId === gameEventBridge.localPlayerId) {
      return this.localAvatar ? { x: this.localAvatar.x, y: this.localAvatar.y } : null;
    }
    const avatar = this.otherAvatars.get(playerId);
    return avatar ? { x: avatar.x, y: avatar.y } : null;
  }

  // ============================================================ state sync

  private applyRoomState(state: RoomStatePublic): void {
    const localId = gameEventBridge.localPlayerId;
    const self = state.players.find((p) => p.id === localId) ?? null;

    // new question?
    if (state.question && state.question.index !== this.questionIndex && state.phase === "allocating") {
      this.startNewQuestion(state);
    }

    if (state.question) this.endsAt = state.question.endsAt;

    // local player dock
    if (self) {
      if (!this.localAvatar) {
        this.localAvatar = new PlayerAvatar(this, 92, 642, self.id, self.avatarId, "YOU", 0.92);
      }
      if (!this.revealDirector.playing) {
        this.localAvatar.setScore(self.score);
        this.scoreTicker.setScore(self.score, false);
      }
      this.localAvatar.setScared(self.scared);
      this.itemAvailable = self.hasItem;
      this.itemIcon.setAlpha(this.reticle ? 0.3 : self.hasItem ? 1 : 0.15);
      if (self.lockedIn && !this.lockedLocal) {
        this.lockedLocal = true;
        this.lockBtn.setLockedState(true);
        this.localAvatar.setLocked(true);
      }
    }

    // other players
    const others = state.players.filter((p) => p.id !== localId);
    const seen = new Set<string>();
    others.forEach((p, i) => {
      seen.add(p.id);
      let avatar = this.otherAvatars.get(p.id);
      if (!avatar) {
        const side = i % 2 === 0 ? 54 : W - 54;
        const row = Math.floor(i / 2);
        avatar = new PlayerAvatar(this, side, 208 + row * 118, p.id, p.avatarId, p.nickname, 0.78);
        this.otherAvatars.set(p.id, avatar);
      }
      avatar.setLocked(p.lockedIn);
      avatar.setConnected(p.connected);
      avatar.setScared(p.scared);
      if (!this.revealDirector.playing) avatar.setScore(p.score);
    });
    for (const [id, avatar] of [...this.otherAvatars]) {
      if (!seen.has(id)) {
        avatar.destroy();
        this.otherAvatars.delete(id);
      }
    }

    // confidence flags once players lock in
    for (const p of state.players) {
      if (p.lockedIn && p.flagIsland !== null && !this.flaggedPlayers.has(p.id)) {
        this.flaggedPlayers.add(p.id);
        this.islands[p.flagIsland]?.addConfidenceFlag(p.avatarId);
      }
    }

    // question hud
    if (state.question) {
      this.questionText.setText(state.question.text);
      this.roundText.setText(`ROUND ${state.question.index + 1}/${state.question.total} - LOOT DROP`);
      state.question.options.forEach((opt, i) => this.islands[i]?.setAnswer(opt));
    }
  }

  private startNewQuestion(state: RoomStatePublic): void {
    this.questionIndex = state.question?.index ?? this.questionIndex;
    this.revealDirector.cancel();
    this.hideLeaderboard();
    this.lockedLocal = false;
    this.flaggedPlayers.clear();
    this.lockBtn.setLockedState(false);
    this.localAvatar?.setLocked(false);
    this.resetAllocations(false);
    this.islands.forEach((island) => island.resetForNewQuestion());
    this.camDirector.reset(500);
    if (state.question) {
      state.question.options.forEach((opt, i) => this.islands[i]?.setAnswer(opt));
      // question entrance: islands pop in sequence
      this.islands.forEach((island, i) => {
        this.time.delayedCall(120 * i, () => island.pulse());
      });
      this.vfx.sparkleBurst(640, 78, 0x2ee6ff, 12);
    }
  }

  private playReveal(payload: RevealPayload): void {
    // ensure our final allocations are reflected locally even if we never locked
    this.islands.forEach((island, i) => island.setAllocation(this.allocations[i]));
    this.revealDirector.play(payload, {
      islands: this.islands,
      avatars: this.buildAvatarMap(),
      localPlayerId: gameEventBridge.localPlayerId,
      scoreTicker: this.scoreTicker,
      vfx: this.vfx,
      camera: this.camDirector,
      showLeaderboard: (leaderboard) => this.showLeaderboard(leaderboard),
      hideLeaderboard: () => this.hideLeaderboard(),
    });
  }

  private buildAvatarMap(): Map<string, PlayerAvatar> {
    const map = new Map(this.otherAvatars);
    if (this.localAvatar && gameEventBridge.localPlayerId) {
      map.set(gameEventBridge.localPlayerId, this.localAvatar);
    }
    return map;
  }

  // ============================================================ leaderboard

  private showLeaderboard(leaderboard: RevealPayload["leaderboard"]): void {
    this.hideLeaderboard();
    const rows = leaderboard.slice(0, 6);
    const height = 86 + rows.length * 52;
    const panel = this.add.container(640, -height).setDepth(980);

    const bg = this.add.graphics();
    bg.fillStyle(0x0d1b33, 0.94);
    bg.fillRoundedRect(-230, 0, 460, height, 22);
    bg.lineStyle(4, 0xffd23e, 0.9);
    bg.strokeRoundedRect(-230, 0, 460, height, 22);
    panel.add(bg);

    const title = this.add
      .text(0, 34, "LEADERBOARD", {
        fontFamily: '"Luckiest Guy", "Arial Black", sans-serif',
        fontSize: "30px",
        color: "#ffd23e",
        stroke: "#1c1230",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    panel.add(title);

    rows.forEach((entry, i) => {
      const y = 86 + i * 52;
      const isLocal = entry.playerId === gameEventBridge.localPlayerId;
      const medal = ["#ffd23e", "#c9d4e8", "#d29a6b"][i] ?? "#9fdcff";
      panel.add(
        this.add
          .text(-196, y, `${i + 1}`, {
            fontFamily: '"Luckiest Guy", "Arial Black", sans-serif',
            fontSize: "24px",
            color: medal,
          })
          .setOrigin(0.5),
      );
      panel.add(
        this.add
          .text(-160, y - 13, isLocal ? `${entry.nickname} (YOU)` : entry.nickname, {
            fontFamily: '"Nunito", sans-serif',
            fontSize: "21px",
            fontStyle: "900",
            color: isLocal ? "#2ee6ff" : "#fdf6dd",
          })
          .setOrigin(0, 0),
      );
      panel.add(
        this.add
          .text(196, y, String(entry.score), {
            fontFamily: '"Luckiest Guy", "Arial Black", sans-serif',
            fontSize: "24px",
            color: "#ffd23e",
          })
          .setOrigin(1, 0.5),
      );
    });

    this.leaderboardPanel = panel;
    this.tweens.add({
      targets: panel,
      y: 130,
      duration: 550,
      ease: "Back.easeOut",
    });
  }

  private hideLeaderboard(): void {
    if (!this.leaderboardPanel) return;
    const panel = this.leaderboardPanel;
    this.leaderboardPanel = null;
    this.tweens.add({
      targets: panel,
      y: -500,
      duration: 380,
      ease: "Cubic.easeIn",
      onComplete: () => panel.destroy(),
    });
  }

  // ================================================================= update

  update(_time: number, delta: number): void {
    const speeds = [0.012, 0.02, 0.034];
    this.waves.forEach((wave, i) => {
      wave.tilePositionX += speeds[i] * delta * (i % 2 === 0 ? 1 : -1);
    });

    if (this.endsAt > 0 && !this.revealDirector.playing) {
      const remaining = Math.max(0, Math.ceil((this.endsAt - Date.now()) / 1000));
      this.timerText.setText(`${remaining}s`);
      this.timerText.setColor(remaining <= 10 ? "#ff5566" : "#ffd23e");
      if (remaining <= 10 && remaining > 0 && this.timerText.scale === 1) {
        this.tweens.add({
          targets: this.timerText,
          scale: { from: 1.25, to: 1 },
          duration: 320,
        });
      }
    } else if (this.revealDirector.playing) {
      this.timerText.setText("");
    }
  }
}
