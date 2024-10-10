import BattleScene from "../battle-scene";
import { getPlayerShopModifierTypeOptionsForWave, ModifierTypeOption, TmModifierType } from "../modifier/modifier-type";
import { getPokeballAtlasKey, PokeballType } from "../data/pokeball";
import { LockModifierTiersModifier, PokemonHeldItemModifier } from "../modifier/modifier";
import { handleTutorial, Tutorial } from "../tutorial";
import { Button } from "#enums/buttons";
import { allMoves } from "../data/move";
import * as Utils from "./../utils";
import Overrides from "#app/overrides";
import i18next from "i18next";
import HUiHandler from "./PhaseUI/HUiHandler";
import TextBattleScene from "#app/text-battle-scene.js";
import { getModifierTierTextTint, getTextColor, getTextStyleOptions, TextStyle } from "#app/ui/text.js";
import { HTMLContainer, HTMLDialog } from "./Root";
import './modifier-select-ui-handler.scss'
import { Mode } from "./UI";
import { Type } from "#app/data/type.js";
import TransferUI from "./transfer-ui";

export const SHOP_OPTIONS_ROW_LIMIT = 6;

export default class HModifierSelectUiHandler extends HUiHandler {
  private rerollCostText: HTMLContainer;
  private lockRarityButtonText: HTMLContainer;
  protected onActionInput: Function | null;
  // private moveInfoOverlay : MoveInfoOverlay;
  private moveInfoOverlayActive: boolean = false;

  private rowCursor: integer = 0;
  private player: boolean;
  private rerollCost: integer;

  public rewardOptions: HTMLContainer;
  public shops1Container: HTMLContainer;
  public shops2Container: HTMLContainer;
  public shopOptions: ModifierOption[] = []

  private cursorObj: Phaser.GameObjects.Image | null;

  private active: boolean = false;
  private dom: HTMLDialog;
  typeOptions: ModifierTypeOption[];
  transferUI: TransferUI;

  constructor(scene: TextBattleScene) {
    super(scene);//, Mode.CONFIRM
    this.dom = new HTMLDialog(
      () => {
        const ret = confirm(i18next.t("battle:skipItemQuestion"))
        if (ret) {
          this.scene.ui.revertMode();
          this.scene.ui.setMode(Mode.MESSAGE);

          this.scene.getCurrentPhase()?.end();
        }
      },
      scene.textPlugin.container,
    );
  }

  setup() {
  }
  init() {
    const dom = this.dom;
    dom.setName("modifier-select-ui-handler");
    dom.setInnerHTML(`
      <div class="shops">
        <div class="shops1">
        </div>
        <div class="shops2">
        </div>
      </div>
      <div class="modifierMsg"></div>
      <div class="rewards">
      </div>
      <div class="buttons">
        <div class="reroll-container">${i18next.t("modifierSelectUiHandler:reroll")} <span class="reroll">(${this.rerollCost})</span></div>
        <div>${i18next.t("modifierSelectUiHandler:transfer")}</div>
        <div>${i18next.t("modifierSelectUiHandler:checkTeam")}</div>
        <div class="lock">${i18next.t("modifierSelectUiHandler:lockRarities")}</div>
      </div>
      `)

    this.rerollCostText = dom.findObject(".reroll");
    this.lockRarityButtonText = dom.findObject(".lock");
    this.rewardOptions = dom.findObject(".rewards");
    this.shops1Container = dom.findObject(".shops1");
    this.shops2Container = dom.findObject(".shops2");

    this.shops1Container.on('click', e => {
      let target = e.target as HTMLElement;
      if (target.tagName === "SPAN") {
        target = target.parentElement as HTMLElement;
      }

      const index = Array.from(this.shops1Container.getDOM().children).indexOf(target);
      if(index == -1)return;

      this.setRowCursor(3);
      this.setCursor(index);
      this.processInput(Button.ACTION);
    })

    this.shops2Container.on('click', e => {
      let target = e.target as HTMLElement;
      if (target.tagName === "SPAN") {
        target = target.parentElement as HTMLElement;
      }
      const index = Array.from(this.shops2Container.getDOM().children).indexOf(target);
      if(index == -1)return;

      this.setRowCursor(2);
      this.setCursor(index);
      this.processInput(Button.ACTION);
    })

    this.rewardOptions.on('click', e => {
      let target = e.target as HTMLElement;
      if (target.tagName === "SPAN") {
        target = target.parentElement as HTMLElement;
      }

      const index = Array.from(this.rewardOptions.getDOM().children).indexOf(target);
      if(!this.typeOptions[index])return;

      if (target.classList.contains("selected")) {
        this.setRowCursor(1);
        this.setCursor(index);
        this.processInput(Button.ACTION);
      } else {
        this.rewardOptions.findAll(".selected").forEach(e => e.classList.remove("selected"));
        target.classList.add("selected");
        const item = this.getRowItems(1, index);
      }

    })

    dom.findObject(".buttons").on('click', e => {
      let target = e.target as HTMLElement;
      if (target.tagName === "SPAN") {
        target = target.parentElement as HTMLElement;
      }
      const index = Array.from(dom.findObject(".buttons").getDOM().children).indexOf(target);
      if(index == -1||index==4)return;
      if(index === 1){
        if(!this.transferUI){
          this.transferUI = new TransferUI(this.scene)
        }
        this.transferUI.show()
        return;
      }

      this.setRowCursor(0);
      this.setCursor(index);
      this.processInput(Button.ACTION);
    })
  }

  show(args: any[]): boolean {
    if (!this.rerollCostText) {
      this.init()
    }
    if (this.active) {
      if (args.length >= 3) {
        this.onActionInput = args[2];
      }
      // this.moveInfoOverlay.active = this.moveInfoOverlayActive;
      return false;
    }
    this.active = true;

    if (args.length !== 4 || !(args[1] instanceof Array) || !(args[2] instanceof Function)) {
      return false;
    }

    this.player = args[0];

    const partyHasHeldItem = this.player && !!this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier && m.isTransferable).length;
    const canLockRarities = !!this.scene.findModifier(m => m instanceof LockModifierTiersModifier);

    this.rerollCost = args[3] as integer;

    this.updateRerollCostText();

    const typeOptions = this.typeOptions = args[1] as ModifierTypeOption[];

    const shopTypeOptions = !this.scene.gameMode.hasNoShop
      ? getPlayerShopModifierTypeOptionsForWave(this.scene.currentBattle.waveIndex, this.scene.getWaveMoneyAmount(1))
      : [];

    this.rewardOptions.removeAll();
    if(typeOptions.length > 0){
      for (let m = 0; m < typeOptions.length; m++) {
        const option = new ModifierOption(this.scene, typeOptions[m]);

        this.rewardOptions.add(option);
      }
    }else{
      this.rewardOptions
        .add(new HTMLContainer().setText(i18next.t("modifierSelectUiHandler:continueNextWaveButton"))
        .on('click', () => {
          this.rowCursor = 1;
          this.cursor = 0;
          this.processInput(Button.ACTION)
        })
      );
    }

    for (let m = 0; m < shopTypeOptions.length; m++) {
      const option = new ModifierOption(this.scene, shopTypeOptions[m]);
      if (m < SHOP_OPTIONS_ROW_LIMIT) {
        this.shops1Container.add(option);
      } else {
        this.shops2Container.add(option);
      }
      this.shopOptions.push(option);
    }

    this.dom.findObject(".modifierMsg").removeAll();

    /* Force updateModifiers without pokemonSpecificModifiers */
    this.scene.getModifierBar().updateModifiers(this.scene.modifiers, true);

    /* Multiplies the appearance duration by the speed parameter so that it is always constant, and avoids "flashbangs" at game speed x5 */
    this.scene.showShopOverlay(750 * this.scene.gameSpeed);
    this.scene.updateAndShowText(750);
    this.scene.updateBiomeWaveText();
    this.scene.updateMoneyText();

    this.setCursor(0);
    this.setRowCursor(1);

    handleTutorial(this.scene, Tutorial.Select_Item).then(() => {
      this.setCursor(0);
      this.onActionInput = args[2];
    });

    this.dom.show();

    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    if (button === Button.ACTION) {
      success = true;
      if (this.onActionInput) {
        const originalOnActionInput = this.onActionInput;
        this.onActionInput = null;
        if (!originalOnActionInput(this.rowCursor, this.cursor)) {
          this.onActionInput = originalOnActionInput;
        } else {
        }
      }
    } else if (button === Button.CANCEL) {
      if (this.player) {
        success = true;
        if (this.onActionInput) {
          const originalOnActionInput = this.onActionInput;
          this.onActionInput = null;
          originalOnActionInput(-1);
        }
      }
    } else {
      switch (button) {
        case Button.UP:

          break;
        case Button.DOWN:

          break;
        case Button.LEFT:

          break;
        case Button.RIGHT:

          break;
      }
    }

    if (success) {
      ui.playSelect();
    }

    return success;
  }

  setCursor(cursor: integer): boolean {
    this.cursor = cursor;


    return true;
  }

  setRowCursor(rowCursor: integer): boolean {
    this.rowCursor = rowCursor;

    return false;
  }

  private getRowItems(rowCursor: integer, index = 0): integer {
    const option = this.typeOptions[index];

    if (option.type instanceof TmModifierType) {
      const move = allMoves[option.type.moveId];

      const moveLabel = i18next.t("pokemonSummary:powerAccuracyCategory") as string;
      const moveLabelArray = moveLabel.split("\n");

      this.dom.findObject(".modifierMsg").setInnerHTML(`
        <div id="move0">
                    <div class="type">${i18next.t(`pokemonInfo:Type.${Type[move.type]}`)}</div>
                    <div class="name">${move.name}</div>
                    <div>
                      <span>pp</span>
                      <span class="pp">${move.pp}</span>
                    </div>
                    <div id="description">${move.effect}</div>
                    <div id="details">
                        <div id="power">
                            <span>${moveLabelArray[0]}</span>
                            <span>${move.power}</span>
                        </div>
                        <div id="accuracy">
                            <span>${moveLabelArray[1]}</span>
                            <span>${move.accuracy}</span>
                        </div>
                        <div id="category">
                            <span>${moveLabelArray[2]}</span>
                            <span>${move.category}</span>
                        </div>
                     </div>
                </div>
                `);
    } else {

      this.dom.findObject(".modifierMsg").removeAll().setText(option.type?.getDescription(this.scene));
    }

    return 0;
  }

  setRerollCost(rerollCost: integer): void {
    this.rerollCost = rerollCost;
  }

  updateCostText(): void {
    for (const shopOption of this.shopOptions) {
      shopOption.updateCostText();
    }

    this.updateRerollCostText();
  }

  updateRerollCostText(): void {
    if(this.rerollCost == -1){
      return this.dom.findObject(".reroll-container").setAlpha(0);
    }
    this.dom.findObject(".reroll-container").setAlpha(1);

    const canReroll = this.scene.money >= this.rerollCost;

    const formattedMoney = Utils.formatMoney(this.scene.moneyFormat, this.rerollCost);

    this.rerollCostText.setText(i18next.t("modifierSelectUiHandler:rerollCost", { formattedMoney }));
    this.rerollCostText.setColor(getTextColor(canReroll ? TextStyle.MONEY : TextStyle.PARTY_RED));
    this.rerollCostText.setShadowColor(getTextColor(canReroll ? TextStyle.MONEY : TextStyle.PARTY_RED, true));
  }

  updateLockRaritiesText(): void {
    const textStyle = this.scene.lockModifierTiers ? TextStyle.SUMMARY_BLUE : TextStyle.PARTY;
    this.lockRarityButtonText.setColor(getTextColor(textStyle));
    this.lockRarityButtonText.setShadowColor(getTextColor(textStyle, true));
  }

  clear() {

    this.moveInfoOverlayActive = false;
    this.onActionInput = null;

    this.eraseCursor();
    this.active = false;

    /* Multiplies the fade time duration by the speed parameter so that it is always constant, and avoids "flashbangs" at game speed x5 */
    this.scene.hideShopOverlay(750 * this.scene.gameSpeed);
    this.scene.hideLuckText(250);

    /* Normally already called just after the shop, but not sure if it happens in 100% of cases */
    this.scene.getModifierBar().updateModifiers(this.scene.modifiers);

    this.rewardOptions.removeAll();
    this.shops1Container.removeAll();
    this.shops2Container.removeAll();

    this.dom.hide();
  }

  eraseCursor() {
    if (this.cursorObj) {
      this.cursorObj.destroy();
    }
    this.cursorObj = null;
  }
}

class ModifierOption extends HTMLContainer {
  public modifierTypeOption: ModifierTypeOption;
  private pb: Phaser.GameObjects.Sprite;
  private pbTint: Phaser.GameObjects.Sprite;
  private itemContainer: Phaser.GameObjects.Container;
  private item: Phaser.GameObjects.Sprite;
  private itemTint: Phaser.GameObjects.Sprite;
  private itemText: HTMLContainer;
  private itemCostText: HTMLContainer;

  constructor(scene: TextBattleScene, modifierTypeOption: ModifierTypeOption, dom?: HTMLElement) {
    // if (modifierTypeOption.cost) {
    //   dom = document.createElement('option');
    // }
    super(dom);

    this.scene = scene;
    this.modifierTypeOption = modifierTypeOption;

    this.setup();
  }

  setup() {

    if (this.modifierTypeOption.cost) {
      this.setInnerHTML(`
          <span class="modifier"></span>
          <span class="cost"></span>
      `)
    } else

      this.setInnerHTML(`
        <span class="modifier"></span>
        <span class="cost"></span>
      `)

    const costText = this.findObject(".cost");

    const color = this.modifierTypeOption.type?.tier ? '#' + getModifierTierTextTint(this.modifierTypeOption.type?.tier).toString(16) : undefined;
    this.itemText = this.findObject(".modifier").setText(this.modifierTypeOption.type?.name!).setColor(color);

    if (this.modifierTypeOption.cost) {
      costText.setVisible(true)
      this.itemCostText = costText;
      costText.setColor(TextStyle.MONEY);

      this.updateCostText();
    } else {
      costText.setVisible(false)
    }
  }

  show() {

  }

  getPbAtlasKey(tierOffset: integer = 0) {
    return getPokeballAtlasKey((this.modifierTypeOption.type?.tier! + tierOffset) as integer as PokeballType); // TODO: is this bang correct?
  }

  updateCostText(): void {
    const scene = this.scene;
    const cost = Overrides.WAIVE_ROLL_FEE_OVERRIDE ? 0 : this.modifierTypeOption.cost;
    const textStyle = cost <= scene.money ? TextStyle.MONEY : TextStyle.PARTY_RED;

    const formattedMoney = Utils.formatMoney(scene.moneyFormat, cost);

    this.itemCostText.setText(i18next.t("modifierSelectUiHandler:itemCost", { formattedMoney }));
    this.itemCostText.setColor(getTextColor(textStyle, false, scene.uiTheme));
    this.itemCostText.setShadowColor(getTextColor(textStyle, true, scene.uiTheme));
  }
}
