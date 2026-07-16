import Phaser from "phaser";
import {
  ARCADE,
  POWERUPS,
  potAt,
  type PowerUpId,
  type PrivatePlayerState,
  type PublicGameState,
  type PublicPlayer,
} from "@treasure-trap/shared";
import { FX_INDEX, ITEM_ICON_INDEX, preloadVoyageAssets, VOYAGE } from "../assets/voyageAssets";
import { PLUNDER_VIDEO } from "../assets/voyagePlunderVideos";
import {
  gameEventBridge,
  type FiredPowerUp,
  type GameSnapshot,
  type TargetingIntent,
} from "../GameEventBridge";

const W = 1280;
const H = 720;
/** Full-bleed landscape question world (fleet rank sidebar removed). */
const WORLD_W = 1280;
/** Desktop 2×2 grid — smaller islands, big gutters so they never feel smushed. */
const ISLAND_POSITIONS: ReadonlyArray<readonly [number, number]> = [
  [250, 275],
  [1030, 275],
  [250, 505],
  [1030, 505],
];
/** Open water at the geometric centre of the four islands — fleet staging point. */
const FLEET_HOME = { x: W / 2, y: 390 } as const;
const ISLAND_DISPLAY: readonly [number, number] = [300, 225];
const QUESTION_BAR = { x: 160, y: 14, w: 900, h: 58 } as const;
/** Top-right loot chest — fixed pixel box, inset so it never clips the canvas. */
const POT_CHEST_POS = { x: 1208, y: 48 } as const;
const GOLD_BAR = { x: 160, y: 80, w: 900, h: 14 } as const;
const CHEST_BASE_SIZE = { w: 64, h: 60 } as const;
const BIOME_FRAME: Record<string, number> = {
  volcano: 0,
  jungle: 1,
  skull: 2,
  lagoon: 3,
  shipwreck: 4,
  ruins: 5,
  lighthouse: 6,
  mangrove: 7,
};
const PLAYER_COLORS = [0x38bdf8, 0xf97316, 0xa78bfa, 0x22c55e, 0xfb7185, 0xfacc15, 0x2dd4bf, 0xe879f9];
const INK = 0x17233b;
const GOLD = 0xffcf45;

type IslandView = {
  root: Phaser.GameObjects.Container;
  glow: Phaser.GameObjects.Ellipse;
  answer: Phaser.GameObjects.Text;
  amount?: Phaser.GameObjects.Text;
};

export class ArcadeGameplayScene extends Phaser.Scene {
  private snapshot: GameSnapshot = {};
  private unsubscribe?: () => void;
  private modeKey = "";
  /** Narrow rebuild key for in-question UI (lock / inventory) without wiping every tick. */
  private questionUiKey = "";
  private draftChoice?: number;
  private draftAllocation = [0, 0, 0, 0];
  private ships = new Map<string, Phaser.GameObjects.Container>();
  private islands: IslandView[] = [];
  private timerText?: Phaser.GameObjects.Text;
  private potText?: Phaser.GameObjects.Text;
  private potChest?: Phaser.GameObjects.Container;
  private potBarFill?: Phaser.GameObjects.Graphics;
  private potChestA?: Phaser.GameObjects.Image;
  private potChestB?: Phaser.GameObjects.Image;
  private potFrameA = 0;
  private lastDrainEmitAt = 0;
  private hudVisible = true;
  private hudNodes: Phaser.GameObjects.GameObject[] = [];
  private flagMarkers = new Map<number, Phaser.GameObjects.Container>();
  private armedItem?: TargetingIntent;
  private lastFiredKey = 0;
  private lastRevealKey = "";
  private mutinyConfirming = false;
  /** Queue so every arriving ship gets a full cinematic without overlapping fullscreen. */
  private plunderCinematicQueue: Array<() => void> = [];
  private plunderCinematicBusy = false;
  /** Tracks sheet slice stamps so rebuilt WebPs re-frame after HMR. */
  private sheetSliceStamp = new Map<string, string>();

  constructor() {
    super("ArcadeGameplay");
  }

  preload(): void {
    // Do NOT preload plunder MP4s here — 8×~5MB videos stall Phaser create()
    // and leave a blank blue canvas between questions.
    preloadVoyageAssets(this.load);
  }

  create(): void {
    this.generateFallbackTextures();
    this.sliceVoyageSheets();
    this.unsubscribe = gameEventBridge.subscribe((snapshot) => this.applySnapshot(snapshot));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribe?.());
  }

  override update(): void {
    const game = this.snapshot.game;
    if (!game) return;
    if (this.timerText) {
      const remaining = Math.max(0, game.timerEndsAt - Date.now());
      this.timerText.setText(`${Math.ceil(remaining / 1000)}s`);
    }

    if (game.phase === "question" && !game.arcade?.isEventRound && game.arcade) {
      this.tickPotDrain(game);
    }
  }

  /** Smooth pot UI every frame — gold bar + coin stream + blended chest frames. */
  private tickPotDrain(game: PublicGameState): void {
    const arcade = game.arcade;
    if (!arcade) return;
    const pot = potAt(Date.now(), arcade.questionStartedAt, arcade.questionDurationMs);
    const ratio = pot / Math.max(1, arcade.potMax);
    this.potText?.setText(`${pot}`);
    this.potText?.setColor(ratio < 0.28 ? "#ff7f66" : "#ffd45f");

    if (this.potBarFill) {
      this.potBarFill.clear();
      const fillW = Math.max(2, GOLD_BAR.w * ratio);
      this.potBarFill.fillStyle(ratio < 0.28 ? 0xff6b4a : 0xffc94a, 1);
      this.potBarFill.fillRoundedRect(GOLD_BAR.x + 2, GOLD_BAR.y + 2, fillW - 4, GOLD_BAR.h - 4, 6);
      this.potBarFill.fillStyle(0xfff2a8, 0.35);
      this.potBarFill.fillRoundedRect(GOLD_BAR.x + 4, GOLD_BAR.y + 3, Math.max(0, fillW - 10), 4, 3);
    }

    // Chest shell: fixed on-screen box. Only sprite frame (coin pile) changes.
    if (this.potChestA && this.textures.exists(VOYAGE.potDrain.key)) {
      const durationSec = Math.max(1, arcade.questionDurationMs / 1000);
      const elapsedSec = Math.max(
        0,
        Math.floor((Date.now() - arcade.questionStartedAt) / 1000),
      );
      const maxOpen = 5;
      const frame = Math.min(maxOpen, Math.floor((elapsedSec / durationSec) * (maxOpen + 0.99)));
      if (frame !== this.potFrameA) {
        this.potFrameA = frame;
        const key = `f${frame}`;
        if (this.potChestA.texture.has(key)) this.potChestA.setFrame(key);
        if (this.potChestB?.texture.has(key)) this.potChestB.setFrame(key);
      }
      this.lockChestDisplaySize();
      this.potChestA.setAlpha(1);
      this.potChestB?.setAlpha(0);
    }

    // Continuous loot stream UNDER the question bar (not a choppy sheet flicker).
    const now = Date.now();
    const emitEvery = ratio > 0.05 ? Math.max(40, 55 + ratio * 90) : 99999;
    if (now - this.lastDrainEmitAt >= emitEvery) {
      this.lastDrainEmitAt = now;
      this.emitDrainCoin(ratio);
    }
  }

  private emitDrainCoin(ratio: number): void {
    // Chest is top-right — coins stream left along the gold bar as loot drains.
    const startX = POT_CHEST_POS.x - 18;
    const startY = GOLD_BAR.y + GOLD_BAR.h / 2;
    const endX = GOLD_BAR.x + GOLD_BAR.w * (1 - Math.max(0.08, ratio)) + Phaser.Math.Between(-12, 12);
    const useSheet = this.textures.exists(VOYAGE.lootParticles.key);
    if (useSheet) {
      this.ensureSheetFrames(VOYAGE.lootParticles.key, VOYAGE.lootParticles.cols, VOYAGE.lootParticles.rows);
      const frame = Phaser.Math.Between(0, 3);
      const coin = this.add
        .image(startX, startY, VOYAGE.lootParticles.key, `f${frame}`)
        .setDisplaySize(22, 22)
        .setDepth(36)
        .setAlpha(0.95);
      this.tweens.add({
        targets: coin,
        x: endX,
        y: startY + Phaser.Math.Between(-6, 10),
        angle: 220,
        alpha: 0,
        duration: 700 + Phaser.Math.Between(0, 220),
        ease: "Cubic.easeOut",
        onComplete: () => coin.destroy(),
      });
      return;
    }
    const coin = this.add.image(startX, startY, "coin").setDisplaySize(18, 18).setDepth(36);
    this.tweens.add({
      targets: coin,
      x: endX,
      y: startY + Phaser.Math.Between(-4, 8),
      angle: 180,
      alpha: 0,
      duration: 680,
      ease: "Cubic.easeOut",
      onComplete: () => coin.destroy(),
    });
  }

  private applySnapshot(snapshot: GameSnapshot): void {
    const previous = this.snapshot;
    this.snapshot = snapshot;
    const game = snapshot.game;
    if (!game) return;

    const me = game.players.find((player) => player.id === snapshot.playerId);
    // Keep the last question/reveal world under the leaderboard overlay —
    // never switch to a blank "waiting" sea that looks like a crash.
    const mode = game.phase === "reveal"
      ? "reveal"
      : game.phase === "leaderboard"
        ? "board"
        : game.phase === "question" && me?.marooned
          ? "marooned"
          : game.phase === "question" && game.arcade?.isEventRound
            ? "loot"
            : game.phase === "question"
              ? "question"
              : "waiting";
    const nextKey = `${mode}:${game.question?.id ?? game.questionNumber ?? "none"}:${game.phase}`;

    const firedChanged = snapshot.fired && snapshot.fired.key !== this.lastFiredKey;
    const targetingChanged = snapshot.targeting !== previous.targeting;
    const privateChanged = snapshot.priv !== previous.priv;
    const gameChanged = snapshot.game !== previous.game;

    if (nextKey !== this.modeKey) {
      this.modeKey = nextKey;
      this.questionUiKey = "";
      this.draftChoice = snapshot.priv?.selectedChoiceIndex;
      this.draftAllocation = [...(snapshot.priv?.lootAllocation ?? [0, 0, 0, 0])];
      this.mutinyConfirming = false;
      this.lastRevealKey = "";
      this.renderMode(mode);
    } else if (mode === "question") {
      // Pot drain is tick-driven — do NOT wipe the scene every public-state pulse.
      const uiKey = [
        me?.hasAnswered ? "1" : "0",
        snapshot.priv?.selectedChoiceIndex ?? "x",
        this.draftChoice ?? "d",
        snapshot.priv?.powerUps?.length ?? 0,
        snapshot.priv?.hasMutinied ? "m" : "n",
        me?.marooned ? "maroon" : "free",
      ].join(":");
      if (uiKey !== this.questionUiKey) {
        this.questionUiKey = uiKey;
        this.renderMode(mode);
      }
    } else if (mode === "reveal" || mode === "board") {
      // Sail / plunder / board freeze must survive server ticks — never wipe mid-sequence.
    } else if (gameChanged || privateChanged) {
      this.renderMode(mode);
    }

    if (targetingChanged) {
      this.armedItem = snapshot.targeting;
      this.renderTargeting();
    }
    if (firedChanged && snapshot.fired) {
      this.lastFiredKey = snapshot.fired.key;
      this.playItemEffect(snapshot.fired);
    }
  }

  private renderMode(mode: string): void {
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.children.removeAll(true);
    this.ships.clear();
    this.islands = [];
    this.timerText = undefined;
    this.potText = undefined;
    this.potChest = undefined;
    this.potBarFill = undefined;
    this.potChestA = undefined;
    this.potChestB = undefined;
    this.potFrameA = 0;
    this.lastDrainEmitAt = 0;
    this.hudNodes = [];
    this.plunderCinematicQueue = [];
    this.plunderCinematicBusy = false;
    this.cameras.main.setZoom(1);
    this.cameras.main.centerOn(W / 2, H / 2);

    try {
      if (mode === "loot") this.renderLootDrop();
      else if (mode === "marooned") this.renderMarooned();
      else if (mode === "reveal") this.renderReveal();
      else if (mode === "question") this.renderQuestion();
      else if (mode === "board") {
        // Freeze a readable sea under the React leaderboard — do not wipe to empty.
        this.renderSeaWorld();
        this.createFleet(this.snapshot.game!);
      } else this.renderSeaWorld();
    } catch (error) {
      // Never leave a wiped blue canvas if a sprite frame is missing after HMR.
      console.error("[ArcadeGameplay] render failed", error);
      this.renderSeaWorld();
      this.showNotice("Charting waters…", "#ffe18a");
    }
  }

  // ---------------------------------------------------------------------------
  // Shared world and HUD
  // ---------------------------------------------------------------------------

  private renderSeaWorld(): void {
    const bgKey = this.textures.exists(VOYAGE.bgQuiz.key) ? VOYAGE.bgQuiz.key : VOYAGE.bgSea.key;
    if (this.textures.exists(bgKey)) {
      const bg = this.add.image(WORLD_W / 2, H / 2, bgKey).setDisplaySize(WORLD_W * 1.04, H * 1.04).setDepth(-3);
      this.tweens.add({
        targets: bg,
        x: { from: WORLD_W / 2 - 10, to: WORLD_W / 2 + 10 },
        y: { from: H / 2 - 4, to: H / 2 + 4 },
        duration: 14000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    } else {
      const sky = this.add.graphics();
      sky.fillGradientStyle(0x74cbea, 0x74cbea, 0xf6c978, 0xf6c978, 0.72);
      sky.fillRect(0, 0, WORLD_W, 300);
      sky.setDepth(-2);
      const water = this.add.graphics();
      water.fillGradientStyle(0x267fa6, 0x267fa6, 0x0d547d, 0x0d547d, 0.88);
      water.fillRect(0, 300, WORLD_W, 420);
      water.setDepth(-1);
      this.addSun();
    }

    this.spawnAliveSeaAmbience();

    const veil = this.add.graphics();
    veil.fillStyle(0x0d2a40, 0.08);
    veil.fillRect(0, 0, WORLD_W, H);
    veil.setDepth(-1);
  }

  /** Soft living water — drift, shimmer and crests without collage props. */
  private spawnAliveSeaAmbience(): void {
    // Slow cloud banks across the sky band.
    for (let i = 0; i < 3; i += 1) {
      const cloud = this.add.ellipse(
        -80 + i * 420,
        70 + (i % 2) * 36,
        160 + i * 40,
        36 + (i % 2) * 10,
        0xffffff,
        0.1 + i * 0.02,
      ).setDepth(-2.5);
      this.tweens.add({
        targets: cloud,
        x: WORLD_W + 120,
        duration: 28000 + i * 6000,
        repeat: -1,
        ease: "Linear",
      });
    }

    // Gentle water shimmer ribbons between islands.
    for (let i = 0; i < 4; i += 1) {
      const band = this.add.ellipse(
        200 + i * 280,
        360 + (i % 2) * 80,
        220,
        18,
        0xb8eff2,
        0.08,
      ).setDepth(-1.5);
      this.tweens.add({
        targets: band,
        alpha: { from: 0.04, to: 0.14 },
        scaleX: { from: 0.9, to: 1.08 },
        x: band.x + (i % 2 ? 30 : -30),
        duration: 2600 + i * 350,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // Sparse low crests in open water only (not over islands).
    if (this.textures.exists(VOYAGE.waves.key)) {
      this.ensureAnim("voyage-wave-crest", VOYAGE.waves.key, 4, 5, -1);
      const spots: Array<readonly [number, number]> = [
        [640, 340],
        [480, 420],
        [800, 420],
        [640, 500],
      ];
      spots.forEach(([x, y], i) => {
        const wave = this.add
          .sprite(x, y, VOYAGE.waves.key, "f0")
          .setDisplaySize(120, 56)
          .setAlpha(0.28)
          .setDepth(-1.2);
        wave.play("voyage-wave-crest");
        this.tweens.add({
          targets: wave,
          x: x + (i % 2 ? 24 : -24),
          alpha: { from: 0.16, to: 0.32 },
          duration: 3000 + i * 280,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      });
    }

    // Tiny drifting sparkles / foam puffs.
    for (let i = 0; i < 8; i += 1) {
      const spark = this.add.circle(
        80 + i * 150,
        300 + (i % 3) * 90,
        2 + (i % 3),
        0xfff6d0,
        0.35,
      ).setDepth(-1.1);
      this.tweens.add({
        targets: spark,
        y: spark.y - 18,
        alpha: { from: 0.1, to: 0.45 },
        duration: 2200 + i * 180,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        delay: i * 120,
      });
    }
  }

  private addSun(): void {
    const sun = this.add.circle(120, 104, 48, 0xffe5a0, 0.96);
    sun.setStrokeStyle(10, 0xfff1bd, 0.28);
    this.tweens.add({ targets: sun, scale: 1.08, alpha: 0.82, duration: 2300, yoyo: true, repeat: -1 });
  }

  private createQuestionBanner(game: PublicGameState): void {
    const { x, y, w, h } = QUESTION_BAR;
    const panel = this.add.graphics().setDepth(28);
    panel.fillStyle(0xf0d9a0, 0.96);
    panel.lineStyle(5, 0x7a4a22, 1);
    panel.fillRoundedRect(x, y, w, h, 16);
    panel.strokeRoundedRect(x, y, w, h, 16);
    panel.fillStyle(0xe8c57a, 0.45);
    panel.fillRoundedRect(x + 14, y + 8, w - 28, 12, 6);
    const prompt = this.add
      .text(x + w / 2, y + h / 2 + 2, game.question?.prompt ?? "Charting the next waters...", {
        fontFamily: "Nunito, sans-serif",
        fontStyle: "900",
        fontSize: "21px",
        color: "#2f1c10",
        align: "center",
        wordWrap: { width: w - 36 },
      })
      .setOrigin(0.5)
      .setDepth(29);
    this.trackHud(panel, prompt);
  }

  /** Scores now show on the post-question leaderboard screen — no in-question sidebar. */
  private createLeaderboard(_game: PublicGameState): void {}

  /** Numeric timer removed — draining pot chest is the clock. */
  private createTimer(): void {
    this.timerText = undefined;
  }

  private createInventory(game: PublicGameState, priv?: PrivatePlayerState): void {
    const items = priv?.powerUps ?? [];
    if (items.length === 0) {
      // Compact empty booty chip — does not dominate the shore.
      const chip = this.add.container(72, 676).setDepth(50);
      const bg = this.add.rectangle(0, 0, 96, 36, 0x10243a, 0.75).setStrokeStyle(3, 0x9c6a3d);
      const label = this.add.text(0, 0, "BOOTY", {
        fontFamily: "Lilita One",
        fontSize: "14px",
        color: "#f4d986",
      }).setOrigin(0.5);
      chip.add([bg, label]);
      this.trackHud(chip);
      return;
    }
    const dock = this.add.graphics().setDepth(50);
    dock.fillStyle(0x10243a, 0.92);
    dock.lineStyle(3, 0x9c6a3d, 1);
    dock.fillRoundedRect(16, 648, 52 + items.length * 72, 56, 14);
    dock.strokeRoundedRect(16, 648, 52 + items.length * 72, 56, 14);
    const title = this.add.text(28, 666, "BOOTY", {
      fontFamily: "Lilita One",
      fontSize: "12px",
      color: "#f4d986",
    }).setOrigin(0, 0.5).setDepth(51);
    this.trackHud(dock, title);
    items.slice(0, 5).forEach((item, i) => {
      const x = 78 + i * 70;
      if (this.textures.exists(VOYAGE.items.key)) {
        const icon = this.add.image(x, 676, VOYAGE.items.key).setDepth(51);
        this.cropGridImage(icon, VOYAGE.items.cols, VOYAGE.items.rows, ITEM_ICON_INDEX[item.powerUpId] ?? 0);
        icon.setDisplaySize(36, 36).setInteractive({ useHandCursor: true });
        icon.on("pointerdown", () => this.armOrUseItem(item.uid, item.powerUpId));
        this.trackHud(icon);
      }
    });
    const me = game.players.find((player) => player.id === this.snapshot.playerId);
    if (me) {
      const gold = this.add.text(1180, 676, `${me.score}g`, {
        fontFamily: "Lilita One",
        fontSize: "18px",
        color: "#ffd45f",
        stroke: "#17233b",
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(51);
      this.trackHud(gold);
    }
  }

  // ---------------------------------------------------------------------------
  // Regular question
  // ---------------------------------------------------------------------------

  private renderQuestion(): void {
    const game = this.snapshot.game;
    if (!game) return;
    this.flagMarkers.clear();
    this.renderSeaWorld();
    if (!game.question) {
      this.showNotice("Charting the next waters…", "#ffe18a");
      return;
    }
    this.createQuestionBanner(game);
    this.createPotChest(game);
    this.createQuestionIslands(game, true);
    this.createFleet(game);
    this.createInventory(game, this.snapshot.priv);
    this.createMutinyButton(game);
    this.renderTargeting();
    this.applyHudVisibility();
  }

  private createQuestionIslands(game: PublicGameState, interactive = true): void {
    const biomes = game.question?.biomes;
    const sheet = this.textures.exists(VOYAGE.biomes.key) ? VOYAGE.biomes : VOYAGE.islands;
    this.ensureSheetFrames(sheet.key, sheet.cols, sheet.rows);
    const [iw, ih] = ISLAND_DISPLAY;
    this.islands =
      game.question?.options.slice(0, 4).map((option, index) => {
        const [x, y] = ISLAND_POSITIONS[index] ?? ISLAND_POSITIONS[0]!;
        const selected = interactive && this.draftChoice === index;
        const glow = this.add.ellipse(x, y + 24, iw * 0.9, ih * 0.55, 0xffffff, 0).setDepth(2);
        const biome = biomes?.[index];
        const frame = biome ? (BIOME_FRAME[biome] ?? index) : index;
        const island = this.add
          .image(x, y, sheet.key, `f${frame % (sheet.cols * sheet.rows)}`)
          .setDisplaySize(iw, ih)
          .setDepth(3);
        if (interactive) island.setInteractive({ useHandCursor: true });
        if (selected) island.setTint(0xfff1c4);
        this.tweens.add({
          targets: island,
          y: y - 4,
          duration: 2600 + index * 140,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
        const signX = x + 28;
        const signY = y + 72;
        const scrim = this.add.graphics().setDepth(4);
        scrim.fillStyle(0x1a120c, selected ? 0.62 : 0.4);
        scrim.fillRoundedRect(signX - 72, signY - 16, 144, 32, 8);
        if (selected) {
          scrim.lineStyle(2, GOLD, 0.9);
          scrim.strokeRoundedRect(signX - 72, signY - 16, 144, 32, 8);
        }
        const display = this.snapshot.priv?.cannonballed ? this.holeWords(option) : option;
        const answer = this.add
          .text(signX, signY, display, {
            fontFamily: "Nunito",
            fontStyle: "900",
            fontSize: "14px",
            color: "#fff8e6",
            align: "center",
            wordWrap: { width: 136 },
          })
          .setOrigin(0.5)
          .setDepth(5);
        const disabled = this.snapshot.priv?.disabledOptions?.includes(index);
        if (disabled) {
          island.setAlpha(0.28);
          answer.setAlpha(0.22);
          scrim.setAlpha(0.2);
        } else if (interactive) {
          island.on("pointerover", () => {
            if (!selected) island.setTint(0xfff6dc);
          });
          island.on("pointerout", () => {
            if (!selected) island.clearTint();
            else island.setTint(0xfff1c4);
          });
          island.on("pointerdown", () => this.chooseIsland(index));
        }
        if (selected) this.raiseIslandFlag(index);
        const root = this.add.container(0, 0, [glow, island, scrim, answer]);
        return { root, glow, answer };
      }) ?? [];
  }

  private createFleet(game: PublicGameState): void {
    const visible = game.players.filter((player) => !player.marooned).sort((a, b) => a.rank - b.rank);
    const n = Math.max(1, visible.length);
    // Compact cluster in the open water between the four islands.
    const span = Math.min(280, 48 + n * 72);
    const startX = FLEET_HOME.x - span / 2;
    const y = FLEET_HOME.y;
    const dock = this.add.ellipse(FLEET_HOME.x, y + 16, span + 90, 32, 0x0a3050, 0.2).setDepth(18);
    this.tweens.add({ targets: dock, alpha: { from: 0.14, to: 0.26 }, duration: 1800, yoyo: true, repeat: -1 });
    visible.forEach((player, index) => {
      const x = startX + (n === 1 ? span / 2 : (index / Math.max(1, n - 1)) * span);
      const isLeader = player.rank === 1;
      const scale = isLeader ? 1.08 : 0.9;
      const ship = this.createShip(player, x, y, scale, isLeader);
      ship.setDepth(20);
      this.ships.set(player.id, ship);
      this.tweens.add({
        targets: ship,
        y: y - 5,
        duration: 2000 + index * 150,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      if (player.id === this.snapshot.playerId && player.hasAnswered) {
        const choice = this.snapshot.priv?.selectedChoiceIndex ?? this.draftChoice;
        if (choice !== undefined) this.leanShipTowardIsland(player.id, choice);
      }
    });
  }

  /** Anticipation nudge when a course is picked — sleek commit, not full sail yet. */
  private leanShipTowardIsland(playerId: string, islandIndex: number): void {
    const ship = this.ships.get(playerId);
    const [islandX, islandY] = ISLAND_POSITIONS[islandIndex] ?? ISLAND_POSITIONS[0]!;
    if (!ship) return;
    const homeX = Number(ship.getData("homeX") ?? ship.x);
    const homeY = Number(ship.getData("homeY") ?? ship.y);
    const hull = ship.getData("hullSprite") as Phaser.GameObjects.Sprite | undefined;
    if (hull?.anims) {
      this.ensureAnim("voyage-ship-sail-run", VOYAGE.shipSailSmooth.key, 24, 28, -1);
      hull.play("voyage-ship-sail-run");
    }
    const leanX = Phaser.Math.Linear(homeX, islandX, 0.18);
    const leanY = Phaser.Math.Linear(homeY, islandY + 90, 0.18);
    const bank = Phaser.Math.Clamp(((leanX - homeX) / 80) * 10, -12, 12);
    this.tweens.killTweensOf(ship);
    this.tweens.add({
      targets: ship,
      x: leanX,
      y: leanY,
      angle: bank,
      duration: 480,
      ease: "Cubic.easeOut",
    });
    this.tweens.add({
      targets: ship,
      angle: { from: bank - 1.5, to: bank + 1.5 },
      duration: 1600,
      delay: 480,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private createPotChest(game: PublicGameState): void {
    const arcade = game.arcade;
    if (!arcade) return;

    // Gold loot bar sits UNDER the question parchment — continuous drain readout.
    const track = this.add.graphics().setDepth(30);
    track.fillStyle(0x2a1a0c, 0.85);
    track.lineStyle(3, 0x8a5a28, 1);
    track.fillRoundedRect(GOLD_BAR.x, GOLD_BAR.y, GOLD_BAR.w, GOLD_BAR.h, 8);
    track.strokeRoundedRect(GOLD_BAR.x, GOLD_BAR.y, GOLD_BAR.w, GOLD_BAR.h, 8);
    this.potBarFill = this.add.graphics().setDepth(31);
    this.potBarFill.fillStyle(0xffc94a, 1);
    this.potBarFill.fillRoundedRect(GOLD_BAR.x + 2, GOLD_BAR.y + 2, GOLD_BAR.w - 4, GOLD_BAR.h - 4, 6);
    this.trackHud(track, this.potBarFill);

    // Compact top-right chest — locked pixel size so sheet frames can't spill.
    const root = this.add.container(POT_CHEST_POS.x, POT_CHEST_POS.y).setDepth(34);
    const glow = this.add.circle(0, 4, 34, 0xffd45f, 0.16);
    const sheet = this.textures.exists(VOYAGE.potDrain.key) ? VOYAGE.potDrain : VOYAGE.chest;
    this.ensureSheetFrames(sheet.key, sheet.cols, sheet.rows);
    this.potChestA = this.add.image(0, 0, sheet.key, "f0").setOrigin(0.5);
    this.potChestB = this.add.image(0, 0, sheet.key, "f0").setOrigin(0.5).setAlpha(0);
    this.lockChestDisplaySize();
    this.potText = this.add
      .text(0, 40, `${arcade.potMax}`, {
        fontFamily: "Lilita One",
        fontSize: "16px",
        color: "#ffd45f",
        stroke: "#17233b",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    root.add([glow, this.potChestA, this.potChestB, this.potText]);
    this.potChest = root;
    this.trackHud(root);
  }

  /** Keep every drain-sheet frame in the same fixed box (frames vary in native size). */
  private lockChestDisplaySize(): void {
    for (const img of [this.potChestA, this.potChestB]) {
      if (!img) continue;
      this.tweens.killTweensOf(img);
      img.setScale(1);
      img.setDisplaySize(CHEST_BASE_SIZE.w, CHEST_BASE_SIZE.h);
    }
  }

  private createConfirmButton(game: PublicGameState): void {
    const me = game.players.find((player) => player.id === this.snapshot.playerId);
    const committed = me?.hasAnswered || Boolean(this.snapshot.priv?.hasMutinied);
    const label = committed ? "ANSWER LOCKED" : "CONFIRM COURSE";
    if (this.textures.exists(VOYAGE.lockButton.key)) {
      const frame = committed ? 2 : 1;
      const plaque = this.add.image(840, 664, VOYAGE.lockButton.key);
      this.cropGridImage(plaque, VOYAGE.lockButton.cols, VOYAGE.lockButton.rows, frame);
      plaque.setDisplaySize(270, 78).setAlpha(committed ? 0.8 : 1);
      this.add.text(840, 664, label, {
        fontFamily: "Lilita One",
        fontSize: "18px",
        color: "#fff4cf",
        stroke: "#17233b",
        strokeThickness: 4,
        align: "center",
        wordWrap: { width: 230 },
      }).setOrigin(0.5);
      if (!committed) {
        plaque.setInteractive({ useHandCursor: true });
        plaque.on("pointerover", () => {
          this.cropGridImage(plaque, VOYAGE.lockButton.cols, VOYAGE.lockButton.rows, 0);
        });
        plaque.on("pointerout", () => {
          this.cropGridImage(plaque, VOYAGE.lockButton.cols, VOYAGE.lockButton.rows, 1);
        });
        plaque.on("pointerdown", () => {
          if (this.draftChoice === undefined) {
            this.showNotice("Choose an island first", "#ffb58f");
            this.cameras.main.shake(100, 0.004);
            return;
          }
          plaque.setScale(0.94);
          gameEventBridge.send({ type: "answer", choiceIndex: this.draftChoice });
          this.cameras.main.zoomTo(1.015, 100, "Sine.easeOut", true);
        });
      }
      return;
    }
    const button = this.makeButton(840, 664, 250, 58, label, committed ? 0x2f6572 : 0xb34227);
    button.setAlpha(committed ? 0.75 : 1);
    if (!committed) {
      button.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
        if (this.draftChoice === undefined) {
          this.showNotice("Choose an island first", "#ffb58f");
          this.cameras.main.shake(100, 0.004);
          return;
        }
        gameEventBridge.send({ type: "answer", choiceIndex: this.draftChoice });
        this.cameras.main.zoomTo(1.015, 100, "Sine.easeOut", true);
      });
    }
  }

  private createMutinyButton(game: PublicGameState): void {
    if (!game.arcade || game.arcade.roundNumber <= ARCADE.FIRST_ITEM_WINDOW) return;
    const playerId = this.snapshot.playerId;
    if (!playerId || game.arcade.leaderId === playerId) return;
    const mutinied = Boolean(this.snapshot.priv?.hasMutinied);
    const label = mutinied ? "MUTINY DECLARED" : this.mutinyConfirming ? "PRESS AGAIN TO MUTINY" : "RAISE BLACK FLAG";
    const button = this.makeButton(130, 594, 220, 48, label, mutinied ? 0x2d1f2b : 0x322a36);
    const flag = this.add.graphics();
    flag.lineStyle(5, 0x19151c, 1);
    flag.lineBetween(35, 570, 35, 616);
    flag.fillStyle(mutinied ? 0xd13c3c : 0x161419, 1);
    flag.fillTriangle(38, 572, 92, 584, 38, 599);
    if (!mutinied) {
      button.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
        if (!this.mutinyConfirming) {
          this.mutinyConfirming = true;
          this.renderMode("question");
          return;
        }
        gameEventBridge.send({ type: "mutiny" });
      });
    }
  }

  private chooseIsland(index: number): void {
    const game = this.snapshot.game;
    const me = game?.players.find((player) => player.id === this.snapshot.playerId);
    if (!game || me?.hasAnswered || this.snapshot.priv?.hasMutinied) {
      this.showNotice("Your course is already locked", "#ffb58f");
      return;
    }
    if (this.draftChoice === index) {
      gameEventBridge.send({ type: "answer", choiceIndex: index });
      this.showNotice("COURSE SET!", "#ffe18a");
      this.cameras.main.shake(70, 0.0025);
      return;
    }
    this.draftChoice = index;
    this.renderMode("question");
    this.playTelescopeSelect(index);
  }

  /** Telescope peek — NO camera zoom/pan (that looked broken). */
  private playTelescopeSelect(index: number): void {
    const [ix, iy] = ISLAND_POSITIONS[index] ?? ISLAND_POSITIONS[0]!;
    const r = 102;
    const g = this.add.graphics().setDepth(90).setAlpha(0);
    g.fillStyle(0x061018, 0.74);
    g.fillRect(0, 0, W, Math.max(0, iy - r));
    g.fillRect(0, iy + r, W, Math.max(0, H - (iy + r)));
    g.fillRect(0, iy - r, Math.max(0, ix - r), r * 2);
    g.fillRect(ix + r, iy - r, Math.max(0, W - (ix + r)), r * 2);
    g.lineStyle(10, 0x1a120c, 0.95);
    g.strokeCircle(ix, iy, r + 8);
    g.lineStyle(5, 0xc9a24a, 0.95);
    g.strokeCircle(ix, iy, r);
    this.tweens.add({
      targets: g,
      alpha: 1,
      duration: 160,
      yoyo: true,
      hold: 240,
      onComplete: () => g.destroy(),
    });
    this.showNotice("Tap again to lock course", "#ffe18a");
  }

  private raiseIslandFlag(index: number): void {
    this.flagMarkers.forEach((marker) => marker.destroy());
    this.flagMarkers.clear();
    const [x, y] = ISLAND_POSITIONS[index] ?? ISLAND_POSITIONS[0]!;
    const root = this.add.container(x + 52, y - 58).setDepth(40);
    const pole = this.add.rectangle(0, 14, 5, 44, 0x5b3a1e).setStrokeStyle(2, INK);
    const flag = this.add.triangle(14, 0, 0, -12, 30, 0, 0, 12, GOLD).setStrokeStyle(2, INK);
    root.add([pole, flag]);
    root.setScale(0.25);
    this.tweens.add({ targets: root, scale: 1, y: root.y - 8, duration: 240, ease: "Back.easeOut" });
    this.flagMarkers.set(index, root);
  }

  private trackHud(...nodes: Phaser.GameObjects.GameObject[]): void {
    this.hudNodes.push(...nodes);
  }

  private applyHudVisibility(): void {
    for (const node of this.hudNodes) {
      if ("setVisible" in node && typeof node.setVisible === "function") {
        node.setVisible(this.hudVisible);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Loot Drop
  // ---------------------------------------------------------------------------

  private renderLootDrop(): void {
    const game = this.snapshot.game;
    const priv = this.snapshot.priv;
    if (!game?.question || !priv) return;
    this.renderMapWorld();
    this.createQuestionBanner(game);
    this.createLeaderboard(game);
    this.createTimer();
    this.createLootDestinations(game);
    this.createLootDock(game, priv);
  }

  private renderMapWorld(): void {
    if (this.textures.exists(VOYAGE.bgLoot.key)) {
      this.add.image(WORLD_W / 2, H / 2, VOYAGE.bgLoot.key).setDisplaySize(WORLD_W, H).setDepth(-3);
      const veil = this.add.graphics();
      veil.fillStyle(0x1a120c, 0.22);
      veil.fillRect(0, 0, WORLD_W, H);
      veil.setDepth(-2);
      return;
    }
    const floor = this.add.graphics();
    floor.fillGradientStyle(0x4f2e1c, 0x4f2e1c, 0x1e3441, 0x1e3441, 1);
    floor.fillRect(0, 0, WORLD_W, H);
    const map = this.add.graphics();
    map.fillStyle(0xe3c47f, 0.98);
    map.lineStyle(8, 0x754626, 1);
    map.fillRoundedRect(68, 126, 880, 474, 30);
    map.strokeRoundedRect(68, 126, 880, 474, 30);
  }

  private createLootDestinations(game: PublicGameState): void {
    const options = game.question?.options.slice(0, 4) ?? [];
    this.islands = options.map((option, index) => {
      const [x0, y0] = ISLAND_POSITIONS[index] ?? ISLAND_POSITIONS[0]!;
      const x = x0;
      const y = y0 + 30;
      const glow = this.add.ellipse(x, y, 300, 166, 0xffd75b, 0);
      const island = this.add.image(x, y - 22, VOYAGE.islands.key);
      this.cropGridImage(island, VOYAGE.islands.cols, VOYAGE.islands.rows, index);
      island.setDisplaySize(170, 122).setInteractive({ useHandCursor: true });
      const answer = this.add.text(x, y + 43, option, {
        fontFamily: "Nunito",
        fontStyle: "900",
        fontSize: "16px",
        color: "#3c271c",
        align: "center",
        wordWrap: { width: 250 },
      }).setOrigin(0.5);
      const amount = this.add.text(x, y + 82, `${this.draftAllocation[index] ?? 0} invested`, {
        fontFamily: "Lilita One",
        fontSize: "19px",
        color: "#8c551e",
      }).setOrigin(0.5);
      island.on("pointerdown", () => this.addLoot(index, 10));
      const max = this.makeButton(x + 118, y - 42, 76, 34, "MAX", 0x9b632c);
      max.setInteractive({ useHandCursor: true }).on("pointerdown", () => this.maxLoot(index));
      const root = this.add.container(0, 0, [glow, island, answer, amount]);
      return { root, glow, answer, amount };
    });
  }

  private createLootDock(game: PublicGameState, priv: PrivatePlayerState): void {
    const pool = priv.lootDropPool ?? 0;
    const total = this.draftAllocation.reduce((sum, value) => sum + value, 0);
    const remaining = Math.max(0, pool - total);
    const dock = this.add.graphics();
    dock.fillStyle(0x13273a, 0.98);
    dock.lineStyle(5, 0xc18b3e, 1);
    dock.fillRoundedRect(30, 616, 950, 88, 20);
    dock.strokeRoundedRect(30, 616, 950, 88, 20);
    this.add.text(54, 638, "VENTURE GOLD", {
      fontFamily: "Lilita One",
      fontSize: "19px",
      color: "#f1d275",
    });
    this.add.text(54, 669, `${remaining} LEFT`, {
      fontFamily: "Lilita One",
      fontSize: "24px",
      color: remaining === 0 ? "#7ee29d" : "#fff2bd",
    });

    const coin = this.add.image(245, 658, "coin").setDisplaySize(58, 58).setInteractive({ useHandCursor: true, draggable: true });
    coin.on("drag", (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => coin.setPosition(dragX, dragY));
    coin.on("dragend", () => {
      const nearest = this.nearestIsland(coin.x, coin.y);
      coin.setPosition(245, 658);
      if (nearest !== undefined) this.addLoot(nearest, 10);
      else this.showNotice("Drag the coin onto a venture", "#fff0bd");
    });
    this.input.setDraggable(coin);
    this.add.text(282, 658, "DRAG 10", {
      fontFamily: "Nunito",
      fontStyle: "900",
      fontSize: "14px",
      color: "#d8edf2",
    }).setOrigin(0, 0.5);

    const locked = Boolean(game.players.find((player) => player.id === this.snapshot.playerId)?.hasAnswered);
    const lock = this.makeButton(795, 660, 290, 60, locked ? "VENTURES DISPATCHED" : "LOCK IN VENTURES", locked ? 0x315c66 : 0xa83b27);
    if (!locked) {
      lock.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
        if (remaining !== 0 || pool === 0) {
          this.showNotice(pool === 0 ? "No block gold to invest" : "Allocate every coin before departure", "#ffb58f");
          this.cameras.main.shake(110, 0.004);
          return;
        }
        gameEventBridge.send({ type: "loot", allocation: [...this.draftAllocation] });
      });
    }
  }

  private addLoot(index: number, amount: number): void {
    const pool = this.snapshot.priv?.lootDropPool ?? 0;
    const total = this.draftAllocation.reduce((sum, value) => sum + value, 0);
    const remaining = pool - total;
    if (remaining <= 0) {
      this.showNotice("All venture gold is allocated", "#ffdc71");
      return;
    }
    this.draftAllocation[index] = (this.draftAllocation[index] ?? 0) + Math.min(amount, remaining);
    this.renderMode("loot");
  }

  private maxLoot(index: number): void {
    const pool = this.snapshot.priv?.lootDropPool ?? 0;
    const total = this.draftAllocation.reduce((sum, value) => sum + value, 0);
    this.draftAllocation[index] = (this.draftAllocation[index] ?? 0) + Math.max(0, pool - total);
    this.renderMode("loot");
  }

  private nearestIsland(x: number, y: number): number | undefined {
    let best: { index: number; distance: number } | undefined;
    ISLAND_POSITIONS.forEach(([ix, iy], index) => {
      const distance = Phaser.Math.Distance.Between(x, y, ix, iy + 30);
      if (!best || distance < best.distance) best = { index, distance };
    });
    return best && best.distance < 170 ? best.index : undefined;
  }

  // ---------------------------------------------------------------------------
  // Marooned private scene
  // ---------------------------------------------------------------------------

  private renderMarooned(): void {
    const game = this.snapshot.game;
    if (!game) return;
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x62c9e8, 0x62c9e8, 0xffd18a, 0xffd18a, 1);
    sky.fillRect(0, 0, W, 330);
    sky.fillStyle(0x167c9c, 1);
    sky.fillRect(0, 330, W, 390);
    if (this.textures.exists(VOYAGE.maroon.key)) {
      this.add.image(640, 400, VOYAGE.maroon.key).setDisplaySize(560, 420);
    } else {
      const island = this.add.image(610, 410, VOYAGE.islands.key);
      this.cropGridImage(island, VOYAGE.islands.cols, VOYAGE.islands.rows, 0);
      island.setDisplaySize(520, 370);
    }
    const me = game.players.find((player) => player.id === this.snapshot.playerId);
    if (me) {
      const ship = this.createShip(me, 360, 530, 0.85);
      ship.setAngle(-14);
      this.add.text(640, 80, "MAROONED", {
        fontFamily: "Lilita One",
        fontSize: "62px",
        color: "#fff2bd",
        stroke: "#18334b",
        strokeThickness: 10,
      }).setOrigin(0.5);
      this.add.text(640, 143, "The fleet sailed on. Search the island while you wait.", {
        fontFamily: "Nunito",
        fontStyle: "900",
        fontSize: "20px",
        color: "#14334a",
      }).setOrigin(0.5);
    }
    this.createTimer();
    const chest = this.snapshot.priv?.chests.find((entry) => entry.source === "marooned");
    const chestArt = this.add.image(860, 485, VOYAGE.chest.key);
    this.cropGridImage(chestArt, VOYAGE.chest.cols, VOYAGE.chest.rows, 4);
    chestArt.setDisplaySize(150, 138);
    const glow = this.add.circle(860, 485, 90, 0xffe25f, 0.22);
    glow.setDepth(-0.5);
    this.tweens.add({ targets: [chestArt, glow], y: "-=10", scale: 1.08, duration: 800, yoyo: true, repeat: -1 });
    const open = this.makeButton(860, 610, 250, 54, chest ? "OPEN ISLAND CHEST" : "CHEST ALREADY CLAIMED", chest ? 0x9e4a25 : 0x526a70);
    if (chest) {
      open.setInteractive({ useHandCursor: true }).on("pointerdown", () => gameEventBridge.send({ type: "chest", uid: chest.uid }));
    }
  }

  // ---------------------------------------------------------------------------
  // Reveal
  // ---------------------------------------------------------------------------

  private renderReveal(): void {
    const game = this.snapshot.game;
    if (!game) return;
    if (game.arcade?.isEventRound) this.renderMapWorld();
    else this.renderSeaWorld();
    this.createLeaderboard(game);
    this.createQuestionBanner(game);
    this.createRevealIslands(game);

    const revealKey = game.revealEvents.map((event) => event.id).join("|");
    if (revealKey === this.lastRevealKey) return;
    this.lastRevealKey = revealKey;
    this.time.delayedCall(250, () => this.playRevealSequence(game));
  }

  private createRevealIslands(game: PublicGameState): void {
    // Same biome islands as the question — never swap to wooden card stubs / despawn art.
    this.createQuestionIslands(game, false);
    if (game.arcadeReveal) {
      const correct = game.arcadeReveal.correctIndex;
      this.islands.forEach((island, index) => {
        if (index === correct) {
          island.glow.setFillStyle(0xffde61, 0.18).setStrokeStyle(4, GOLD, 0.55);
        }
      });
    }
  }

  private playRevealSequence(game: PublicGameState): void {
    const reveal = game.arcadeReveal;
    if (!reveal) return;

    if (game.arcade?.isEventRound) {
      this.playLootDropReveal(game, reveal);
      return;
    }

    const answers = [...reveal.answers]
      .filter((a) => a.choiceIndex !== undefined)
      .sort((a, b) => a.lockedAt - b.lockedAt);
    const n = Math.max(1, answers.length);
    const span = Math.min(280, 48 + n * 72);
    const startX = FLEET_HOME.x - span / 2;
    const harbourY = FLEET_HOME.y;

    answers.forEach((answer, raceIndex) => {
      const player = game.players.find((p) => p.id === answer.playerId);
      if (!player || answer.choiceIndex === undefined) return;
      const homeX = startX + (n === 1 ? span / 2 : (raceIndex / Math.max(1, n - 1)) * span);
      const ship = this.createShip(player, homeX, harbourY, player.rank === 1 ? 1.08 : 0.95, player.rank === 1);
      ship.setDepth(45);
      this.ships.set(player.id, ship);
      const correct = answer.choiceIndex === reveal.correctIndex;
      // Short hop from mid-map staging — first locker still arrives first.
      const sailMs = 1800 + raceIndex * 420;
      const plunderMs = correct ? Math.max(1600, 3000 - raceIndex * 280) : 900;
      this.runIslandVoyage({
        ship,
        homeX,
        homeY: harbourY,
        islandIndex: answer.choiceIndex,
        delay: 180 + raceIndex * 100,
        sailMs,
        plunderMs,
        correct,
        biome: game.question?.biomes?.[answer.choiceIndex],
      });
    });

    this.time.delayedCall(3800, () => {
      this.islands.forEach((island, index) => {
        const ok = index === reveal.correctIndex;
        if (!ok) this.drawCross(ISLAND_POSITIONS[index]?.[0] ?? 0, (ISLAND_POSITIONS[index]?.[1] ?? 0) - 28);
        else island.glow.setFillStyle(0xffde61, 0.22).setStrokeStyle(5, GOLD, 0.7);
      });
    });

    // Slow sail (~3–5s) + ~5.2s cinematic; keep later cards after that beat.
    let delay = 11_000;
    game.revealEvents.forEach((event) => {
      if (event.title.includes("POSEIDON")) {
        this.time.delayedCall(delay, () => this.playPoseidon(event.playerIds?.[0]));
        delay += 2800;
      } else if (event.title.includes("SHARK ATTACK")) {
        this.time.delayedCall(delay, () => this.playSharks());
        delay += 2500;
      } else if (event.animation === "mutiny") {
        this.time.delayedCall(delay, () => this.playMutiny(event.title, event.playerIds ?? []));
        delay += 2300;
      } else if (event.title.includes("MAROONED")) {
        this.time.delayedCall(delay, () => this.playMaroon(event.playerIds?.[0]));
        delay += 2200;
      } else {
        this.time.delayedCall(delay, () => this.showEventCard(event.title, event.description));
        delay += 1250;
      }
    });
  }

  private playLootDropReveal(
    game: PublicGameState,
    reveal: NonNullable<PublicGameState["arcadeReveal"]>,
  ): void {
    game.players.forEach((player, index) => {
      const answer = reveal.answers.find((a) => a.playerId === player.id);
      const x = 370 + (index % 4) * 110;
      const y = 585 + Math.floor(index / 4) * 45;
      if (!answer?.lootAllocation) return;
      answer.lootAllocation.forEach((amount, islandIndex) => {
        if (amount <= 0) return;
        const shipCount = Math.min(3, Math.ceil(amount / 50));
        for (let shipIndex = 0; shipIndex < shipCount; shipIndex += 1) {
          const mini = this.createShip(player, x + shipIndex * 12, y + shipIndex * 8, 0.34);
          this.runIslandVoyage({
            ship: mini,
            homeX: x,
            homeY: y,
            islandIndex,
            delay: index * 70 + shipIndex * 80,
            sailMs: 2600 + shipIndex * 400,
            plunderMs: reveal.correctIndex === islandIndex ? 1600 : 500,
            correct: reveal.correctIndex === islandIndex,
            biome: game.question?.biomes?.[islandIndex],
          });
        }
      });
    });
  }

  private runIslandVoyage(opts: {
    ship: Phaser.GameObjects.Container;
    homeX: number;
    homeY: number;
    islandIndex: number;
    delay: number;
    sailMs: number;
    plunderMs: number;
    correct: boolean;
    biome?: string;
  }): void {
    const [islandX, islandY] = ISLAND_POSITIONS[opts.islandIndex] ?? ISLAND_POSITIONS[0]!;
    const destX = islandX + Phaser.Math.Between(-36, 36);
    const destY = islandY + 78;
    const hull = opts.ship.getData("hullSprite") as Phaser.GameObjects.Sprite | undefined;
    if (hull && "anims" in hull && hull.anims) {
      this.ensureSheetFrames(VOYAGE.shipSailSmooth.key, VOYAGE.shipSailSmooth.cols, VOYAGE.shipSailSmooth.rows);
      this.ensureAnim("voyage-ship-sail-run", VOYAGE.shipSailSmooth.key, 24, 28, -1);
      hull.play("voyage-ship-sail-run");
    }
    const bank = Phaser.Math.Clamp(((destX - opts.homeX) / 420) * 14, -14, 14);
    this.tweens.killTweensOf(opts.ship);
    let lastWake = -1;
    this.tweens.add({
      targets: opts.ship,
      x: destX,
      y: destY,
      angle: bank,
      duration: opts.sailMs,
      delay: opts.delay,
      ease: "Sine.easeInOut",
      onUpdate: (tween) => {
        if (tween.progress - lastWake < 0.05) return;
        lastWake = tween.progress;
        this.spawnSailWake(opts.ship.x, opts.ship.y + 16);
      },
      onComplete: () => {
        this.tweens.add({ targets: opts.ship, angle: 0, duration: 280, ease: "Sine.easeOut" });
        if (opts.correct) {
          this.playCorrectPlunder(opts.ship, opts.islandIndex, opts.plunderMs, opts.biome, opts.homeX, opts.homeY);
        } else {
          this.playWrongIslandBounce(opts.ship, opts.islandIndex, opts.homeX, opts.homeY);
        }
      },
    });
  }

  private playCorrectPlunder(
    ship: Phaser.GameObjects.Container,
    islandIndex: number,
    plunderMs: number,
    biome: string | undefined,
    homeX: number,
    homeY: number,
  ): void {
    const [islandX, islandY] = ISLAND_POSITIONS[islandIndex] ?? ISLAND_POSITIONS[0]!;
    // Every arriving correct ship gets the full biome cinematic (queued, not skipped).
    this.enqueuePlunderCinematic(biome, (cinematicMs) => {
      const waitMs = cinematicMs > 0 ? cinematicMs : plunderMs;
      this.showFloating(W / 2, 64, "PLUNDER!", "#ffe18a");
      this.time.delayedCall(Math.floor(waitMs * 0.55), () => {
        this.coinStream(islandX, islandY + 20, ship.x, ship.y - 10);
      });
      this.time.delayedCall(waitMs, () => {
        this.showFloating(ship.x, ship.y - 50, "AWAY!", "#fff0bd");
        this.tweens.add({
          targets: ship,
          x: homeX + Phaser.Math.Between(-40, 40),
          y: homeY - 20,
          duration: 1100,
          ease: "Sine.easeInOut",
          onUpdate: () => this.spawnSailWake(ship.x, ship.y + 14),
        });
      });
    });
  }

  private enqueuePlunderCinematic(
    biome: string | undefined,
    onDone: (durationMs: number) => void,
  ): void {
    this.plunderCinematicQueue.push(() => {
      this.plunderCinematicBusy = true;
      const durationMs = this.playBiomePlunderCinematic(biome, W / 2, H / 2);
      const wait = durationMs > 0 ? durationMs : 2800;
      if (durationMs <= 0) this.playSpritePlunderFallback(biome);
      onDone(wait);
      this.time.delayedCall(wait + 40, () => {
        this.plunderCinematicBusy = false;
        this.pumpPlunderCinematicQueue();
      });
    });
    this.pumpPlunderCinematicQueue();
  }

  private pumpPlunderCinematicQueue(): void {
    if (this.plunderCinematicBusy) return;
    const next = this.plunderCinematicQueue.shift();
    if (next) next();
  }

  private playSpritePlunderFallback(biome: string | undefined): void {
    const islandIndex = biome ? (BIOME_FRAME[biome] ?? 0) : 0;
    const [islandX, islandY] = ISLAND_POSITIONS[islandIndex] ?? ISLAND_POSITIONS[0]!;
    if (!this.textures.exists(VOYAGE.plunderBiomes.key)) return;
    this.ensureSheetFrames(VOYAGE.plunderBiomes.key, VOYAGE.plunderBiomes.cols, VOYAGE.plunderBiomes.rows);
    const vignette = this.add
      .image(islandX, islandY - 10, VOYAGE.plunderBiomes.key, `f${islandIndex % 8}`)
      .setDisplaySize(210, 210)
      .setDepth(42)
      .setAlpha(0);
    this.tweens.add({
      targets: vignette,
      alpha: 0.95,
      scale: { from: 0.85, to: 1 },
      duration: 280,
      yoyo: true,
      hold: 1800,
      onComplete: () => vignette.destroy(),
    });
  }

  /**
   * Plunder cinematic — 4K source shrunk with object-fit: contain so the whole
   * shot is readable (never zoomed/cropped into a corner of the frame).
   */
  private playBiomePlunderCinematic(biome: string | undefined, _islandX: number, _islandY: number): number {
    if (!biome || !(biome in PLUNDER_VIDEO)) return 0;
    const asset = PLUNDER_VIDEO[biome as keyof typeof PLUNDER_VIDEO];
    const durationMs = 5200;

    // Solid cinema matte behind the fitted video.
    const veil = this.add.rectangle(W / 2, H / 2, W, H, 0x061018, 1).setDepth(90);
    const failToSprite = () => {
      if (veil.active) veil.destroy();
      this.playSpritePlunderFallback(biome);
    };
    const startPlayback = () => {
      if (!this.sys.isActive()) {
        failToSprite();
        return;
      }
      if (!this.cache.video.exists(asset.key)) {
        failToSprite();
        return;
      }
      const video = this.add.video(W / 2, H / 2, asset.key).setDepth(91);
      video.setAlpha(0);
      const applyContainFit = () => {
        if (video.active) this.fitVideoContain(video);
      };
      applyContainFit();
      const html = video.video;
      if (html) {
        if (html.readyState >= 1) applyContainFit();
        else html.addEventListener("loadedmetadata", applyContainFit, { once: true });
        html.addEventListener("loadeddata", applyContainFit, { once: true });
      }
      this.tweens.add({ targets: video, alpha: 1, duration: 220 });
      try {
        video.play(false);
      } catch {
        video.destroy();
        failToSprite();
        return;
      }
      // Re-fit after play starts — some browsers report 0×0 until decode.
      this.time.delayedCall(80, applyContainFit);
      this.time.delayedCall(durationMs - 280, () => {
        if (!video.active && !veil.active) return;
        this.tweens.add({
          targets: [video, veil].filter((obj) => obj.active),
          alpha: 0,
          duration: 280,
          onComplete: () => {
            if (video.active) video.destroy();
            if (veil.active) veil.destroy();
          },
        });
      });
    };

    if (this.cache.video.exists(asset.key)) {
      startPlayback();
    } else {
      const onDone = () => {
        this.load.off(Phaser.Loader.Events.COMPLETE, onDone);
        startPlayback();
      };
      this.load.video(asset.key, asset.url, true);
      this.load.once(Phaser.Loader.Events.COMPLETE, onDone);
      this.load.start();
    }
    return durationMs;
  }

  /** Shrink 4K (or any) video to fit entirely inside the 1280×720 game world. */
  private fitVideoContain(video: Phaser.GameObjects.Video): void {
    const html = video.video;
    const srcW = html?.videoWidth && html.videoWidth > 0 ? html.videoWidth : 3840;
    const srcH = html?.videoHeight && html.videoHeight > 0 ? html.videoHeight : 2160;
    // Small inset so the full shot reads; never crop with cover-scaling.
    const pad = 0.96;
    const scale = Math.min((W * pad) / srcW, (H * pad) / srcH);
    video.setDisplaySize(Math.round(srcW * scale), Math.round(srcH * scale));
    video.setPosition(W / 2, H / 2);
  }

  private playWrongIslandBounce(
    ship: Phaser.GameObjects.Container,
    islandIndex: number,
    homeX: number,
    homeY: number,
  ): void {
    const [islandX, islandY] = ISLAND_POSITIONS[islandIndex] ?? ISLAND_POSITIONS[0]!;
    this.showFloating(islandX, islandY - 40, "NO LOOT!", "#ffb3a0");
    this.cameras.main.shake(60, 0.002);
    const reactKey = this.textures.exists(VOYAGE.wrongReact.key) ? VOYAGE.wrongReact : VOYAGE.pirates;
    if (this.textures.exists(reactKey.key)) {
      this.ensureSheetFrames(reactKey.key, reactKey.cols, reactKey.rows);
      const peek = this.add
        .image(ship.x - 8, ship.y - 20, reactKey.key, "f0")
        .setDisplaySize(52, 60)
        .setDepth(46);
      const frames = ["f0", "f1", "f2", "f3"];
      frames.forEach((frame, i) => {
        this.time.delayedCall(i * 120, () => {
          if (peek.active && peek.texture.has(frame)) peek.setFrame(frame);
        });
      });
      this.tweens.add({
        targets: peek,
        x: islandX,
        y: islandY + 20,
        duration: 340,
        yoyo: true,
        hold: 220,
        onComplete: () => peek.destroy(),
      });
    }
    this.time.delayedCall(780, () => {
      this.tweens.add({
        targets: ship,
        x: homeX,
        y: homeY,
        duration: 1000,
        ease: "Cubic.easeInOut",
        onUpdate: () => this.spawnSailWake(ship.x, ship.y + 14),
        onComplete: () => this.showFloating(ship.x, ship.y - 48, "EMPTY HANDED", "#ffb3a0"),
      });
    });
  }

  private spawnPlunderPirate(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    plunderMs: number,
    delay: number,
  ): void {
    const hasSheet = this.textures.exists(VOYAGE.pirates.key);
    if (hasSheet) this.ensureSheetFrames(VOYAGE.pirates.key, VOYAGE.pirates.cols, VOYAGE.pirates.rows);
    const pirate = hasSheet
      ? this.add.image(fromX, fromY, VOYAGE.pirates.key, "f1").setDisplaySize(52, 60).setDepth(48)
      : this.add.circle(fromX, fromY, 10, 0xc45c38, 1).setStrokeStyle(3, INK).setDepth(48);

    const walkFrames = ["f1", "f2", "f3", "f1"];
    let walkStep = 0;
    const walkTimer = this.time.addEvent({
      delay: 90,
      loop: true,
      callback: () => {
        if (!hasSheet || !("setFrame" in pirate)) return;
        walkStep = (walkStep + 1) % walkFrames.length;
        (pirate as Phaser.GameObjects.Image).setFrame(walkFrames[walkStep]!);
      },
    });

    this.tweens.add({
      targets: pirate,
      x: toX,
      y: toY,
      duration: 420,
      delay,
      ease: "Sine.easeInOut",
      onComplete: () => {
        if (hasSheet && "setFrame" in pirate) {
          (pirate as Phaser.GameObjects.Image).setFrame("f4");
          this.time.delayedCall(160, () => (pirate as Phaser.GameObjects.Image).setFrame("f5"));
          this.time.delayedCall(360, () => (pirate as Phaser.GameObjects.Image).setFrame("f6"));
        }
        // Smash FX — biome stays put.
        const burst = this.add.circle(toX, toY, 8, 0xffe18a, 0.9).setDepth(49);
        this.tweens.add({
          targets: burst,
          scale: 3.2,
          alpha: 0,
          duration: 420,
          onComplete: () => burst.destroy(),
        });
      },
    });

    this.time.delayedCall(delay + plunderMs * 0.75, () => {
      walkTimer.remove(false);
      if (hasSheet && "setFrame" in pirate) (pirate as Phaser.GameObjects.Image).setFrame("f6");
      this.tweens.add({
        targets: pirate,
        x: fromX,
        y: fromY,
        duration: 380,
        ease: "Sine.easeIn",
        onComplete: () => {
          if (hasSheet && "setFrame" in pirate) (pirate as Phaser.GameObjects.Image).setFrame("f7");
          this.tweens.add({
            targets: pirate,
            alpha: 0,
            duration: 180,
            onComplete: () => pirate.destroy(),
          });
        },
      });
    });
  }

  private sailShip(ship: Phaser.GameObjects.Container, islandIndex: number, delay: number, correct: boolean): void {
    this.runIslandVoyage({
      ship,
      homeX: ship.x,
      homeY: ship.y,
      islandIndex,
      delay,
      sailMs: 3000,
      plunderMs: correct ? 1800 : 700,
      correct,
    });
  }

  private spawnSailWake(x: number, y: number): void {
    const foam = this.add.ellipse(x - 18, y, 22, 10, 0xe8f7ff, 0.55).setDepth(4);
    this.tweens.add({
      targets: foam,
      x: foam.x - 28,
      scaleX: 1.6,
      scaleY: 0.55,
      alpha: 0,
      duration: 420,
      ease: "Sine.easeOut",
      onComplete: () => foam.destroy(),
    });
  }

  private playMutiny(title: string, playerIds: string[]): void {
    this.showEventCard("MUTINY", "Cannons speak. The fleet discovers who stood together.");
    const captainId = this.snapshot.game?.arcade?.leaderId;
    const captain = captainId ? this.ships.get(captainId) : undefined;
    if (!captain) return;
    if (title.toLowerCase().includes("divided")) {
      playerIds.forEach((id, index) => {
        const mutineer = this.ships.get(id);
        if (!mutineer) return;
        this.time.delayedCall(index * 160, () => this.fireCannon(captain.x, captain.y, mutineer.x, mutineer.y));
      });
      return;
    }
    playerIds.filter((id) => id !== captainId).forEach((id, index) => {
      const source = this.ships.get(id);
      if (!source) return;
      this.time.delayedCall(index * 140, () => this.fireCannon(source.x, source.y, captain.x, captain.y));
    });
  }

  private playPoseidon(playerId?: string): void {
    this.showEventCard("POSEIDON'S RESCUE", "The sea god refuses to let the trailing fleet sink.");
    const wave = this.add.rectangle(500, 520, 1200, 150, 0x57d6ef, 0.55).setAngle(-5);
    wave.setStrokeStyle(10, 0xc9f8ff, 0.9);
    this.tweens.add({ targets: wave, y: 260, scaleY: 1.8, alpha: 0, duration: 1800, ease: "Sine.easeOut", onComplete: () => wave.destroy() });
    if (this.textures.exists(VOYAGE.poseidonRise.key)) {
      this.ensureAnim("voyage-poseidon-rise", VOYAGE.poseidonRise.key, 8, 8, 0);
      const rise = this.add.sprite(500, 360, VOYAGE.poseidonRise.key, "f0").setDisplaySize(280, 320).setDepth(280);
      rise.play("voyage-poseidon-rise");
      this.tweens.add({
        targets: rise,
        y: 300,
        duration: 700,
        ease: "Back.easeOut",
        hold: 900,
        yoyo: true,
        onComplete: () => rise.destroy(),
      });
    } else if (this.textures.exists(VOYAGE.poseidon.key)) {
      const god = this.add.image(500, 620, VOYAGE.poseidon.key).setDisplaySize(260, 300).setDepth(280);
      this.tweens.add({ targets: god, y: 340, duration: 650, ease: "Back.easeOut", yoyo: true, hold: 900, onComplete: () => god.destroy() });
    } else {
      const god = this.add.container(500, 610);
      const body = this.add.ellipse(0, 0, 150, 230, 0x66cfe7, 0.95).setStrokeStyle(8, 0x173a5c);
      const head = this.add.circle(0, -125, 52, 0xe7c18f, 1).setStrokeStyle(7, 0x173a5c);
      god.add([body, head]);
      this.tweens.add({ targets: god, y: 375, duration: 650, ease: "Back.easeOut", yoyo: true, hold: 900, onComplete: () => god.destroy() });
    }
    const rescued = playerId ? this.ships.get(playerId) : undefined;
    if (rescued) {
      const correctIndex = this.snapshot.game?.arcadeReveal?.correctIndex ?? 0;
      const [targetX, targetY] = ISLAND_POSITIONS[correctIndex] ?? ISLAND_POSITIONS[0]!;
      for (let i = 0; i < 8; i += 1) {
        const fish = this.add.triangle(rescued.x - 70 - i * 18, rescued.y + (i % 3) * 12, 0, 8, 18, 0, 18, 16, 0x6be5dd, 1);
        fish.setStrokeStyle(2, 0x173a5c);
        this.tweens.add({
          targets: fish,
          x: targetX - 60 + i * 12,
          y: targetY + 72 + (i % 3) * 8,
          duration: 1250,
          delay: 700 + i * 45,
          onComplete: () => fish.destroy(),
        });
      }
      this.tweens.add({
        targets: rescued,
        x: targetX,
        y: targetY + 96,
        duration: 1400,
        delay: 760,
        ease: "Sine.easeInOut",
      });
    }
  }

  private playSharks(): void {
    this.showEventCard("SHARK ATTACK", "The returning treasure fleet draws hungry company.");
    if (this.textures.exists(VOYAGE.sharkAttack.key)) {
      this.ensureAnim("voyage-shark-attack", VOYAGE.sharkAttack.key, 8, 10, -1);
      for (let i = 0; i < 3; i += 1) {
        const pack = this.add.sprite(-120 - i * 160, 430 + (i % 2) * 40, VOYAGE.sharkAttack.key, "f0")
          .setDisplaySize(220, 160)
          .setDepth(270);
        pack.play("voyage-shark-attack");
        this.tweens.add({
          targets: pack,
          x: 1200,
          duration: 1700 + i * 120,
          delay: i * 90,
          ease: "Sine.easeInOut",
          onComplete: () => pack.destroy(),
        });
      }
    } else if (this.textures.exists(VOYAGE.shark.key)) {
      const pack = this.add.image(-160, 450, VOYAGE.shark.key).setDisplaySize(280, 200).setDepth(270);
      this.tweens.add({
        targets: pack,
        x: 1200,
        duration: 1800,
        ease: "Sine.easeInOut",
        onComplete: () => pack.destroy(),
      });
    } else {
      for (let i = 0; i < 7; i += 1) {
        const fin = this.add.triangle(-80 - i * 75, 440 + (i % 3) * 46, 0, 40, 35, 0, 70, 40, 0x35556b, 1);
        fin.setStrokeStyle(4, 0x17283a);
        this.tweens.add({
          targets: fin,
          x: 1120 + i * 20,
          y: fin.y + Math.sin(i) * 70,
          duration: 1550 + i * 90,
          delay: i * 80,
          ease: "Sine.easeInOut",
          onComplete: () => fin.destroy(),
        });
      }
    }
    this.time.delayedCall(900, () => {
      this.cameras.main.shake(340, 0.008);
      this.ships.forEach((ship) => this.tweens.add({ targets: ship, angle: { from: -7, to: 7 }, duration: 90, yoyo: true, repeat: 3 }));
    });
  }

  private playMaroon(playerId?: string): void {
    const ship = playerId ? this.ships.get(playerId) : undefined;
    if (!ship) return;
    this.showEventCard("MAROONED", "One ship leaves the fleet and finds land the hard way.");
    this.tweens.add({
      targets: ship,
      x: 85,
      y: 280,
      angle: -18,
      duration: 1350,
      ease: "Sine.easeIn",
      onComplete: () => {
        this.cameras.main.shake(260, 0.01);
        this.showFloating(120, 225, "CRASH!", "#fff0bd");
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Items
  // ---------------------------------------------------------------------------

  private armOrUseItem(uid: string, powerUpId: PowerUpId): void {
    const def = POWERUPS[powerUpId];
    if (this.snapshot.game?.phase !== "question") {
      this.showNotice("Items are used during questions", "#ffb58f");
      return;
    }
    if (def.target === "otherPlayer") {
      this.armedItem = { uid, powerUpId };
      this.renderTargeting();
      this.showNotice(`${def.name}: choose a ship`, "#ffe17a");
    } else {
      gameEventBridge.send({ type: "powerup", uid });
    }
  }

  private renderTargeting(): void {
    this.armedItem = this.snapshot.targeting ?? this.armedItem;
    if (!this.armedItem) return;
    this.ships.forEach((ship, playerId) => {
      if (playerId === this.snapshot.playerId) return;
      const ring = this.add.circle(ship.x, ship.y, 58, 0xff533f, 0.08).setStrokeStyle(5, 0xff634f, 0.95);
      this.tweens.add({ targets: ring, scale: 1.16, alpha: 0.25, duration: 440, yoyo: true, repeat: -1 });
      ring.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
        const armed = this.armedItem;
        if (!armed) return;
        gameEventBridge.send({ type: "powerup", uid: armed.uid, targetId: playerId });
        gameEventBridge.send({ type: "clearTargeting" });
        this.armedItem = undefined;
        ring.destroy();
      });
    });
  }

  private playItemEffect(fired: FiredPowerUp): void {
    const source = this.ships.get(fired.byId);
    if (!source) return;
    const def = POWERUPS[fired.powerUpId];
    fired.targetIds.forEach((targetId, index) => {
      const target = this.ships.get(targetId) ?? source;
      this.time.delayedCall(index * 120, () => {
        if (fired.powerUpId === "cannonball" || fired.powerUpId === "cannonballBarrage") {
          this.fireCannon(source.x, source.y, target.x, target.y);
        } else if (fired.powerUpId === "hook") {
          this.flyFxProp(FX_INDEX.hook, source.x, source.y - 20, target.x, target.y);
        } else if (fired.powerUpId === "parrot") {
          this.flyFxProp(FX_INDEX.parrot, source.x, source.y - 40, target.x, target.y - 70);
        } else if (fired.powerUpId === "barnacle" || fired.powerUpId === "barnacleInfestation") {
          this.flyFxProp(FX_INDEX.net, source.x, source.y - 20, target.x, target.y);
        } else if (fired.powerUpId === "whiteFlag") {
          this.flyFxProp(FX_INDEX.whiteFlag, target.x, target.y - 40, target.x, target.y - 80);
        } else if (fired.powerUpId === "eyepatch") {
          this.flyFxProp(FX_INDEX.eyepatch, target.x, target.y - 20, target.x, target.y - 70);
        } else if (fired.powerUpId === "rumRush") {
          this.flyFxProp(FX_INDEX.rum, target.x, target.y, target.x, target.y - 40);
        } else {
          const aura = this.add.circle(target.x, target.y, 48, this.itemColor(fired.powerUpId), 0.2).setStrokeStyle(5, this.itemColor(fired.powerUpId), 0.9);
          this.tweens.add({ targets: aura, scale: 2.2, alpha: 0, duration: 900, onComplete: () => aura.destroy() });
        }
        this.showFloating(target.x, target.y - 85, def.name.toUpperCase(), "#fff0bd");
      });
    });
  }

  private fireCannon(fromX: number, fromY: number, toX: number, toY: number): void {
    const ball = this.add.image(fromX, fromY - 15, "cannonball").setDisplaySize(30, 30);
    const smoke = this.add.circle(fromX, fromY, 22, 0xe8eef1, 0.75);
    this.tweens.add({ targets: smoke, scale: 2.2, alpha: 0, duration: 550, onComplete: () => smoke.destroy() });
    this.tweens.add({
      targets: ball,
      x: toX,
      y: toY,
      duration: 520,
      ease: "Quad.easeIn",
      onComplete: () => {
        ball.destroy();
        const impact = this.add.circle(toX, toY, 28, 0xff9c48, 0.95);
        this.tweens.add({ targets: impact, scale: 2.8, alpha: 0, duration: 420, onComplete: () => impact.destroy() });
        this.cameras.main.shake(120, 0.006);
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Drawing helpers
  // ---------------------------------------------------------------------------

  private createShip(
    player: PublicPlayer,
    x: number,
    y: number,
    scale: number,
    leaderLook = false,
  ): Phaser.GameObjects.Container {
    const color = PLAYER_COLORS[(player.rank - 1) % PLAYER_COLORS.length] ?? PLAYER_COLORS[0]!;
    const captain = leaderLook || this.snapshot.game?.arcade?.leaderId === player.id;
    const mine = player.id === this.snapshot.playerId;
    const root = this.add.container(x, y).setScale(scale);
    root.setData("homeX", x);
    root.setData("homeY", y);

    if (this.textures.exists(VOYAGE.scouts.key)) {
      this.ensureSheetFrames(VOYAGE.scouts.key, VOYAGE.scouts.cols, VOYAGE.scouts.rows);
      const shipIndex = captain ? 6 + (player.rank % 2) : (player.rank - 1) % 6;
      const hullArt = this.add
        .image(0, -4, VOYAGE.scouts.key, `f${shipIndex}`)
        .setDisplaySize(captain ? 172 : 140, captain ? 128 : 104);
      if (captain) hullArt.setTint(0xffe39a);
      else if (mine) hullArt.setTint(0xfff8e8);
      root.add(hullArt);
      root.setData("hullSprite", hullArt);
    } else if (this.textures.exists(VOYAGE.ships.key)) {
      this.ensureSheetFrames(VOYAGE.ships.key, VOYAGE.ships.cols, VOYAGE.ships.rows);
      const shipIndex = captain ? 8 : (player.rank - 1) % 8;
      const hullArt = this.add
        .image(0, -6, VOYAGE.ships.key, `f${shipIndex}`)
        .setDisplaySize(160, 120);
      if (captain) hullArt.setTint(0xffe39a);
      root.add(hullArt);
      root.setData("hullSprite", hullArt);
    } else {
      const hull = this.add.graphics();
      hull.fillStyle(0x754127, 1);
      hull.lineStyle(7, INK, 1);
      hull.beginPath();
      hull.moveTo(-94, 18);
      hull.lineTo(96, 18);
      hull.lineTo(70, 68);
      hull.lineTo(-64, 68);
      hull.closePath();
      hull.fillPath();
      hull.strokePath();
      hull.fillStyle(color, 1);
      hull.fillRect(-83, 25, 160, 12);
      hull.lineStyle(6, INK, 1);
      hull.lineBetween(0, 18, 0, -98);
      hull.fillStyle(captain ? GOLD : 0xf5e8c8, 1);
      hull.beginPath();
      hull.moveTo(4, -91);
      hull.lineTo(82, -67);
      hull.lineTo(70, -14);
      hull.lineTo(4, 3);
      hull.closePath();
      hull.fillPath();
      hull.strokePath();
      root.add(hull);
    }
    // Monogram only on the hull plaque — no crown, no selector ring.
    const mark = (player.monogram || player.nickname.slice(0, 3)).toUpperCase().slice(0, 3);
    const mono = this.add
      .text(0, 10, mark, {
        fontFamily: "Lilita One",
        fontSize: captain ? "16px" : "14px",
        color: mine ? "#fff8d6" : "#3a2410",
        stroke: mine ? "#1a120c" : "#f3e2b0",
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    root.add(mono);
    this.tweens.add({
      targets: root,
      angle: { from: -1.8, to: 1.8 },
      duration: 2300 + player.rank * 110,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    return root;
  }

  private makeButton(x: number, y: number, width: number, height: number, label: string, color: number): Phaser.GameObjects.Container {
    const root = this.add.container(x, y);
    const shadow = this.add.rectangle(0, 6, width, height, 0x0a1420, 0.72).setStrokeStyle(4, INK);
    const face = this.add.rectangle(0, 0, width, height, color, 1).setStrokeStyle(5, INK);
    const gloss = this.add.rectangle(0, -height * 0.22, width - 18, height * 0.27, 0xffffff, 0.14);
    const text = this.add.text(0, 0, label, {
      fontFamily: "Lilita One",
      fontSize: `${Math.max(13, Math.min(20, height * 0.31))}px`,
      color: "#fff4cf",
      stroke: "#17233b",
      strokeThickness: 3,
      align: "center",
      wordWrap: { width: width - 18 },
    }).setOrigin(0.5);
    root.add([shadow, face, gloss, text]);
    root.setSize(width, height);
    root.setInteractive(
      new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
      Phaser.Geom.Rectangle.Contains,
    );
    root.on("pointerdown", () => root.setScale(0.95));
    root.on("pointerup", () => root.setScale(1));
    root.on("pointerout", () => root.setScale(1));
    return root;
  }

  private cropGridImage(image: Phaser.GameObjects.Image, cols: number, rows: number, index: number): void {
    const source = image.texture.getSourceImage() as HTMLImageElement;
    const width = source.naturalWidth || source.width;
    const height = source.naturalHeight || source.height;
    if (!width || !height) return;
    const frameWidth = Math.floor(width / cols);
    const frameHeight = Math.floor(height / rows);
    const col = index % cols;
    const row = Math.floor(index / cols) % rows;
    image.setCrop(col * frameWidth, row * frameHeight, frameWidth, frameHeight);
  }

  private coinStream(fromX: number, fromY: number, toX: number, toY: number): void {
    this.playSheetBurst(VOYAGE.coins.key, "voyage-coins", 8, 14, fromX, fromY, 120, 120);
    for (let i = 0; i < 9; i += 1) {
      const coin = this.add.image(fromX, fromY, "coin").setDisplaySize(24, 24);
      this.tweens.add({
        targets: coin,
        x: toX + Phaser.Math.Between(-22, 22),
        y: toY + Phaser.Math.Between(-12, 12),
        angle: 360,
        duration: 480,
        delay: i * 55,
        ease: "Quad.easeIn",
        onComplete: () => coin.destroy(),
      });
    }
  }

  private showEventCard(title: string, description: string): void {
    const root = this.add.container(505, 160).setDepth(300);
    const panel = this.add.rectangle(0, 0, 610, 94, 0x10253a, 0.96).setStrokeStyle(5, 0xf0c85f);
    const heading = this.add.text(0, -19, title.replace(/[^\x20-\x7E]/g, "").trim(), {
      fontFamily: "Lilita One",
      fontSize: "25px",
      color: "#ffe17b",
      align: "center",
    }).setOrigin(0.5);
    const body = this.add.text(0, 21, description, {
      fontFamily: "Nunito",
      fontStyle: "900",
      fontSize: "14px",
      color: "#f7efd5",
      align: "center",
      wordWrap: { width: 560 },
    }).setOrigin(0.5);
    root.add([panel, heading, body]);
    root.setScale(0.4).setAlpha(0);
    this.tweens.add({ targets: root, scale: 1, alpha: 1, duration: 260, ease: "Back.easeOut", hold: 850, yoyo: true, onComplete: () => root.destroy() });
  }

  private showNotice(text: string, color: string): void {
    const notice = this.add.text(505, 600, text, {
      fontFamily: "Nunito",
      fontStyle: "900",
      fontSize: "17px",
      color,
      backgroundColor: "#13283e",
      padding: { x: 16, y: 9 },
    }).setOrigin(0.5).setDepth(400);
    this.tweens.add({ targets: notice, y: 570, alpha: 0, duration: 1250, ease: "Quad.easeOut", onComplete: () => notice.destroy() });
  }

  private showFloating(x: number, y: number, text: string, color: string): void {
    const label = this.add.text(x, y, text, {
      fontFamily: "Lilita One",
      fontSize: "20px",
      color,
      stroke: "#17233b",
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(350);
    this.tweens.add({ targets: label, y: y - 50, alpha: 0, duration: 1000, onComplete: () => label.destroy() });
  }

  private drawCrown(x: number, y: number, scale = 1): void {
    const crown = this.add.graphics({ x, y });
    crown.fillStyle(GOLD, 1);
    crown.lineStyle(3, INK, 1);
    crown.fillTriangle(-16 * scale, 12 * scale, -16 * scale, -10 * scale, -4 * scale, 2 * scale);
    crown.fillTriangle(-6 * scale, 12 * scale, 0, -16 * scale, 7 * scale, 12 * scale);
    crown.fillTriangle(4 * scale, 12 * scale, 16 * scale, -10 * scale, 16 * scale, 12 * scale);
    crown.fillRect(-16 * scale, 7 * scale, 32 * scale, 10 * scale);
  }

  private drawCrownForContainer(container: Phaser.GameObjects.Container, x: number, y: number): void {
    const crown = this.add.graphics({ x, y });
    crown.fillStyle(GOLD, 1);
    crown.lineStyle(5, INK, 1);
    crown.fillTriangle(-28, 20, -28, -16, -8, 4);
    crown.fillTriangle(-12, 20, 0, -28, 13, 20);
    crown.fillTriangle(8, 20, 28, -16, 28, 20);
    crown.fillRect(-28, 12, 56, 18);
    container.add(crown);
  }

  private drawCross(x: number, y: number): void {
    const cross = this.add.graphics();
    cross.lineStyle(12, 0xd84b3f, 0.92);
    cross.lineBetween(x - 25, y - 25, x + 25, y + 25);
    cross.lineBetween(x + 25, y - 25, x - 25, y + 25);
  }

  private shortItemName(id: PowerUpId): string {
    const names: Record<PowerUpId, string> = {
      eyepatch: "EYEPATCH",
      parrot: "PARROT",
      telescope: "SCOPE",
      hook: "HOOK",
      whiteFlag: "WHITE FLAG",
      secretX: "SECRET X",
      rumRush: "RUM RUSH",
      walkThePlank: "PLANK",
      swordFight: "DUEL",
      cannonball: "CANNON",
      cannonballBarrage: "BARRAGE",
      barnacle: "BARNACLE",
      barnacleInfestation: "INFEST",
    };
    return names[id];
  }

  private itemColor(id: PowerUpId): number {
    return id === "rumRush" ? 0xe88c35 : id === "secretX" ? 0xe44f43 : id === "eyepatch" ? 0x768ba1 : 0x58c6d8;
  }

  private holeWords(text: string): string {
    return text.split(" ").map((word) => {
      if (word.length <= 2) return word;
      return `${word[0]}${"•".repeat(Math.max(1, word.length - 2))}${word[word.length - 1]}`;
    }).join(" ");
  }

  private sliceVoyageSheets(): void {
    const sheets: Array<{ key: string; cols: number; rows: number }> = [
      VOYAGE.islands,
      VOYAGE.biomes,
      VOYAGE.ships,
      VOYAGE.scouts,
      VOYAGE.potDrain,
      VOYAGE.pirates,
      VOYAGE.plunderBiomes,
      VOYAGE.lootParticles,
      VOYAGE.smashFx,
      VOYAGE.wrongReact,
      VOYAGE.avatars,
      VOYAGE.items,
      VOYAGE.fx,
      VOYAGE.chest,
      VOYAGE.shipIdle,
      VOYAGE.shipSail,
      VOYAGE.shipSailSmooth,
      VOYAGE.shipCheer,
      VOYAGE.shipWrong,
      VOYAGE.waves,
      VOYAGE.coins,
      VOYAGE.poseidonRise,
      VOYAGE.sharkAttack,
      VOYAGE.treasureDrain,
      VOYAGE.flag,
      VOYAGE.lockButton,
    ];
    for (const sheet of sheets) {
      this.ensureSheetFrames(sheet.key, sheet.cols, sheet.rows);
    }
  }

  private ensureSheetFrames(key: string, cols: number, rows: number): void {
    if (!this.textures.exists(key)) return;
    const tex = this.textures.get(key);
    const source = tex.getSourceImage() as HTMLImageElement;
    const width = source.naturalWidth || source.width;
    const height = source.naturalHeight || source.height;
    if (!width || !height) return;
    const frameWidth = Math.floor(width / cols);
    const frameHeight = Math.floor(height / rows);
    const stamp = `${cols}x${rows}:${width}x${height}`;
    if (tex.has("f0") && this.sheetSliceStamp.get(key) === stamp) return;
    for (let i = 0; i < cols * rows; i += 1) {
      if (tex.has(`f${i}`)) tex.remove(`f${i}`);
    }
    for (let i = 0; i < cols * rows; i += 1) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      tex.add(`f${i}`, 0, col * frameWidth, row * frameHeight, frameWidth, frameHeight);
    }
    this.sheetSliceStamp.set(key, stamp);
  }

  private ensureAnim(animKey: string, textureKey: string, frameCount: number, frameRate: number, repeat: number): void {
    if (!this.textures.exists(textureKey) || this.anims.exists(animKey)) return;
    this.anims.create({
      key: animKey,
      frames: Array.from({ length: frameCount }, (_, index) => ({ key: textureKey, frame: `f${index}` })),
      frameRate,
      repeat,
    });
  }

  private spawnAmbientWaves(): void {
    if (!this.textures.exists(VOYAGE.waves.key)) return;
    this.ensureAnim("voyage-wave-crest", VOYAGE.waves.key, 4, 5, -1);
    for (let i = 0; i < 5; i += 1) {
      const wave = this.add.sprite(140 + i * 180, 500 + (i % 2) * 36, VOYAGE.waves.key, "f0")
        .setDisplaySize(150, 72)
        .setAlpha(0.5)
        .setDepth(-0.4);
      wave.play("voyage-wave-crest");
      this.tweens.add({
        targets: wave,
        x: wave.x + (i % 2 ? 40 : -40),
        duration: 3200 + i * 200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  private spawnAmbientFlag(x: number, y: number): void {
    if (!this.textures.exists(VOYAGE.flag.key)) return;
    this.ensureAnim("voyage-flag", VOYAGE.flag.key, 8, 8, -1);
    const flag = this.add.sprite(x, y, VOYAGE.flag.key, "f0").setDisplaySize(70, 90).setDepth(5);
    flag.play("voyage-flag");
  }

  private playSheetBurst(
    textureKey: string,
    animKey: string,
    frames: number,
    frameRate: number,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    if (!this.textures.exists(textureKey)) return;
    this.ensureAnim(animKey, textureKey, frames, frameRate, 0);
    const sprite = this.add.sprite(x, y, textureKey, "f0").setDisplaySize(width, height).setDepth(260);
    sprite.play(animKey);
    sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => sprite.destroy());
  }

  private flyFxProp(frameIndex: number, fromX: number, fromY: number, toX: number, toY: number): void {
    if (!this.textures.exists(VOYAGE.fx.key)) return;
    const prop = this.add.image(fromX, fromY, VOYAGE.fx.key);
    this.cropGridImage(prop, VOYAGE.fx.cols, VOYAGE.fx.rows, frameIndex);
    prop.setDisplaySize(64, 64).setDepth(250);
    this.tweens.add({
      targets: prop,
      x: toX,
      y: toY,
      angle: 220,
      duration: 700,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.tweens.add({ targets: prop, alpha: 0, scale: 1.4, duration: 220, onComplete: () => prop.destroy() });
      },
    });
  }

  private generateFallbackTextures(): void {
    if (!this.textures.exists("coin")) {
      const graphics = this.add.graphics();
      graphics.fillStyle(GOLD, 1);
      graphics.lineStyle(4, 0x8f5a1d, 1);
      graphics.fillCircle(18, 18, 15);
      graphics.strokeCircle(18, 18, 15);
      graphics.fillStyle(0xfff1a0, 1);
      graphics.fillEllipse(13, 11, 9, 5);
      graphics.generateTexture("coin", 36, 36);
      graphics.destroy();
    }
    if (!this.textures.exists("cannonball")) {
      const graphics = this.add.graphics();
      graphics.fillStyle(0x202a35, 1);
      graphics.lineStyle(4, 0x0b1118, 1);
      graphics.fillCircle(16, 16, 13);
      graphics.strokeCircle(16, 16, 13);
      graphics.fillStyle(0x677789, 0.9);
      graphics.fillEllipse(11, 10, 8, 5);
      graphics.generateTexture("cannonball", 32, 32);
      graphics.destroy();
    }
    if (!this.textures.exists("wave")) {
      const graphics = this.add.graphics();
      graphics.fillStyle(0xffffff, 0.82);
      graphics.fillRect(0, 20, 256, 28);
      for (let i = 0; i < 8; i += 1) graphics.fillCircle(i * 32 + 16, 20, 16);
      graphics.generateTexture("wave", 256, 48);
      graphics.destroy();
    }
  }
}
