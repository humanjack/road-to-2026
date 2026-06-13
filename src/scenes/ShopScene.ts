import Phaser from 'phaser';
import { C, CSS, FONT_DISPLAY, FONT_BODY, GAME_W, GAME_H } from '../ui/theme';
import { getSave, isUnlocked, unlockItem, spendCoins, equipCosmetic } from '../core/save';
import { SHOP_ITEMS, ballColor, type ShopItem } from '../data/extras';
import type { Cosmetics } from '../data/types';
import { audio } from '../core/audio';

export class ShopScene extends Phaser.Scene {
  private coinsText!: Phaser.GameObjects.Text;

  constructor() {
    super('Shop');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(C.indigo);
    this.add
      .text(GAME_W / 2, 56, 'AURORA SHOP', { fontFamily: FONT_DISPLAY, fontSize: '40px', color: CSS.gold })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 92, 'Spend coins earned from matches and cups', {
        fontFamily: FONT_BODY,
        fontSize: '16px',
        color: CSS.mid,
      })
      .setOrigin(0.5);

    this.coinsText = this.add
      .text(GAME_W - 40, 56, '', { fontFamily: FONT_DISPLAY, fontSize: '24px', color: CSS.cyan })
      .setOrigin(1, 0.5);
    this.refreshCoins();

    const cols = 2;
    const cardW = 520;
    const cardH = 110;
    const gx = 40;
    const gy = 24;
    const startX = (GAME_W - (cols * cardW + (cols - 1) * gx)) / 2;
    const startY = 150;
    SHOP_ITEMS.forEach((item, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      this.makeItem(item, startX + col * (cardW + gx), startY + row * (cardH + gy), cardW, cardH);
    });

    const back = this.add
      .text(GAME_W / 2, GAME_H - 56, 'BACK TO MENU', {
        fontFamily: FONT_DISPLAY,
        fontSize: '22px',
        color: CSS.white,
        backgroundColor: CSS.surge,
        padding: { x: 24, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => {
      audio.resume();
      audio.play('ui');
      this.scene.start('Menu');
    });
  }

  private refreshCoins(): void {
    this.coinsText.setText(`${getSave().coins} coins`);
  }

  private makeItem(item: ShopItem, x: number, y: number, w: number, h: number): void {
    const g = this.add.graphics();
    g.fillStyle(C.dark, 0.9);
    g.fillRoundedRect(x, y, w, h, 10);
    g.lineStyle(1.5, C.mid, 0.5);
    g.strokeRoundedRect(x, y, w, h, 10);

    // preview swatch
    if (item.type === 'ball') {
      g.fillStyle(ballColor(item.cosmeticValue ?? 'default'), 1);
      g.fillCircle(x + 44, y + h / 2, 22);
      g.lineStyle(2, C.deep, 1);
      g.strokeCircle(x + 44, y + h / 2, 22);
    } else if (item.type === 'pitch') {
      g.fillStyle(0x16331f, 1);
      g.fillRoundedRect(x + 22, y + h / 2 - 22, 44, 44, 6);
      g.fillStyle(0x7b5cff, 0.4);
      g.fillRoundedRect(x + 22, y + h / 2 - 22, 44, 22, 6);
    } else {
      g.fillStyle(C.gold, 1);
      g.fillCircle(x + 44, y + h / 2, 22);
      this.add
        .text(x + 44, y + h / 2, 'W11', { fontFamily: FONT_DISPLAY, fontSize: '14px', color: CSS.deep })
        .setOrigin(0.5);
    }

    this.add.text(x + 86, y + 20, item.name, { fontFamily: FONT_DISPLAY, fontSize: '22px', color: CSS.light });
    this.add.text(x + 86, y + 52, item.desc, { fontFamily: FONT_BODY, fontSize: '14px', color: CSS.mid });

    // action button (state-dependent)
    const btnW = 130;
    const btnH = 44;
    const bx = x + w - btnW / 2 - 18;
    const by = y + h / 2;
    const bg = this.add.graphics();
    const label = this.add.text(bx, by, '', { fontFamily: FONT_DISPLAY, fontSize: '16px', color: CSS.white }).setOrigin(0.5);
    const zone = this.add.zone(bx, by, btnW, btnH).setInteractive({ useHandCursor: true });

    const slot: keyof Cosmetics | null = item.type === 'ball' ? 'ball' : item.type === 'pitch' ? 'pitch' : null;

    const render = () => {
      const save = getSave();
      const owned = isUnlocked(item.id);
      const equipped = slot ? save.cosmetics[slot] === item.cosmeticValue : false;
      let text: string;
      let fill: number;
      if (!owned) {
        const afford = save.coins >= item.cost;
        text = `BUY ${item.cost}`;
        fill = afford ? C.surge : C.dark;
      } else if (slot) {
        text = equipped ? 'EQUIPPED' : 'EQUIP';
        fill = equipped ? C.lime : C.cyan;
      } else {
        text = 'OWNED';
        fill = C.lime;
      }
      bg.clear();
      bg.fillStyle(fill, 1);
      bg.fillRoundedRect(bx - btnW / 2, by - btnH / 2, btnW, btnH, 8);
      label.setText(text).setColor(owned && !equipped ? CSS.deep : owned ? CSS.deep : CSS.white);
    };
    render();

    zone.on('pointerdown', () => {
      audio.resume();
      const save = getSave();
      const owned = isUnlocked(item.id);
      if (!owned) {
        if (spendCoins(item.cost)) {
          unlockItem(item.id);
          if (slot && item.cosmeticValue) equipCosmetic(slot, item.cosmeticValue);
          audio.play('win');
        } else {
          audio.play('save'); // "denied" thud
        }
      } else if (slot && item.cosmeticValue) {
        const equipped = save.cosmetics[slot] === item.cosmeticValue;
        equipCosmetic(slot, equipped ? 'default' : item.cosmeticValue);
        audio.play('ui');
      }
      this.refreshCoins();
      render();
    });
  }
}
