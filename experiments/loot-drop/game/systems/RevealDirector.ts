import Phaser from "phaser";
import type { RevealPayload } from "../../../../shared/src/types";
import type { AnswerIsland } from "../objects/AnswerIsland";
import type { PlayerAvatar } from "../objects/PlayerAvatar";
import type { ScoreTicker } from "../objects/ScoreTicker";
import { EnemyShip } from "../objects/EnemyShip";
import { FloatingText } from "../objects/FloatingText";
import type { VfxSystem } from "./VfxSystem";
import type { CameraDirector } from "./CameraDirector";
import { soundEventBus } from "./SoundEventBus";

export interface RevealContext {
  islands: AnswerIsland[];
  avatars: Map<string, PlayerAvatar>;
  localPlayerId: string | null;
  scoreTicker: ScoreTicker;
  vfx: VfxSystem;
  camera: CameraDirector;
  showLeaderboard: (leaderboard: RevealPayload["leaderboard"]) => void;
  hideLeaderboard: () => void;
}

/**
 * Runs the full reveal showcase as a sequential timeline:
 * zoom -> island pulses -> gold reveal -> raiders sail in -> cannon fire ->
 * plunder -> payout -> reactions -> leaderboard.
 */
export class RevealDirector {
  private timers: Phaser.Time.TimerEvent[] = [];
  private ships: EnemyShip[] = [];
  playing = false;

  constructor(private scene: Phaser.Scene) {}

  private at(ms: number, fn: () => void): void {
    this.timers.push(this.scene.time.delayedCall(ms, fn));
  }

  cancel(): void {
    this.timers.forEach((t) => t.remove());
    this.timers = [];
    this.ships.forEach((s) => s.destroy());
    this.ships = [];
    this.playing = false;
  }

  play(payload: RevealPayload, ctx: RevealContext): void {
    this.cancel();
    this.playing = true;

    const { islands, avatars, vfx, camera } = ctx;
    const correct = islands[payload.correctIndex];
    const wrongIslands = islands.filter((i) => i.index !== payload.correctIndex);
    const W = this.scene.scale.width;
    const localResult = payload.results.find((r) => r.playerId === ctx.localPlayerId);

    // --- 0s: dramatic start
    this.at(0, () => {
      soundEventBus.emit("revealStart");
      camera.zoomTo(1.1, 800);
    });

    // --- 0.5s: all islands pulse in sequence
    islands.forEach((island, i) => {
      this.at(500 + i * 170, () => island.pulse());
    });

    // --- 1.5s: correct island turns gold
    this.at(1500, () => {
      soundEventBus.emit("correctIsland");
      correct.setCorrect();
      vfx.correctGlow(correct.x, correct.y - 20);
      camera.panTo(correct.x, correct.y, 500);
    });

    // --- 2.3s: wrong islands darken
    this.at(2300, () => {
      wrongIslands.forEach((island) => {
        island.setWrong();
        vfx.wrongFlash(island.x, island.y);
      });
      camera.reset(500);
      camera.zoomTo(1.08, 500);
    });

    // --- 2.9s: enemy ships sail toward wrong islands that hold loot
    const raidTargets = wrongIslands.filter((i) => payload.islandTotals[i.index] > 0);
    this.at(2900, () => {
      raidTargets.forEach((island, i) => {
        const fromLeft = island.x < W / 2;
        const ship = new EnemyShip(
          this.scene,
          fromLeft ? -140 : W + 140,
          island.y + 46 + i * 8,
        );
        this.ships.push(ship);
        ship.sailTo(island.x + (fromLeft ? -190 : 190), island.y + 40, 1300);
      });
    });

    // --- 4.4s: cannon bombardment
    this.at(4400, () => {
      raidTargets.forEach((island, i) => {
        const ship = this.ships[i];
        if (!ship) return;
        [0, 380, 760].forEach((delay, shot) => {
          this.at(delay, () => {
            soundEventBus.emit("cannonFire");
            ship.fireCannon({ x: island.x + (shot - 1) * 34, y: island.y - 8 }, vfx, () => {
              vfx.cannonImpact(island.x + (shot - 1) * 34, island.y - 8);
              vfx.splash(island.x, island.y + 60);
              camera.shake(0.007, 200);
              if (shot === 2) island.stampSkull();
            });
          });
        });
      });
    });

    // --- 6.2s: plunder -- loot on wrong islands streams into the raider ships
    this.at(6200, () => {
      soundEventBus.emit("plunder");
      raidTargets.forEach((island, i) => {
        const ship = this.ships[i];
        if (!ship) return;
        const total = payload.islandTotals[island.index];
        vfx.plunderTrail(
          { x: island.x, y: island.y },
          { x: ship.x, y: ship.y },
          Math.ceil(total / 10),
          { tint: 0xff9a9a },
        );
        island.drainChips();
      });
      // players who lost loot react
      payload.results.forEach((r) => {
        if (r.lost > 0) {
          const avatar = avatars.get(r.playerId);
          avatar?.react(r.lost >= 60 ? "angry" : "shocked");
          soundEventBus.emit("avatarReact");
        }
      });
      if (localResult && localResult.lost > 0) {
        FloatingText.spawn(this.scene, W / 2, 400, `PLUNDERED -${localResult.lost}`, "#ff5566", 44);
      }
    });

    // --- 7.8s: raiders retreat
    this.at(7800, () => {
      this.ships.forEach((ship) => ship.retreat(ship.x < W / 2 ? -200 : W + 200));
      this.ships = [];
    });

    // --- 8.2s: payout -- correct island pays back to every winner
    this.at(8200, () => {
      const winners = payload.results.filter((r) => r.gained > 0);
      winners.forEach((r) => {
        const isLocal = r.playerId === ctx.localPlayerId;
        const avatar = avatars.get(r.playerId);
        const dest = isLocal
          ? ctx.scoreTicker.center
          : avatar
            ? { x: avatar.x, y: avatar.y }
            : ctx.scoreTicker.center;
        vfx.plunderTrail(
          { x: correct.x, y: correct.y - 10 },
          dest,
          Math.ceil(r.gained / 20),
          {
            onDone: () => {
              vfx.sparkleBurst(dest.x, dest.y, 0xffd23e, 10);
            },
          },
        );
        avatar?.react("happy");
      });
      soundEventBus.emit("scoreGain");
      if (localResult) {
        if (localResult.gained > 0) {
          FloatingText.spawn(
            this.scene,
            ctx.scoreTicker.x,
            ctx.scoreTicker.y - 60,
            `+${localResult.gained}`,
            "#7cff4f",
            46,
          );
        }
        ctx.scoreTicker.setScore(localResult.newScore);
        if (localResult.gained >= 150) {
          soundEventBus.emit("chestEarned");
          vfx.coinBurst(ctx.scoreTicker.x, ctx.scoreTicker.y, 14);
        }
      }
      // sync every avatar's score readout
      payload.results.forEach((r) => avatars.get(r.playerId)?.setScore(r.newScore));
    });

    // --- 10.5s: zoom out, leaderboard slides in, winner celebrates
    this.at(10500, () => {
      camera.reset(700);
      ctx.showLeaderboard(payload.leaderboard);
      const top = payload.leaderboard[0];
      if (top) {
        avatars.get(top.playerId)?.react("winner");
      }
    });

    // --- 14.5s: leaderboard leaves, ready for next question
    this.at(14500, () => {
      ctx.hideLeaderboard();
      this.playing = false;
    });
  }
}
