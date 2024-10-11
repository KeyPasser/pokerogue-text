import { HTMLContainer, HTMLObject, getRootContainer } from "./Root";

import BattleScene, { AnySound } from "../battle-scene";

import { Moves } from "#enums/moves";
import DamageNumberHandler from "../field/damage-number-handler";
import PokemonInfoContainer from "../ui/pokemon-info-container";
import PokemonSpriteSparkleHandler from "../field/pokemon-sprite-sparkle-handler";
import { ArenaBase, getBiomeHasProps } from "../field/arena";
import { ArenaFlyout } from "../ui/arena-flyout";

import { PlayerGender } from "#enums/player-gender";
import HCharSprite from "./char-sprite";
import { HModifierBar } from "./Modifier";
import HAbilityBar from "./ability-bar";
import HPartyExpBar from "./party-exp-bar";
import HCandyBar from "./candy-bar";
import { TextPlugin } from "./TextPlugin";
import HTMLUI from "./UI";
import UI from "../ui/ui";

import SoundFade from "phaser3-rex-plugins/plugins/soundfade";
import { LoadingScene } from "../loading-scene";
import i18next from "i18next";
import HPokemonInfoContainer from "./pokemon-info-container";
import { addHTMLSprit } from "./PhaseInterface";
import { MoneyFormat } from "../enums/money-format";
import { LoginPhase } from "../phases/login-phase";
import { TitlePhase } from "../phases/title-phase";
import HDamageNumberHandler from "./damage-number-handler";

export const getProxy = (obj) => {
  if (obj) return obj;
  return new Proxy({}, {
    get: function (target, prop) {
      switch (prop) {
        case 'totalDuration':
          return 1;
        case 'destroy':
          return () => { };
        case 'pendingRemove':
          return true;
        default:
          console.error('prop not found!!!!', prop)
          return 0;
      }
    }
  });
}

class HArenaBase extends HTMLContainer{
  constructor(scene, text:boolean){
    super()
    this.scene = scene;
  }
  setBiome(): void {
    
  }
}
export default class TextBattleScene extends BattleScene {
  onlyText: boolean = true;
  textPlugin: TextPlugin;
  constructor() {
    super()
    this.children = this.uiContainer as any;
  }
  launchBattle() {
    this.moneyFormat = MoneyFormat.ABBREVIATED;
    
    SoundFade.fadeOut = (()=>{}) as any;
    
    const addSprite = this.add.sprite;
    const nineslice = this.add.nineslice
    //@ts-ignore
    this.add.nineslice = this.add.sprite = addHTMLSprit;
    const originAdd = this.tweens.add;
    this.tweens.add = (config) => {
      //@ts-ignore
      config.duration = 5;
      return originAdd.apply(this.tweens, [config])
    }

    const animsGet = this.anims.get;
    this.anims.get = () => {
      const a = animsGet.apply(this.anims, arguments);
      if(!a)return {}
      return a;
    }

    this.arenaBg = this.add.sprite(0, 0, "plains_bg");
    this.arenaBg.setName("sprite-arena-bg");
    this.arenaBgTransition = this.add.sprite(0, 0, "plains_bg");
    this.arenaBgTransition.setName("sprite-arena-bg-transition");

    [this.arenaBgTransition, this.arenaBg].forEach(a => {
      a.setPipeline(this.fieldSpritePipeline);
      a.setScale(6);
      a.setOrigin(0);
      a.setSize(320, 240);
    });

    const field = this.add.container(0, 0);
    field.setName("field");
    field.setScale(6);

    this.field = field;

    const fieldUI = this.add.container(0, this.game.canvas.height);
    fieldUI.setName("field-ui");
    fieldUI.setDepth(1);
    fieldUI.setScale(6);

    this.fieldUI = fieldUI;

    const uiContainer = this.add.container(0, 0);
    uiContainer.setName("ui");
    uiContainer.setDepth(2);
    uiContainer.setScale(6);

    this.uiContainer = uiContainer;

    const overlayWidth = this.game.canvas.width / 6;
    const overlayHeight = (this.game.canvas.height / 6) - 48;
    this.fieldOverlay = this.add.rectangle(0, overlayHeight * -1 - 48, overlayWidth, overlayHeight, 0x424242);
    this.fieldOverlay.setName("rect-field-overlay");
    this.fieldOverlay.setOrigin(0, 0);
    this.fieldOverlay.setAlpha(0);
    this.fieldUI.add(this.fieldOverlay);

    this.shopOverlay = this.add.rectangle(0, overlayHeight * -1 - 48, overlayWidth, overlayHeight, 0x070707);
    this.shopOverlay.setName("rect-shop-overlay");
    this.shopOverlay.setOrigin(0, 0);
    this.shopOverlay.setAlpha(0);
    this.fieldUI.add(this.shopOverlay);

    this.modifiers = [];
    this.enemyModifiers = [];

    //@ts-ignore
    this.modifierBar = new HModifierBar(this);
    this.modifierBar.setName("modifier-bar");
    this.add.existing(this.modifierBar);
    //uiContainer.add(this.modifierBar);

    //@ts-ignore
    this.enemyModifierBar = new HModifierBar(this, true);
    this.enemyModifierBar.setName("enemy-modifier-bar");
    this.add.existing(this.enemyModifierBar);
    //uiContainer.add(this.enemyModifierBar);

    //@ts-ignore
    this.charSprite = new HCharSprite(this);
    this.charSprite.setName("sprite-char");
    this.charSprite.setup();

    //this.fieldUI.add(this.charSprite);

    //@ts-ignore
    this.pbTray = new HCharSprite(this, true);
    this.pbTray.setName("pb-tray");
    this.pbTray.setup();

    //@ts-ignore
    this.pbTrayEnemy = new HCharSprite(this, false);
    this.pbTrayEnemy.setName("enemy-pb-tray");
    this.pbTrayEnemy.setup();

    //this.fieldUI.add(this.pbTray);
    //this.fieldUI.add(this.pbTrayEnemy);

    //@ts-ignore
    this.abilityBar = new HAbilityBar(this);
    this.abilityBar.setName("ability-bar");
    this.abilityBar.setup();
    //this.fieldUI.add(this.abilityBar);

    //@ts-ignore
    this.partyExpBar = new HPartyExpBar(this);
    this.partyExpBar.setName("party-exp-bar");
    this.partyExpBar.setup();
    //this.fieldUI.add(this.partyExpBar);

    //@ts-ignore
    this.candyBar = new HCandyBar(this);
    this.candyBar.setName("candy-bar");
    this.candyBar.setup();
    //this.fieldUI.add(this.candyBar);

    const rootContainer = getRootContainer(this);
    this.textPlugin = new TextPlugin(this);

    this.biomeWaveText = rootContainer.findObject("#text-biome-wave");
    this.biomeWaveText.setName("text-biome-wave");
    this.biomeWaveText.setOrigin(1, 0.5);
    //this.fieldUI.add(this.biomeWaveText);

    this.moneyText = rootContainer.findObject("#text-money");
    this.moneyText.setName("text-money");
    this.moneyText.setOrigin(1, 0.5);
    //this.fieldUI.add(this.moneyText);

    this.scoreText = rootContainer.findObject("#text-score");
    this.scoreText.setName("text-score");
    this.scoreText.setOrigin(1, 0.5);
    //this.fieldUI.add(this.scoreText);

    this.luckText = rootContainer.findObject("#text-luck");
    this.luckText.setName("text-luck");
    this.luckText.setOrigin(1, 0.5);
    this.luckText.setVisible(false);
    //this.fieldUI.add(this.luckText);

    this.luckLabelText = rootContainer.findObject("#text-luck-label");
    this.luckLabelText.setName("text-luck-label");
    this.luckLabelText.setOrigin(1, 0.5);
    this.luckLabelText.setVisible(false);
    this.luckLabelText.setText(i18next.t("common:luckIndicator"));
    //this.fieldUI.add(this.luckLabelText);

    this.arenaFlyout = new HTMLContainer(this) as any;
    this.fieldUI.add(this.arenaFlyout);
    this.fieldUI.moveBelow<Phaser.GameObjects.GameObject>(this.arenaFlyout, this.fieldOverlay);

    // this.updateUIPositions();

    this.damageNumberHandler = new DamageNumberHandler();

    this.spriteSparkleHandler = new PokemonSpriteSparkleHandler();
    this.spriteSparkleHandler.setup(this);

    this.pokemonInfoContainer = new HPokemonInfoContainer(this, (this.game.canvas.width / 6) + 52, -(this.game.canvas.height / 6) + 66) as any;
    this.pokemonInfoContainer.setup();

    this.fieldUI.add(this.pokemonInfoContainer);

    this.party = [];

    const loadPokemonAssets = [];

    this.arenaPlayer = new HArenaBase(this, true) as any;
    this.arenaPlayer.setName("arena-player");
    this.arenaPlayerTransition = new HArenaBase(this, true) as any;
    this.arenaPlayerTransition.setName("arena-player-transition");
    this.arenaEnemy = new HArenaBase(this, false) as any;
    this.arenaEnemy.setName("arena-enemy");
    this.arenaNextEnemy = new HArenaBase(this, false) as any;
    this.arenaNextEnemy.setName("arena-next-enemy");

    this.arenaBgTransition.setVisible(false);
    this.arenaPlayerTransition.setVisible(false);
    this.arenaNextEnemy.setVisible(false);

    [this.arenaPlayer, this.arenaPlayerTransition, this.arenaEnemy, this.arenaNextEnemy].forEach(a => {
      if (a instanceof Phaser.GameObjects.Sprite) {
        a.setOrigin(0, 0);
      }
      field.add(a);
    });

    const trainer = this.addFieldSprite(0, 0, `trainer_${this.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back`);
    trainer.setOrigin(0.5, 1);
    trainer.setName("sprite-trainer");

    field.add(trainer);

    this.trainer = trainer;

    this.reset(false, false, true);

    const ui = new HTMLUI(this);
    this.uiContainer.add(ui as any);
    this.children = this.uiContainer as any;

    this.ui = ui as any as UI;

    ui.setup();

    Promise.all([
      Promise.all(loadPokemonAssets),
      this.initStarterColors()
    ]).then(() => {
      this.pushPhase(new LoginPhase(this));
      this.pushPhase(new TitlePhase(this));

      this.shiftPhase();
    });

    //@ts-ignore
    this.i18n = i18next;

    this.damageNumbersMode = 0;

    this.damageNumberHandler = new HDamageNumberHandler(this);
  }
  async initExpSprites(): Promise<void>{
    return Promise.resolve();
  }
  async initVariantData(): Promise<void>{
    return Promise.resolve();
  }
  async initStarterColors(): Promise<void>{
    return Promise.resolve();
  }

  playSound(sound: string | AnySound, config?: object) {
    sound = "select";
    return getProxy(super.playSound(sound, config));
  }
  playSoundWithoutBgm(soundName: string, pauseDuration?: integer): AnySound {
    soundName = "select";
    return getProxy(super.playSoundWithoutBgm(soundName, pauseDuration));
  }
  playBgm(bgmName?: string, fadeOut?: boolean): void {
    return
  }
  cachedFetch(){
    return fetch(URL.createObjectURL(new Blob(["{}"])))
  }
}

export class HLoadingScene extends LoadingScene {
  preload(): void {
    this.loadSe("select");
    
    if (document.body.classList.contains("textOnly")) {
      this.lazyLoadResource = true;
    }
    this.load.bitmapFont = ()=>{
      return {} as any;
    };
    this.load.plugin = ()=>{
      return {} as any;
    };
    super.preload();
    this.loadSe("select");
  }
  loadLoadingScreen(){
    
  }
}