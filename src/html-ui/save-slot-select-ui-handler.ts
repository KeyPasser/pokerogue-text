import i18next from "i18next";
import BattleScene from "../battle-scene";
import { Button } from "#enums/buttons";
import { GameMode } from "../game-mode";
import { PokemonHeldItemModifier } from "../modifier/modifier";
import { SessionSaveData } from "../system/game-data";
import PokemonData from "../system/pokemon-data";
import * as Utils from "../utils";
import HUiHandler from "./PhaseUI/HUiHandler";
import { SaveSlotSelectCallback, SaveSlotUiMode } from "#app/ui/save-slot-select-ui-handler.js";
import TextBattleScene from "#app/html-ui/text-battle-scene";
import { HTMLContainer } from "./Root";
import { TextStyle } from "#app/ui/text.js";
import { Mode } from "./UI";
import './save-slot-select-ui-handler.scss'
import { ConfirmDialog } from './widgets/confirmDialog';
import * as modifiersModule from "../modifier/modifier";

const sessionSlotCount = 5;

export default class HSaveSlotSelectUiHandler extends HUiHandler {
  private dom: HTMLContainer = new HTMLContainer().addClass("session-slots-container");
  private sessionSlots: HTMLContainer;
  private sessionSlotDatas: SessionSlot[] = [];

  private uiMode: SaveSlotUiMode;
  private saveSlotSelectCallback: SaveSlotSelectCallback | null;

  constructor(scene: TextBattleScene) {
    super(scene);//, Mode.SAVE_SLOT
    this.sessionSlots = new HTMLContainer().addClass("session-slots");
    this.dom.add(this.sessionSlots);
  }

  setup() {
  }

  show(args: any[]): boolean {
    if ((args.length < 2 || !(args[1] instanceof Function))) {
      return false;
    }

    this.uiMode = args[0] as SaveSlotUiMode;
    this.saveSlotSelectCallback = args[1] as SaveSlotSelectCallback;

    this.populateSessionSlots();
    document.body.appendChild(this.dom.getDOM());

    return true;
  }

  getSlot(){

  }
  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;
    let error = false;

    if (button === Button.ACTION || button === Button.CANCEL) {
      const originalCallback = this.saveSlotSelectCallback;
      if (button === Button.ACTION) {
        const cursor = this.cursor;
        if (this.uiMode === SaveSlotUiMode.LOAD && !this.sessionSlotDatas[cursor].hasData) {
          error = true;
        } else {
          switch (this.uiMode) {
          case SaveSlotUiMode.LOAD:
            this.saveSlotSelectCallback = null;
            originalCallback && originalCallback(cursor);
            break;
          case SaveSlotUiMode.SAVE:
            const saveAndCallback = () => {
              const originalCallback = this.saveSlotSelectCallback;
              this.saveSlotSelectCallback = null;
              ui.revertMode();
              ui.showText("", 0);
              ui.setMode(Mode.MESSAGE);
              originalCallback && originalCallback(cursor);
            };
            if (this.sessionSlotDatas[cursor].hasData) {
              new ConfirmDialog( i18next.t("saveSlotSelectUiHandler:overwriteData"), () => {
                this.scene.gameData.deleteSession(cursor).then(response => {
                  if (response === false) {
                    this.scene.reset(true);
                  } else {
                    saveAndCallback();
                  }
                });
              }, () => {
                ui.revertMode();
                ui.showText("", 0);
              })
            } else if (this.sessionSlotDatas[cursor].hasData === false) {
              saveAndCallback();
            } else {
              return false;
            }
            break;
          }
          success = true;
        }
      } else {
        this.saveSlotSelectCallback = null;
        originalCallback && originalCallback(-1);
        success = true;
      }
    } 

    return success || error;
  }

  populateSessionSlots() {
    this.sessionSlots.removeAll();
    this.sessionSlotDatas = [];

    for (let s = 0; s < sessionSlotCount; s++) {
      const sessionSlot = new SessionSlot(this.scene, s);
      sessionSlot.load();
      sessionSlot.on("click", () => {
        this.setCursor(s);
        this.processInput(Button.ACTION);
      })
      this.sessionSlotDatas.push(sessionSlot);
      this.sessionSlots.add(sessionSlot);
    }
  }

  showText(text: string, delay?: integer, callback?: Function, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer) {
    this.scene.ui.showText(text, delay, callback, callbackDelay, prompt, promptDelay);
  }

  setCursor(cursor: integer): boolean {
    this.cursor = cursor;
    return true;
  }

  setScrollCursor(scrollCursor: integer): boolean {

    return true;
  }

  clear() {
    this.eraseCursor();
    this.saveSlotSelectCallback = null;
    this.clearSessionSlots();
  }

  eraseCursor() {
  }

  clearSessionSlots() {
    this.dom.destroy(false);
  }
}

const addTextObject = (scene: BattleScene, x: number, y: number, text: string, style: TextStyle, config?: any) => {
  return new HTMLContainer().setText(text).setColor(style).setPosition(x, y);
}
class SessionSlot extends HTMLContainer {
  public slotId: integer;
  public hasData: boolean;
  private loadingLabel: HTMLContainer;

  public scene: TextBattleScene;

  constructor(scene: TextBattleScene, slotId: integer) {
    super();
    this.scene = scene;
    this.setInnerHTML(
      `<div class="label">${i18next.t("saveSlotSelectUiHandler:loading")}</div>
      <div class="basic-info"></div>
      <div class="battle-info"></div>
      `
    )
    this.loadingLabel = this.findObject(".label");

    this.slotId = slotId;

    this.setup();
  }

  setup() {
    
  }

  async setupWithData(data: SessionSaveData) {
    this.loadingLabel.setText("");
    const basicInfo = this.findObject(".basic-info");
    const battleInfo = this.findObject(".battle-info");

    const gameModeLabel = addTextObject(this.scene, 8, 5, `${GameMode.getModeName(data.gameMode) || i18next.t("gameMode:unkown")} - ${i18next.t("saveSlotSelectUiHandler:wave")} ${data.waveIndex}`, TextStyle.WINDOW);
    basicInfo.add(gameModeLabel);

    const timestampLabel = addTextObject(this.scene, 8, 19, new Date(data.timestamp).toLocaleString(), TextStyle.WINDOW);
    basicInfo.add(timestampLabel);

    const playTimeLabel = addTextObject(this.scene, 8, 33, Utils.getPlayTimeString(data.playTime), TextStyle.WINDOW);
    basicInfo.add(playTimeLabel);

    const pokemonIconsContainer = new HTMLContainer();
    data.party.forEach((p: PokemonData, i: integer) => {
      const pokemon = p.toPokemon(this.scene);
      pokemon.name

      const text = addTextObject(this.scene, 32, 20, `${pokemon.name}<br/>${i18next.t("saveSlotSelectUiHandler:lv")}${Utils.formatLargeNumber(pokemon.level, 1000)}`, TextStyle.PARTY, { fontSize: "54px", color: "#f8f8f8" });

      //text.setShadow(0, 0, undefined);
      //text.setStroke("#424242", 14);

      pokemonIconsContainer.add(text);

      pokemon.destroy();
    });

    battleInfo.add(pokemonIconsContainer);

    const modifierIconsContainer = new HTMLContainer();
    modifierIconsContainer.setScale(0.5);
    let visibleModifierIndex = 0;
    for (const m of data.modifiers) {
      const modifier = m.toModifier(this.scene, modifiersModule[m.className]);
      if (modifier instanceof PokemonHeldItemModifier) {
        continue;
      }
      const icon = modifier?.type.name;
      if (icon) {
        modifierIconsContainer.add(
          addTextObject(this.scene, 0, 20, icon, TextStyle.PARTY, { fontSize: "54px", color: "#f8f8f8" })
        );
      }
      if (++visibleModifierIndex === 12) {
        break;
      }
    }

    battleInfo.add(modifierIconsContainer);
  }

  load(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this.scene.gameData.getSession(this.slotId).then(async sessionData => {
        if (!sessionData) {
          this.hasData = false;
          this.loadingLabel.setText(i18next.t("saveSlotSelectUiHandler:empty"));
          resolve(false);
          return;
        }
        this.hasData = true;
        await this.setupWithData(sessionData);
        resolve(true);
      });
    });
  }
}

interface SessionSlot {
  scene: TextBattleScene;
}
