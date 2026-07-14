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
import seaBackgroundUrl from "../../assets/higgsfield/loot-drop/a1-background.webp";
import islandSheetUrl from "../../assets/higgsfield/loot-drop/a2-islands-cut.webp";
import shipSheetUrl from "../../assets/higgsfield/loot-drop/a3-ships-cut.webp";
import chestSheetUrl from "../../assets/higgsfield/loot-drop/a5-chests-cut.webp";
import {
  gameEventBridge,
  type FiredPowerUp,
  type GameSnapshot,
  type TargetingIntent,
} from "../GameEventBridge";

const W = 1280;
const H = 720;
const WORLD_W = 1010;
const LEADERBOARD_X = 1138;
const ISLAND_POSITIONS: ReadonlyArray<readonly [number, number]> = [
  [235, 270],
  [740, 270],
  [235, 480],
  [740, 480],
];
const PLAYER_COLORS = [0x38bdf8, 0xf97316, 0xa78bfa, 0x22c55e, 0xfb7185, 0xfacc15, 0x2dd4bf, 0xe879f9];
const INK = 0x17233b;
const CREAM = "#fff6d6";
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
  private draftChoice?: number;
  private draftAllocation = [0, 0, 0, 0];
  private ships = new Map<string, Phaser.GameObjects.Container>();
  private islands: IslandView[] = [];
  private timerText?: Phaser.GameObjects.Text;
  private potText?: Phaser.GameObjects.Text;
  private potChest?: Phaser.GameObjects.Container;
  private armedItem?: TargetingIntent;
  private lastFiredKey = 0;
  private lastRevealKey = "";
  private mutinyConfirming = false;

  constructor() {
    super("ArcadeGameplay");
  }

  preload(): void {
    this.load.image("hf-sea", seaBackgroundUrl);
    this.load.image("hf-islands", islandSheetUrl);
    this.load.image("hf-ships", shipSheetUrl);
    this.load.image("hf-chests", chestSheetUrl);
  }

  create(): void {
    this.generateFallbackTextures();
    this.unsubscribe = gameEventBridge.subscribe((snapshot) => this.applySnapshot(snapshot));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribe?.());
  }

  override update(): void {
    const game = this.snapshot.game;
    if (!game || !this.timerText) return;
    const remaining = Math.max(0, game.timerEndsAt - Date.now());
    const seconds = Math.ceil(remaining / 1000);
    this.timerText.setText(`${seconds}s`);

    if (game.phase === "question" && !game.arcade?.isEventRound && game.arcade && this.potText) {
      const pot = potAt(Date.now(), game.arcade.questionStartedAt, game.arcade.questionDurationMs);
      this.potText.setText(`${pot}`);
      const ratio = (pot - game.arcade.potMin) / Math.max(1, game.arcade.potMax - game.arcade.potMin);
      this.potText.setColor(ratio < 0.3 ? "#ff7f66" : "#ffd45f");
      this.potChest?.setScale(0.82 + ratio * 0.18);
      if (ratio < 0.25 && this.potChest && !this.tweens.isTweening(this.potChest)) {
        this.tweens.add({ targets: this.potChest, angle: { from: -2, to: 2 }, duration: 80, yoyo: true, repeat: 3 });
      }
    }
  }

  private applySnapshot(snapshot: GameSnapshot): void {
    const previous = this.snapshot;
    this.snapshot = snapshot;
    const game = snapshot.game;
    if (!game) return;

    const me = game.players.find((player) => player.id === snapshot.playerId);
    const mode = game.phase === "reveal"
      ? "reveal"
      : game.phase === "question" && me?.marooned
        ? "marooned"
        : game.phase === "question" && game.arcade?.isEventRound
          ? "loot"
          : game.phase === "question"
            ? "question"
            : "waiting";
    const nextKey = `${mode}:${game.question?.id ?? "none"}`;

    const firedChanged = snapshot.fired && snapshot.fired.key !== this.lastFiredKey;
    const targetingChanged = snapshot.targeting !== previous.targeting;
    const privateChanged = snapshot.priv !== previous.priv;
    const gameChanged = snapshot.game !== previous.game;

    if (nextKey !== this.modeKey) {
      this.modeKey = nextKey;
      this.draftChoice = snapshot.priv?.selectedChoiceIndex;
      this.draftAllocation = [...(snapshot.priv?.lootAllocation ?? [0, 0, 0, 0])];
      this.mutinyConfirming = false;
      this.renderMode(mode);
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

    if (mode === "loot") this.renderLootDrop();
    else if (mode === "marooned") this.renderMarooned();
    else if (mode === "reveal") this.renderReveal();
    else if (mode === "question") this.renderQuestion();
    else this.renderSeaWorld();
  }

  // ---------------------------------------------------------------------------
  // Shared world and HUD
  // ---------------------------------------------------------------------------

  private renderSeaWorld(): void {
    const bg = this.add.image(WORLD_W / 2, H / 2, "hf-sea").setDisplaySize(WORLD_W, H).setTint(0xffe4bd);
    bg.setAlpha(0.62);

    const sky = this.add.graphics();
    sky.fillGradientStyle(0x74cbea, 0x74cbea, 0xf6c978, 0xf6c978, 0.72);
    sky.fillRect(0, 0, WORLD_W, 300);
    sky.setDepth(-2);

    const water = this.add.graphics();
    water.fillGradientStyle(0x267fa6, 0x267fa6, 0x0d547d, 0x0d547d, 0.88);
    water.fillRect(0, 300, WORLD_W, 420);
    water.setDepth(-1);

    for (let row = 0; row < 8; row += 1) {
      const wave = this.add.tileSprite(WORLD_W / 2, 340 + row * 48, WORLD_W, 48, "wave");
      wave.setAlpha(0.12 + row * 0.018).setTint(row % 2 ? 0xb9efff : 0x73d3e8);
      this.tweens.add({
        targets: wave,
        tilePositionX: row % 2 ? 180 : -180,
        duration: 14000 + row * 900,
        repeat: -1,
        ease: "Linear",
      });
    }
    this.addSun();
  }

  private addSun(): void {
    const sun = this.add.circle(120, 104, 48, 0xffe5a0, 0.96);
    sun.setStrokeStyle(10, 0xfff1bd, 0.28);
    this.tweens.add({ targets: sun, scale: 1.08, alpha: 0.82, duration: 2300, yoyo: true, repeat: -1 });
  }

  private createQuestionBanner(game: PublicGameState): void {
    const panel = this.add.graphics();
    panel.fillStyle(0x152b42, 0.93);
    panel.lineStyle(5, 0xe8c267, 1);
    panel.fillRoundedRect(115, 16, 780, 96, 22);
    panel.strokeRoundedRect(115, 16, 780, 96, 22);
    this.add.text(505, 62, game.question?.prompt ?? "Charting the next waters...", {
      fontFamily: "Nunito, sans-serif",
      fontStyle: "900",
      fontSize: "25px",
      color: CREAM,
      align: "center",
      wordWrap: { width: 720 },
      stroke: "#0a1426",
      strokeThickness: 4,
    }).setOrigin(0.5);
  }

  private createLeaderboard(game: PublicGameState): void {
    const panel = this.add.graphics();
    panel.fillStyle(0xf2dfb2, 0.96);
    panel.lineStyle(6, 0x74401f, 1);
    panel.fillRoundedRect(1020, 18, 236, 594, 18);
    panel.strokeRoundedRect(1020, 18, 236, 594, 18);
    this.add.text(LEADERBOARD_X, 45, "FLEET RANK", {
      fontFamily: "Lilita One, sans-serif",
      fontSize: "25px",
      color: "#3b2417",
    }).setOrigin(0.5);

    const sorted = [...game.players].sort((a, b) => a.rank - b.rank);
    sorted.forEach((player, index) => {
      const y = 86 + index * 62;
      const mine = player.id === this.snapshot.playerId;
      const captain = game.arcade?.leaderId === player.id;
      const row = this.add.graphics();
      row.fillStyle(mine ? 0x2c6581 : 0x9c6c3d, mine ? 0.98 : 0.18);
      row.fillRoundedRect(1035, y - 24, 206, 50, 12);
      row.lineStyle(2, captain ? GOLD : 0x7c4b2c, captain ? 1 : 0.4);
      row.strokeRoundedRect(1035, y - 24, 206, 50, 12);
      this.add.text(1048, y, `${player.rank}`, {
        fontFamily: "Lilita One",
        fontSize: "22px",
        color: captain ? "#b36b00" : mine ? "#ffffff" : "#3b2417",
      }).setOrigin(0, 0.5);
      this.add.text(1080, y - 8, player.nickname, {
        fontFamily: "Nunito",
        fontStyle: "900",
        fontSize: "15px",
        color: mine ? "#ffffff" : "#3b2417",
      }).setOrigin(0, 0.5);
      this.add.text(1080, y + 12, `${player.score} gold · streak ${player.streak}`, {
        fontFamily: "Nunito",
        fontStyle: "700",
        fontSize: "11px",
        color: mine ? "#d7f4ff" : "#70513c",
      }).setOrigin(0, 0.5);
      if (captain) this.drawCrown(1220, y - 14, 0.65);
    });
  }

  private createTimer(game: PublicGameState): void {
    const timerPanel = this.add.graphics();
    timerPanel.fillStyle(0x13263d, 0.92);
    timerPanel.lineStyle(3, 0xf0d17b, 0.9);
    timerPanel.fillRoundedRect(910, 24, 88, 56, 16);
    timerPanel.strokeRoundedRect(910, 24, 88, 56, 16);
    this.timerText = this.add.text(954, 52, "", {
      fontFamily: "Lilita One",
      fontSize: "28px",
      color: "#fff2bd",
    }).setOrigin(0.5);
  }

  private createInventory(game: PublicGameState, priv?: PrivatePlayerState): void {
    const dock = this.add.graphics();
    dock.fillStyle(0x10243a, 0.95);
    dock.lineStyle(4, 0x9c6a3d, 1);
    dock.fillRoundedRect(20, 625, 970, 80, 18);
    dock.strokeRoundedRect(20, 625, 970, 80, 18);

    this.add.text(38, 640, "BOOTY", {
      fontFamily: "Lilita One",
      fontSize: "17px",
      color: "#f4d986",
    });
    const slots = 5;
    for (let i = 0; i < slots; i += 1) {
      const x = 112 + i * 112;
      const item = priv?.powerUps[i];
      const slot = this.add.graphics();
      slot.fillStyle(item ? 0x24506a : 0x091725, item ? 1 : 0.7);
      slot.lineStyle(3, item ? 0xe7bd57 : 0x456279, item ? 1 : 0.55);
      slot.fillRoundedRect(x, 637, 98, 56, 12);
      slot.strokeRoundedRect(x, 637, 98, 56, 12);
      if (item) {
        const def = POWERUPS[item.powerUpId];
        const button = this.add.text(x + 49, 665, this.shortItemName(item.powerUpId), {
          fontFamily: "Nunito",
          fontStyle: "900",
          fontSize: "12px",
          color: "#fff5cf",
          align: "center",
          wordWrap: { width: 88 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        button.on("pointerdown", () => this.armOrUseItem(item.uid, item.powerUpId));
        button.setData("fullName", def.name);
      } else {
        this.add.text(x + 49, 665, "EMPTY", {
          fontFamily: "Nunito",
          fontStyle: "900",
          fontSize: "11px",
          color: "#587184",
        }).setOrigin(0.5);
      }
    }

    const me = game.players.find((player) => player.id === this.snapshot.playerId);
    if (me) {
      this.add.text(700, 647, `${me.score} GOLD`, {
        fontFamily: "Lilita One",
        fontSize: "22px",
        color: "#ffd45f",
      });
      this.add.text(700, 674, `RANK ${me.rank}   ·   STREAK ${me.streak}`, {
        fontFamily: "Nunito",
        fontStyle: "900",
        fontSize: "13px",
        color: "#d8ecf5",
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Regular question
  // ---------------------------------------------------------------------------

  private renderQuestion(): void {
    const game = this.snapshot.game;
    if (!game?.question) return;
    this.renderSeaWorld();
    this.createQuestionBanner(game);
    this.createLeaderboard(game);
    this.createTimer(game);
    this.createQuestionIslands(game);
    this.createFleet(game);
    this.createPotChest(game);
    this.createInventory(game, this.snapshot.priv);
    this.createConfirmButton(game);
    this.createMutinyButton(game);
    this.renderTargeting();
  }

  private createQuestionIslands(game: PublicGameState): void {
    this.islands = game.question?.options.slice(0, 4).map((option, index) => {
      const [x, y] = ISLAND_POSITIONS[index] ?? ISLAND_POSITIONS[0]!;
      const glow = this.add.ellipse(x, y + 18, 330, 178, 0xffde6c, 0).setStrokeStyle(5, 0xffdc66, 0);
      const island = this.add.image(x, y, "hf-islands");
      this.cropGridImage(island, 2, 2, index);
      island.setDisplaySize(210, 150).setTint(0xfff0c7).setInteractive({ useHandCursor: true });
      const plaque = this.add.graphics();
      plaque.fillStyle(0x142b43, 0.95);
      plaque.lineStyle(4, this.draftChoice === index ? GOLD : 0x8bb5c7, 1);
      plaque.fillRoundedRect(x - 174, y + 52, 348, 66, 14);
      plaque.strokeRoundedRect(x - 174, y + 52, 348, 66, 14);
      const display = this.snapshot.priv?.cannonballed ? this.holeWords(option) : option;
      const answer = this.add.text(x, y + 84, display, {
        fontFamily: "Nunito",
        fontStyle: "900",
        fontSize: "18px",
        color: "#fff6d6",
        align: "center",
        wordWrap: { width: 316 },
      }).setOrigin(0.5);
      const disabled = this.snapshot.priv?.disabledOptions?.includes(index);
      if (disabled) {
        island.setAlpha(0.28);
        answer.setAlpha(0.22);
        this.add.text(x, y + 82, "BLOCKED", {
          fontFamily: "Lilita One",
          fontSize: "21px",
          color: "#ff8066",
        }).setOrigin(0.5).setAngle(-8);
      } else {
        island.on("pointerover", () => {
          glow.setFillStyle(0xffde6c, 0.18).setStrokeStyle(5, 0xffdc66, 0.9);
          this.tweens.add({ targets: island, scaleX: island.scaleX * 1.04, scaleY: island.scaleY * 1.04, duration: 100 });
        });
        island.on("pointerout", () => glow.setFillStyle(0xffde6c, 0).setStrokeStyle(5, 0xffdc66, 0));
        island.on("pointerdown", () => this.chooseIsland(index));
      }
      if (this.snapshot.priv?.revealedAnswerIndex === index) {
        glow.setFillStyle(0xffe16a, 0.28).setStrokeStyle(8, GOLD, 1);
        this.add.text(x + 144, y + 40, "X", {
          fontFamily: "Lilita One",
          fontSize: "44px",
          color: "#d8382f",
          stroke: "#fff0bd",
          strokeThickness: 5,
        }).setOrigin(0.5).setAngle(-8);
      }
      const root = this.add.container(0, 0, [glow, island, plaque, answer]);
      return { root, glow, answer };
    }) ?? [];
  }

  private createFleet(game: PublicGameState): void {
    const visible = game.players.filter((player) => !player.marooned).sort((a, b) => a.rank - b.rank);
    visible.forEach((player, index) => {
      const column = index % 4;
      const row = Math.floor(index / 4);
      const x = 325 + column * 118 - row * 28;
      const y = 560 + row * 54 + (column % 2) * 8;
      const ship = this.createShip(player, x, y, 0.62);
      this.ships.set(player.id, ship);
    });
  }

  private createPotChest(game: PublicGameState): void {
    const arcade = game.arcade;
    if (!arcade) return;
    const root = this.add.container(68, 144);
    const glow = this.add.circle(0, 0, 58, 0xffd45f, 0.18);
    const chest = this.add.image(0, 0, "hf-chests");
    this.cropGridImage(chest, 4, 5, 0);
    chest.setDisplaySize(92, 84);
    const coins: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 7; i += 1) {
      const coin = this.add.circle(-32 + i * 10, 40 - (i % 2) * 7, 6, GOLD, 1).setStrokeStyle(2, 0x9d641c);
      coins.push(coin);
      this.tweens.add({
        targets: coin,
        y: coin.y + 20,
        alpha: 0,
        duration: 1800 + i * 180,
        delay: i * 130,
        repeat: -1,
      });
    }
    this.potText = this.add.text(0, 72, `${arcade.potMax}`, {
      fontFamily: "Lilita One",
      fontSize: "28px",
      color: "#ffd45f",
      stroke: "#17233b",
      strokeThickness: 5,
    }).setOrigin(0.5);
    root.add([glow, chest, ...coins, this.potText]);
    this.potChest = root;
  }

  private createConfirmButton(game: PublicGameState): void {
    const me = game.players.find((player) => player.id === this.snapshot.playerId);
    const committed = me?.hasAnswered || Boolean(this.snapshot.priv?.hasMutinied);
    const button = this.makeButton(840, 664, 250, 58, committed ? "ANSWER LOCKED" : "CONFIRM COURSE", committed ? 0x2f6572 : 0xb34227);
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
    this.draftChoice = index;
    this.renderMode("question");
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
    this.createTimer(game);
    this.createLootDestinations(game);
    this.createLootDock(game, priv);
  }

  private renderMapWorld(): void {
    const floor = this.add.graphics();
    floor.fillGradientStyle(0x4f2e1c, 0x4f2e1c, 0x1e3441, 0x1e3441, 1);
    floor.fillRect(0, 0, WORLD_W, H);
    for (let x = 0; x < WORLD_W; x += 90) {
      floor.lineStyle(4, 0x6c4228, 0.48);
      floor.lineBetween(x, 0, x + 60, H);
    }
    const map = this.add.graphics();
    map.fillStyle(0xe3c47f, 0.98);
    map.lineStyle(8, 0x754626, 1);
    map.fillRoundedRect(68, 126, 880, 474, 30);
    map.strokeRoundedRect(68, 126, 880, 474, 30);
    map.lineStyle(3, 0x9b7041, 0.35);
    for (let i = 0; i < 8; i += 1) map.lineBetween(95, 165 + i * 50, 918, 150 + i * 55);
  }

  private createLootDestinations(game: PublicGameState): void {
    const options = game.question?.options.slice(0, 4) ?? [];
    this.islands = options.map((option, index) => {
      const [x0, y0] = ISLAND_POSITIONS[index] ?? ISLAND_POSITIONS[0]!;
      const x = x0;
      const y = y0 + 30;
      const glow = this.add.ellipse(x, y, 300, 166, 0xffd75b, 0);
      const island = this.add.image(x, y - 22, "hf-islands");
      this.cropGridImage(island, 2, 2, index);
      island.setDisplaySize(170, 122).setTint(0xf3d795).setInteractive({ useHandCursor: true });
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
    const island = this.add.image(610, 410, "hf-islands");
    this.cropGridImage(island, 2, 2, 0);
    island.setDisplaySize(520, 370).setTint(0xffe0a1);
    const me = game.players.find((player) => player.id === this.snapshot.playerId);
    if (me) {
      const ship = this.createShip(me, 400, 515, 0.85);
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
    this.createTimer(game);
    const chest = this.snapshot.priv?.chests.find((entry) => entry.source === "marooned");
    const chestArt = this.add.image(760, 485, "hf-chests");
    this.cropGridImage(chestArt, 4, 5, 0);
    chestArt.setDisplaySize(150, 138);
    const glow = this.add.circle(760, 485, 90, 0xffe25f, 0.22);
    glow.setDepth(-0.5);
    this.tweens.add({ targets: [chestArt, glow], y: "-=10", scale: 1.08, duration: 800, yoyo: true, repeat: -1 });
    const open = this.makeButton(760, 610, 250, 54, chest ? "OPEN ISLAND CHEST" : "CHEST ALREADY CLAIMED", chest ? 0x9e4a25 : 0x526a70);
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
    const options = game.question?.options.slice(0, 4) ?? [];
    this.islands = options.map((option, index) => {
      const [x, y] = ISLAND_POSITIONS[index] ?? ISLAND_POSITIONS[0]!;
      const glow = this.add.ellipse(x, y + 18, 330, 180, 0xffdc63, 0);
      const island = this.add.image(x, y, "hf-islands");
      this.cropGridImage(island, 2, 2, index);
      island.setDisplaySize(205, 148).setTint(game.arcade?.isEventRound ? 0xf0d497 : 0xffefc2);
      const answer = this.add.text(x, y + 82, option, {
        fontFamily: "Nunito",
        fontStyle: "900",
        fontSize: "17px",
        color: game.arcade?.isEventRound ? "#35251d" : CREAM,
        backgroundColor: game.arcade?.isEventRound ? "#ead08e" : "#142b43",
        padding: { x: 12, y: 7 },
        align: "center",
        wordWrap: { width: 280 },
      }).setOrigin(0.5);
      const root = this.add.container(0, 0, [glow, island, answer]);
      return { root, glow, answer };
    });
  }

  private playRevealSequence(game: PublicGameState): void {
    const reveal = game.arcadeReveal;
    if (!reveal) return;
    const startPositions = game.players.map((player, index) => ({
      player,
      x: 370 + (index % 4) * 110,
      y: 585 + Math.floor(index / 4) * 45,
    }));
    const answerByPlayer = new Map(reveal.answers.map((answer) => [answer.playerId, answer]));

    startPositions.forEach(({ player, x, y }, index) => {
      const answer = answerByPlayer.get(player.id);
      if (game.arcade?.isEventRound && answer?.lootAllocation) {
        answer.lootAllocation.forEach((amount, islandIndex) => {
          const shipCount = Math.min(4, Math.ceil(amount / 50));
          for (let shipIndex = 0; shipIndex < shipCount; shipIndex += 1) {
            const mini = this.createShip(player, x + shipIndex * 12, y + shipIndex * 8, 0.34);
            this.sailShip(mini, islandIndex, index * 70 + shipIndex * 80, reveal.correctIndex === islandIndex);
          }
        });
      } else {
        const ship = this.createShip(player, x, y, 0.55);
        if (answer?.choiceIndex !== undefined) {
          this.sailShip(ship, answer.choiceIndex, index * 80, reveal.correctIndex === answer.choiceIndex);
        }
      }
    });

    this.time.delayedCall(1450, () => {
      this.islands.forEach((island, index) => {
        const correct = index === reveal.correctIndex;
        island.glow.setFillStyle(correct ? 0xffde61 : 0xd94d3f, correct ? 0.34 : 0.12);
        island.glow.setStrokeStyle(correct ? 8 : 4, correct ? GOLD : 0xe45b4e, correct ? 1 : 0.7);
        if (!correct) this.drawCross(ISLAND_POSITIONS[index]?.[0] ?? 0, (ISLAND_POSITIONS[index]?.[1] ?? 0) - 35);
      });
    });

    let delay = 2500;
    game.revealEvents.forEach((event) => {
      if (event.title.includes("POSEIDON")) {
        this.time.delayedCall(delay, () => this.playPoseidon(event.playerIds?.[0]));
        delay += 2800;
      } else if (event.title.includes("SHARK ATTACK")) {
        this.time.delayedCall(delay, () => this.playSharks());
        delay += 2500;
      } else if (event.animation === "mutiny") {
        this.time.delayedCall(delay, () => this.playMutiny(event.playerIds ?? []));
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

  private sailShip(ship: Phaser.GameObjects.Container, islandIndex: number, delay: number, correct: boolean): void {
    const [x, y] = ISLAND_POSITIONS[islandIndex] ?? ISLAND_POSITIONS[0]!;
    this.tweens.add({
      targets: ship,
      x: x + Phaser.Math.Between(-60, 60),
      y: y + 88 + Phaser.Math.Between(-12, 12),
      duration: 900 + delay * 0.25,
      delay,
      ease: "Sine.easeInOut",
      onComplete: () => {
        if (correct) this.coinStream(x, y + 25, ship.x, ship.y);
        else this.showFloating(ship.x, ship.y - 55, "NO TREASURE", "#ffb3a0");
      },
    });
  }

  private playMutiny(playerIds: string[]): void {
    this.showEventCard("MUTINY", "Cannons speak. The fleet discovers who stood together.");
    const captainId = this.snapshot.game?.arcade?.leaderId;
    const captain = captainId ? this.ships.get(captainId) : undefined;
    if (!captain) return;
    playerIds.filter((id) => id !== captainId).forEach((id, index) => {
      const source = this.ships.get(id);
      if (!source) return;
      this.time.delayedCall(index * 140, () => this.fireCannon(source.x, source.y, captain.x, captain.y));
    });
  }

  private playPoseidon(playerId?: string): void {
    this.showEventCard("POSEIDON'S RESCUE", "The sea god refuses to let the trailing fleet sink.");
    const wave = this.add.rectangle(500, 520, 1200, 150, 0x57d6ef, 0.72).setAngle(-5);
    wave.setStrokeStyle(10, 0xc9f8ff, 0.9);
    this.tweens.add({ targets: wave, y: 260, scaleY: 1.8, alpha: 0, duration: 1800, ease: "Sine.easeOut", onComplete: () => wave.destroy() });
    const god = this.add.container(500, 610);
    const body = this.add.ellipse(0, 0, 150, 230, 0x66cfe7, 0.95).setStrokeStyle(8, 0x173a5c);
    const head = this.add.circle(0, -125, 52, 0xe7c18f, 1).setStrokeStyle(7, 0x173a5c);
    const trident = this.add.graphics();
    trident.lineStyle(10, GOLD, 1);
    trident.lineBetween(80, -220, 80, 95);
    trident.lineBetween(50, -200, 110, -200);
    god.add([body, head, trident]);
    this.tweens.add({ targets: god, y: 375, duration: 650, ease: "Back.easeOut", yoyo: true, hold: 900, onComplete: () => god.destroy() });
    const rescued = playerId ? this.ships.get(playerId) : undefined;
    if (rescued) this.tweens.add({ targets: rescued, y: "-=80", duration: 600, yoyo: true, repeat: 1 });
  }

  private playSharks(): void {
    this.showEventCard("SHARK ATTACK", "The returning treasure fleet draws hungry company.");
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
          const rope = this.add.line(0, 0, source.x, source.y, target.x, target.y, 0xd4c299, 1).setOrigin(0);
          rope.setLineWidth(8);
          this.tweens.add({ targets: rope, alpha: 0, duration: 850, onComplete: () => rope.destroy() });
        } else if (fired.powerUpId === "parrot") {
          const parrot = this.add.circle(source.x, source.y - 45, 14, 0x40c75a, 1).setStrokeStyle(4, INK);
          this.tweens.add({ targets: parrot, x: target.x, y: target.y - 70, duration: 700, yoyo: true, hold: 350, onComplete: () => parrot.destroy() });
        } else if (fired.powerUpId === "whiteFlag") {
          const flag = this.add.rectangle(target.x, target.y - 80, 48, 32, 0xffffff, 1).setStrokeStyle(4, INK);
          this.tweens.add({ targets: flag, y: "-=24", duration: 450 });
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

  private createShip(player: PublicPlayer, x: number, y: number, scale: number): Phaser.GameObjects.Container {
    const color = PLAYER_COLORS[(player.rank - 1) % PLAYER_COLORS.length] ?? PLAYER_COLORS[0]!;
    const captain = this.snapshot.game?.arcade?.leaderId === player.id;
    const root = this.add.container(x, y).setScale(scale);
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
    const nameplate = this.add.rectangle(0, 47, 112, 25, 0x2d1c16, 0.94).setStrokeStyle(3, captain ? GOLD : 0xd4a45b);
    const name = this.add.text(0, 47, player.nickname, {
      fontFamily: "Nunito",
      fontStyle: "900",
      fontSize: "15px",
      color: "#fff0c4",
    }).setOrigin(0.5);
    root.add([hull, nameplate, name]);
    if (captain) this.drawCrownForContainer(root, 0, -116);
    if (player.streak >= 2) {
      const flame = this.add.circle(-72, -42, 12 + Math.min(12, player.streak * 2), 0xff7b3f, 0.9).setStrokeStyle(3, 0xffd45f);
      root.add(flame);
      this.tweens.add({ targets: flame, scaleY: 1.35, alpha: 0.65, duration: 240, yoyo: true, repeat: -1 });
    }
    player.powerUpIds.slice(0, 3).forEach((itemId, index) => {
      const badge = this.add.circle(58 + index * 25, -78, 12, 0x162b42, 0.95).setStrokeStyle(2, GOLD);
      const label = this.add.text(58 + index * 25, -78, this.shortItemName(itemId).slice(0, 1), {
        fontFamily: "Lilita One",
        fontSize: "12px",
        color: "#ffe484",
      }).setOrigin(0.5);
      root.add([badge, label]);
    });
    player.activePowerUpEffects.forEach((itemId, index) => {
      const marker = this.add.text(-84 + index * 34, -75, this.shortItemName(itemId).slice(0, 3), {
        fontFamily: "Nunito",
        fontStyle: "900",
        fontSize: "10px",
        color: "#fff8dc",
        backgroundColor: "#a13a2f",
        padding: { x: 4, y: 2 },
      });
      root.add(marker);
    });
    this.tweens.add({ targets: root, y: y - 6, duration: 1500 + player.rank * 90, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
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
    root.on("pointerdown", () => root.setScale(0.95));
    root.on("pointerup", () => root.setScale(1));
    root.setSize(width, height);
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
