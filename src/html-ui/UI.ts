import { default as BattleScene } from "../battle-scene";
import UiHandler from "../ui/ui-handler";
import BattleMessageUiHandler from "../ui/battle-message-ui-handler";
import MessageUiHandler from "../ui/message-ui-handler";
import SettingsUiHandler from "../ui/settings/settings-ui-handler";
import GameChallengesUiHandler from "../ui/challenges-select-ui-handler";
import AchvBar from "../ui/achv-bar";
import OptionSelectUiHandler from "../ui/settings/option-select-ui-handler";
import EggHatchSceneHandler from "../ui/egg-hatch-scene-handler";
import VouchersUiHandler from "../ui/vouchers-ui-handler";
import LoginFormUiHandler from "../ui/login-form-ui-handler";
import RegistrationFormUiHandler from "../ui/registration-form-ui-handler";
import LoadingModalUiHandler from "../ui/loading-modal-ui-handler";
import * as Utils from "../utils";
import GameStatsUiHandler from "../ui/game-stats-ui-handler";
import AwaitableUiHandler from "../ui/awaitable-ui-handler";
import SavingIconHandler from "../ui/saving-icon-handler";
import UnavailableModalUiHandler from "../ui/unavailable-modal-ui-handler";
import OutdatedModalUiHandler from "../ui/outdated-modal-ui-handler";
import SessionReloadModalUiHandler from "../ui/session-reload-modal-ui-handler";
import { Button } from "#enums/buttons";
import i18next, { ParseKeys } from "i18next";
import SettingsDisplayUiHandler from "../ui/settings/settings-display-ui-handler";
import SettingsAudioUiHandler from "../ui/settings/settings-audio-ui-handler";
import { PlayerGender } from "#enums/player-gender";
import HTargetSelectUi from "./PhaseUI/target-select";
import TextBattleScene from "#app/text-battle-scene.js";
import HTitleUiHandler from "./PhaseUI/title-ui";
import HCommandUiHandler from "./PhaseUI/command-ui";
import HFightUiHandler from "./PhaseUI/fight-ui";
import HBallUiHandler from "./PhaseUI/ball-ui";
import HUiHandler from "./PhaseUI/HUiHandler";
import HEvolutionSceneHandler from "./PhaseUI/evolution-scene-ui";
import HMenuUiHandler from "./menu-ui-handler";
import HAchvsUiHandler from "./achvs-ui-handle";
import HEggGachaUiHandler from "./egg-gacha-ui-handler";
import HEggListUiHandler from "./egg-list-ui-handler";
import HSummaryUiHandler from "./summary-ui-handler";
import HPartyUiHandler from "./party-ui-handler";
import HModifierSelectUiHandler from "./modifier-select-ui-handler";
import HStarterSelectUiHandler from "./starter-select-ui-handler";
import HSaveSlotSelectUiHandler from "./save-slot-select-ui-handler";
import HConfirmUiHandler from "./confirm-ui-handler";
import { HTMLContainer, HTMLDialog } from "./Root";
import HSettingsUiHandler from "./settings-ui-handler";
import HOptionSelectUiHandler from "./abstact-option-select-ui-handler";
import { Voucher } from "#app/system/voucher.js";
import HGameChallengesUiHandler from "./challenges-select-ui-handler";
import HVouchersUiHandler from "./vouchers-ui-handler";
import HGameStatsUiHandler from "./game-stats-ui-handler";
import { Achv, getAchievementDescription } from "#app/system/achv.js";
import "./iconfont/iconfont.css";
import "./iconfont/addition.css";
import HBattleMessageUiHandler from "./battle-message-ui-handler";
import { Device } from "#app/enums/devices.js";
import HMysteryEncounterUiHandler from "./mystery-encounter-ui-handler";

export enum Mode {
  MESSAGE,
  TITLE,
  COMMAND,
  FIGHT,
  BALL,
  TARGET_SELECT,
  MODIFIER_SELECT,
  SAVE_SLOT,
  PARTY,
  SUMMARY,
  STARTER_SELECT,
  EVOLUTION_SCENE,
  EGG_HATCH_SCENE,
  EGG_HATCH_SUMMARY,
  CONFIRM,
  OPTION_SELECT,
  MENU,
  MENU_OPTION_SELECT,
  SETTINGS,
  SETTINGS_DISPLAY,
  SETTINGS_AUDIO,
  SETTINGS_GAMEPAD,
  GAMEPAD_BINDING,
  SETTINGS_KEYBOARD,
  KEYBOARD_BINDING,
  ACHIEVEMENTS,
  GAME_STATS,
  EGG_LIST,
  EGG_GACHA,
  LOGIN_FORM,
  REGISTRATION_FORM,
  LOADING,
  SESSION_RELOAD,
  UNAVAILABLE,
  OUTDATED,
  CHALLENGE_SELECT,
  RENAME_POKEMON,
  RUN_HISTORY,
  RUN_INFO,
  TEST_DIALOGUE,
  AUTO_COMPLETE,
  ADMIN,
  MYSTERY_ENCOUNTER
}

const transitionModes = [
  Mode.SAVE_SLOT,
  Mode.PARTY,
  Mode.SUMMARY,
  Mode.STARTER_SELECT,
  Mode.EVOLUTION_SCENE,
  Mode.EGG_HATCH_SCENE,
  Mode.EGG_LIST,
  Mode.EGG_GACHA,
  Mode.CHALLENGE_SELECT,
  Mode.RUN_HISTORY,
];

const noTransitionModes = [
  Mode.TITLE,
  Mode.CONFIRM,
  Mode.OPTION_SELECT,
  Mode.MENU,
  Mode.MENU_OPTION_SELECT,
  Mode.GAMEPAD_BINDING,
  Mode.KEYBOARD_BINDING,
  Mode.SETTINGS,
  Mode.SETTINGS_AUDIO,
  Mode.SETTINGS_DISPLAY,
  Mode.SETTINGS_GAMEPAD,
  Mode.SETTINGS_KEYBOARD,
  Mode.ACHIEVEMENTS,
  Mode.GAME_STATS,
  Mode.LOGIN_FORM,
  Mode.REGISTRATION_FORM,
  Mode.LOADING,
  Mode.SESSION_RELOAD,
  Mode.UNAVAILABLE,
  Mode.OUTDATED,
  Mode.RENAME_POKEMON,
  Mode.TEST_DIALOGUE,
  Mode.AUTO_COMPLETE,
  Mode.ADMIN,
  Mode.MYSTERY_ENCOUNTER,
  Mode.RUN_INFO
];

class HKeyboardBindingUiHandler extends HUiHandler {
  updateChosenKeyboardDisplay(){

  }
}

export class HBgmBar extends HTMLContainer {
  scene:TextBattleScene;
  constructor(scene: TextBattleScene) {
    super();
    this.scene = scene;
  }

  setup(): void {
    document.body.append(this.dom);
  }

  /*
    * Set the BGM Name to the BGM bar.
    * @param {string} bgmName The name of the BGM to set.
   */
  setBgmToBgmBar(bgmName: string): void {
    this.setText(`${i18next.t("bgmName:music")}${this.getRealBgmName(bgmName)}`)
  }

  /*
    Show or hide the BGM bar.
    @param {boolean} visible Whether to show or hide the BGM bar.
   */
  public toggleBgmBar(visible: boolean): void {
    /*
      Prevents the bar from being displayed if musicText is completely empty.
      This can be the case, for example, when the game's 1st music track takes a long time to reach the client,
      and the menu is opened before it is played.
    */
    if (this.dom.textContent === "") {
      this.setVisible(false);
      return;
    }

    if (!(this.scene as BattleScene).showBgmBar) {
      this.setVisible(false);
      return;
    }
  }

  getRealBgmName(bgmName: string): string {
    return i18next.t([`bgmName:${bgmName}`, "bgmName:missing_entries"], {name: Utils.formatText(bgmName)});
  }
}

class HAchvBar extends HTMLContainer{
  scene:TextBattleScene;
  constructor(scene:TextBattleScene){
    super()
    this.scene = scene;
    this.setName('achv-bar');
  }
  showAchv(achv:Voucher|Achv){
    const title = achv.getName(this.scene.gameData.gender);

    let description;
    if (achv instanceof Achv) { 
      description = getAchievementDescription((achv as Achv).localizationKey);
    } else if (achv instanceof Voucher) {
      description = (achv as Voucher).description
    }

    if (achv instanceof Achv) {
      description+=` +${(achv as Achv).score}pt`;
    }
    this.setInnerHTML(`
        <div >${i18next.t("filterBar:unlocksFilter")}</div>
        <div>
          <div class="title">${title}</div>
          <div class="description">${description}</div>
        </div>
      `)

    this.scene.textPlugin.showOptionDom(this.dom);
  }
}

export default class UI extends HTMLContainer {
  private mode: Mode;
  private modeChain: Mode[];
  public handlers: Array<UiHandler|HUiHandler>;
  public achvBar: HAchvBar;
  public bgmBar: HBgmBar;
  public savingIcon: SavingIconHandler;
  protected tooltipDom:HTMLDivElement;
  scene: TextBattleScene

  constructor(scene: TextBattleScene) {
    super();
    this.scene = scene;

    this.mode = Mode.MESSAGE;
    this.modeChain = [];

    const settings = new HSettingsUiHandler(scene);
    this.handlers = [
      new HBattleMessageUiHandler(scene),
      
      new HTitleUiHandler(scene) as any,
      new HCommandUiHandler(scene),
      new HFightUiHandler(scene),
      new HBallUiHandler(scene),
      new HTargetSelectUi(scene),
      new HModifierSelectUiHandler(scene),
      new HSaveSlotSelectUiHandler(scene),
      new HPartyUiHandler(scene),
      new HSummaryUiHandler(scene),

      new HStarterSelectUiHandler(scene),
      new HEvolutionSceneHandler(scene),
      new EggHatchSceneHandler(scene),
      new HUiHandler(scene),
      new HConfirmUiHandler(scene),
      new HOptionSelectUiHandler(scene),
      new HMenuUiHandler(scene),
      new HOptionSelectUiHandler(scene, Mode.MENU_OPTION_SELECT),
      
      // settings
      settings,
      settings,
      settings,

      new HUiHandler(scene),
      new HUiHandler(scene),
      new HKeyboardBindingUiHandler(scene),
      new HUiHandler(scene),
      new HAchvsUiHandler(scene),

      new HGameStatsUiHandler(scene),
      
      new HEggListUiHandler(scene),
      new HEggGachaUiHandler(scene),

      new LoginFormUiHandler(scene),
      new RegistrationFormUiHandler(scene),
      new LoadingModalUiHandler(scene),

      new SessionReloadModalUiHandler(scene),
      new UnavailableModalUiHandler(scene),
      new OutdatedModalUiHandler(scene),
      
      new HGameChallengesUiHandler(scene),
      new HUiHandler(scene),//RenameFormUiHandler
      new HUiHandler(scene),//RunHistoryUiHandler(scene),
      new HUiHandler(scene),//RunInfoUiHandler(scene),
      new HUiHandler(scene),//test， Mode.TEST_DIALOGUE
      new HUiHandler(scene),//AutoCompleteUiHandler(scene),
      new HUiHandler(scene),//AdminUiHandler(scene),
      new HMysteryEncounterUiHandler(scene),
    ];
  }

  setup(): void {
    this.setName(`ui-${Mode[this.mode]}`);
    for (const handler of this.handlers) {
      handler.setup();
    }

    this.achvBar = new HAchvBar(this.scene);
    // this.achvBar.setup();

    (this.scene as BattleScene).uiContainer.add(this.achvBar as any);

    this.savingIcon = new HUiHandler(this.scene) as any;//new SavingIconHandler(this.scene as BattleScene);
    this.savingIcon.setup();

    (this.scene as BattleScene).uiContainer.add(this.savingIcon);
  }
  private setupTooltip() {
  }

  getHandler<H extends UiHandler = UiHandler>(): H {
    return this.handlers[this.mode] as H;
  }

  getMessageHandler(): BattleMessageUiHandler {
    return this.handlers[Mode.MESSAGE] as BattleMessageUiHandler;
  }

  processInfoButton(pressed: boolean) {
    const battleScene = this.scene as BattleScene;
    if ([Mode.CONFIRM, Mode.COMMAND, Mode.FIGHT, Mode.MESSAGE].includes(this.mode)) {
      battleScene?.processInfoButton(pressed);
      return true;
    }
    battleScene?.processInfoButton(false);
    return true;
  }

  processInput(button: Button): boolean {
    const handler = this.getHandler();

    if (handler instanceof AwaitableUiHandler && handler.tutorialActive) {
      return handler.processTutorialInput(button);
    }

    return handler.processInput(button);
  }

  showTextPromise(text: string, callbackDelay: number = 0, prompt: boolean = true, promptDelay?: integer | null): Promise<void> {
    return new Promise<void>(resolve => {
      this.showText(text ?? "", null, () => resolve(), callbackDelay, prompt, promptDelay);
    });
  }

  showText(text: string, delay?: integer | null, callback?: Function | null, callbackDelay?: integer | null, prompt?: boolean | null, promptDelay?: integer | null): void {
    (this.scene as TextBattleScene).textPlugin.showMsg(text);
    setTimeout(() => {
      callback&&callback()
    }, delay||300);
  }

  showDialogue(text: string, name: string | undefined, delay: integer | null = 0, callback: Function, callbackDelay?: integer, promptDelay?: integer): void {
    // Add the prefix to the text
    const localizationKey: string = text;

    // Get localized dialogue (if available)
    let hasi18n = false;
    if (i18next.exists(localizationKey) ) {
      const genderIndex = this.scene.gameData.gender ?? PlayerGender.MALE;
      const genderStr = PlayerGender[genderIndex].toLowerCase();
      text = i18next.t(localizationKey as ParseKeys, { context: genderStr });
      hasi18n = true;

      // Skip dialogue if the player has enabled the option and the dialogue has been already seen
      if ((this.scene as BattleScene).skipSeenDialogues && (this.scene as BattleScene).gameData.getSeenDialogues()[localizationKey] === true) {
        console.log(`Dialogue ${localizationKey} skipped`);
        callback();
        return;
      }
    }
    let showMessageAndCallback = () => {
      hasi18n && (this.scene as BattleScene).gameData.saveSeenDialogue(localizationKey);
      callback();
    };
    if (text.indexOf("$") > -1) {
      const messagePages = text.split(/\$/g).map(m => m.trim());
      for (let p = messagePages.length - 1; p >= 0; p--) {
        const originalFunc = showMessageAndCallback;
        showMessageAndCallback = () => this.showDialogue(messagePages[p], name, null, originalFunc);
      }
      showMessageAndCallback();
    } else {
      
    this.scene.textPlugin.showOptionDom(new HTMLContainer()
    .setInnerHTML(`<div class="dialog">
      ${name}:${text}⬇️
      </div>`).on('click',showMessageAndCallback).getDOM());
      
    }
  }

  shouldSkipDialogue(text): boolean {
    const key = text;

    if (i18next.exists(key) ) {
      if ((this.scene as BattleScene).skipSeenDialogues && (this.scene as BattleScene).gameData.getSeenDialogues()[key] === true) {
        return true;
      }
    }
    return false;
  }

  getTooltip(): { visible: boolean; title: string; content: string } {
    return { visible: false, title: "", content: "" };
  }
  showTooltip(title: string, content: string, overlap?: boolean): void {
    if(!this.tooltipDom){
      const dom = this.tooltipDom = document.createElement('div')
      dom.classList.add('tooptip')
      dom.innerHTML = "<div class='title'></div><div class='content'></div>"
    }
    
    let dom = this.tooltipDom.querySelector('.title') as HTMLDivElement;
    dom.textContent = title;
    dom = this.tooltipDom.querySelector('.content') as HTMLDivElement
    dom.textContent = content;

    this.scene.textPlugin.showOptionDom(dom);
    setTimeout(() => {
        this.tooltipDom.style.display = 'none'
    }, 2000);
  }
  editTooltip(title: string, content: string): void {
  //   this.tooltipTitle.setText(title || "");
  //   const wrappedContent = this.tooltipContent.runWordWrap(content);
  //   this.tooltipContent.setText(wrappedContent);
  //   this.tooltipContent.y = title ? 16 : 4;
  //   this.tooltipBg.width = Math.min(Math.max(this.tooltipTitle.displayWidth, this.tooltipContent.displayWidth) + 12, 838);
  //   this.tooltipBg.height = (title ? 31 : 19) + 10.5 * (wrappedContent.split("\n").length - 1);
  }

  hideTooltip(): void {
  }

  update(): void {
  }

  clearText(): void {
    const handler = this.getHandler();
    if (handler instanceof MessageUiHandler) {
      (handler as MessageUiHandler).clearText();
    } else {
      this.getMessageHandler().clearText();
    }
  }

  setCursor(cursor: integer): boolean {
    const changed = this.getHandler().setCursor(cursor);
    if (changed) {
      this.playSelect();
    }

    return changed;
  }

  playSelect(): void {
    (this.scene as BattleScene).playSound("select");
  }

  playError(): void {
    (this.scene as BattleScene).playSound("error");
  }

  fadeOut(duration: integer): Promise<void> {
    return new Promise(resolve => {
      resolve()
    });
  }

  fadeIn(duration: integer): Promise<void> {
    return new Promise(resolve => {
      resolve()
    });
  }

  private setModeInternal(mode: Mode, clear: boolean, forceTransition: boolean, chainMode: boolean, args: any[]): Promise<void> {
    return new Promise(resolve => {
      if (this.mode === mode && !forceTransition) {
        resolve();
        return;
      }
      const doSetMode = () => {
        if (this.mode !== mode) {
          if (clear) {
            this.getHandler().clear();
          }
          if (chainMode && this.mode && !clear) {
            this.modeChain.push(this.mode);
            (this.scene as BattleScene).updateGameInfo();
          }
          this.mode = mode;
          const touchControls = document?.getElementById("touchControls");
          if (touchControls) {
            touchControls.dataset.uiMode = Mode[mode];
          }
          this.getHandler().show(args);
        }
        resolve();
      };
      if (((!chainMode && ((transitionModes.indexOf(this.mode) > -1 || transitionModes.indexOf(mode) > -1)
        && (noTransitionModes.indexOf(this.mode) === -1 && noTransitionModes.indexOf(mode) === -1)))
        || (chainMode && noTransitionModes.indexOf(mode) === -1))) {
        this.fadeOut(250).then(() => {
          this.scene.time.delayedCall(100, () => {
            doSetMode();
            this.fadeIn(250);
          });
        });
      } else {
        doSetMode();
      }
    });
  }

  getMode(): Mode {
    return this.mode;
  }

  setMode(mode: Mode, ...args: any[]): Promise<void> {
    return this.setModeInternal(mode, true, false, false, args);
  }

  setModeForceTransition(mode: Mode, ...args: any[]): Promise<void> {
    return this.setModeInternal(mode, true, true, false, args);
  }

  setModeWithoutClear(mode: Mode, ...args: any[]): Promise<void> {
    return this.setModeInternal(mode, false, false, false, args);
  }

  setOverlayMode(mode: Mode, ...args: any[]): Promise<void> {
    return this.setModeInternal(mode, false, false, true, args);
  }

  resetModeChain(): void {
    this.modeChain = [];
    (this.scene as BattleScene).updateGameInfo();
  }

  revertMode(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      if (!this?.modeChain?.length) {
        return resolve(false);
      }

      const lastMode = this.mode;

      const doRevertMode = () => {
        this.getHandler().clear();
        this.mode = this.modeChain.pop()!; // TODO: is this bang correct?
        (this.scene as BattleScene).updateGameInfo();
        const touchControls = document.getElementById("touchControls");
        if (touchControls) {
          touchControls.dataset.uiMode = Mode[this.mode];
        }
        resolve(true);
      };

      if (noTransitionModes.indexOf(lastMode) === -1) {
        this.fadeOut(250).then(() => {
          this.scene.time.delayedCall(100, () => {
            doRevertMode();
            this.fadeIn(250);
          });
        });
      } else {
        doRevertMode();
      }
    });
  }

  revertModes(): Promise<void> {
    return new Promise<void>(resolve => {
      if (!this?.modeChain?.length) {
        return resolve();
      }
      this.revertMode().then(success => Utils.executeIf(success, this.revertModes).then(() => resolve()));
    });
  }

  public getModeChain(): Mode[] {
    return this.modeChain;
  }

  /**
   * getGamepadType - returns the type of gamepad being used
   * inputMethod could be "keyboard" or "touch" or "gamepad"
   * if inputMethod is "keyboard" or "touch", then the inputMethod is returned
   * if inputMethod is "gamepad", then the gamepad type is returned it could be "xbox" or "dualshock"
   * @returns gamepad type
   */
  public getGamepadType(): string {
    const scene = this.scene as BattleScene;
    if (scene.inputMethod === "gamepad") {
      return scene.inputController.getConfig(scene.inputController.selectedDevice[Device.GAMEPAD]).padType;
    } else {
      return scene.inputMethod;
    }
  }
}
