import { Button } from "#enums/buttons";
import { MysteryEncounterPhase } from "../phases/mystery-encounter-phases";
import MysteryEncounterOption from "#app/data/mystery-encounters/mystery-encounter-option";
import { isNullOrUndefined } from "../utils";
import { getPokeballAtlasKey } from "../data/pokeball";
import { OptionSelectSettings } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { getEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import i18next from "i18next";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import HUiHandler from "./PhaseUI/HUiHandler";
import TextBattleScene from "#app/html-ui/text-battle-scene";
import HTMLContainer from "./Root";
import { getBBCodeFrag, TextStyle } from "#app/ui/text.js";
import "./mystery-encounter-ui-handler.scss"
import { Mode } from "./UI";
import { PartyUiMode } from "#app/ui/party-ui-handler.js";

export default class HMysteryEncounterUiHandler extends HUiHandler {
  private ui: HTMLContainer;

  private showDexProgress: boolean = false;

  private overrideSettings?: OptionSelectSettings;
  private encounterOptions: MysteryEncounterOption[] = [];
  private optionsMeetsReqs: boolean[];

  protected viewPartyIndex: number = 0;
  protected viewPartyXPosition: number = 0;

  protected blockInput: boolean = false;

  constructor(scene: TextBattleScene) {
    super(scene);
  }

  override setup() {
  }
  init(){
    if(!this.ui){
      this.ui = new HTMLContainer(this.scene)
      .setName(`mystery-encounter-ui`)
      .setInnerHTML(`
          <div id="mystery-encounter-description-container">
            <div id="mystery-encounter-title"></div>
            <div id="mystery-encounter-description"></div>
            <div id="mystery-encounter-query"></div>
            <div id="mystery-ball-type"></div>
          </div>
        <button id="view-party" class="mystery-encounter-option">${i18next.t("mysteryEncounterMessages:view_party_button")}</button>
          <div id="options-container">
          </div>
          <div id="mystery-encounter-tooltip"></div>
              `);
        this.ui.findObject("#view-party").on("click", () => {
          this.scene.ui.handlers[Mode.PARTY].show([
            PartyUiMode.CHECK, -1, () => {
              this.scene.ui.handlers[Mode.PARTY].clear();
            }
          ]);
        })
    }
  }
  override show(args: any[]): boolean {
    super.show(args);

    this.init()

    this.overrideSettings = args[0] as OptionSelectSettings ?? {};
    const showDescriptionContainer = isNullOrUndefined(this.overrideSettings?.hideDescription) ? true : !this.overrideSettings.hideDescription;
    const slideInDescription = isNullOrUndefined(this.overrideSettings?.slideInDescription) ? true : this.overrideSettings.slideInDescription;
    const startingCursorIndex = this.overrideSettings?.startingCursorIndex ?? 0;

    this.displayEncounterOptions(slideInDescription);
    const cursor = this.getCursor();
      this.setCursor(0);
    if (this.blockInput) {
      setTimeout(() => {
        this.unblockInput();
      }, 1000);
    }
    this.displayOptionTooltip();
    this.scene.textPlugin.showOptionDom(this.ui.getDOM())

    return true;
  }

  override processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    const cursor = this.getCursor();

    if (button === Button.CANCEL || button === Button.ACTION) {
      if (button === Button.ACTION) {
        const selected = this.encounterOptions[cursor];
        
          if ((this.scene.getCurrentPhase() as MysteryEncounterPhase).handleOptionSelect(selected, cursor)) {
            success = true;
          } else {
            ui.playError();
          }
      } else {
        // TODO: If we need to handle cancel option? Maybe default logic to leave/run from encounter idk
      }
    } else {
      // switch (this.optionsContainer.getAll()?.length) {
      // default:
      // case 3:
      //   success = this.handleTwoOptionMoveInput(button);
      //   break;
      // case 4:
      //   success = this.handleThreeOptionMoveInput(button);
      //   break;
      // case 5:
      //   success = this.handleFourOptionMoveInput(button);
      //   break;
      // }

      this.displayOptionTooltip();
    }

    if (success) {
      ui.playSelect();
    }

    return success;
  }

  private handleTwoOptionMoveInput(button: Button): boolean {
    let success = false;
    const cursor = this.getCursor();
    switch (button) {
    case Button.UP:
      if (cursor < this.viewPartyIndex) {
        success = this.setCursor(this.viewPartyIndex);
      }
      break;
    case Button.DOWN:
      if (cursor === this.viewPartyIndex) {
        success = this.setCursor(1);
      }
      break;
    case Button.LEFT:
      if (cursor > 0) {
        success = this.setCursor(cursor - 1);
      }
      break;
    case Button.RIGHT:
      if (cursor < this.viewPartyIndex) {
        success = this.setCursor(cursor + 1);
      }
      break;
    }

    return success;
  }

  private handleThreeOptionMoveInput(button: Button): boolean {
    let success = false;
    const cursor = this.getCursor();
    switch (button) {
    case Button.UP:
      if (cursor === 2) {
        success = this.setCursor(cursor - 2);
      } else {
        success = this.setCursor(this.viewPartyIndex);
      }
      break;
    case Button.DOWN:
      if (cursor === this.viewPartyIndex) {
        success = this.setCursor(1);
      } else {
        success = this.setCursor(2);
      }
      break;
    case Button.LEFT:
      if (cursor === this.viewPartyIndex) {
        success = this.setCursor(1);
      } else if (cursor === 1) {
        success = this.setCursor(cursor - 1);
      }
      break;
    case Button.RIGHT:
      if (cursor === 1) {
        success = this.setCursor(this.viewPartyIndex);
      } else if (cursor < 1) {
        success = this.setCursor(cursor + 1);
      }
      break;
    }

    return success;
  }

  private handleFourOptionMoveInput(button: Button): boolean {
    let success = false;
    const cursor = this.getCursor();
    switch (button) {
    case Button.UP:
      if (cursor >= 2 && cursor !== this.viewPartyIndex) {
        success = this.setCursor(cursor - 2);
      } else {
        success = this.setCursor(this.viewPartyIndex);
      }
      break;
    case Button.DOWN:
      if (cursor <= 1) {
        success = this.setCursor(cursor + 2);
      } else if (cursor === this.viewPartyIndex) {
        success = this.setCursor(1);
      }
      break;
    case Button.LEFT:
      if (cursor === this.viewPartyIndex) {
        success = this.setCursor(1);
      } else if (cursor % 2 === 1) {
        success = this.setCursor(cursor - 1);
      }
      break;
    case Button.RIGHT:
      if (cursor === 1) {
        success = this.setCursor(this.viewPartyIndex);
      } else if (cursor % 2 === 0 && cursor !== this.viewPartyIndex) {
        success = this.setCursor(cursor + 1);
      }
      break;
    }

    return success;
  }

  /**
   * When ME UI first displays, the option buttons will be disabled temporarily to prevent player accidentally clicking through hastily
   * This method is automatically called after a short delay but can also be called manually
   */
  unblockInput() {
  }

  getCursor(): number {
    return this.cursor ? this.cursor : 0;
  }

  setCursor(cursor: number): boolean {
    this.cursor = cursor;
    return true;
  }

  displayEncounterOptions(slideInDescription: boolean = true): void {
    const mysteryEncounter = this.scene.currentBattle.mysteryEncounter!;
    this.encounterOptions = this.overrideSettings?.overrideOptions ?? mysteryEncounter.options;
    this.optionsMeetsReqs = [];

    const titleText: string | null = getEncounterText(this.scene, mysteryEncounter.dialogue.encounterOptionsDialogue?.title, TextStyle.TOOLTIP_TITLE);
    const descriptionText: string | null = getEncounterText(this.scene, mysteryEncounter.dialogue.encounterOptionsDialogue?.description, TextStyle.TOOLTIP_CONTENT);
    const queryText: string | null = getEncounterText(this.scene, mysteryEncounter.dialogue.encounterOptionsDialogue?.query, TextStyle.TOOLTIP_CONTENT);

    const container = this.ui.findObject("#options-container").removeAll(true);
    // Options Window
    for (let i = 0; i < this.encounterOptions.length; i++) {
      const option = this.encounterOptions[i];

      let optionText = new HTMLContainer(document.createElement("button"))
      .on("click", () => {
        if(!this.optionsMeetsReqs[i] && (option.optionMode === MysteryEncounterOptionMode.DISABLED_OR_DEFAULT || option.optionMode === MysteryEncounterOptionMode.DISABLED_OR_SPECIAL)){
          return;
        }
        this.setCursor(i);
        this.processInput(Button.ACTION);
      })
     
      this.optionsMeetsReqs.push(option.meetsRequirements(this.scene));
      const optionDialogue = option.dialogue!;
      const label = !this.optionsMeetsReqs[i] && optionDialogue.disabledButtonLabel ? optionDialogue.disabledButtonLabel : optionDialogue.buttonLabel;
      let text: string | null;
      if (option.hasRequirements() && this.optionsMeetsReqs[i] && (option.optionMode === MysteryEncounterOptionMode.DEFAULT_OR_SPECIAL || option.optionMode === MysteryEncounterOptionMode.DISABLED_OR_SPECIAL)) {
        // Options with special requirements that are met are automatically colored green
        text = getEncounterText(this.scene, label, TextStyle.SUMMARY_GREEN);
      } else {
        text = getEncounterText(this.scene, label, optionDialogue.style ? optionDialogue.style : TextStyle.WINDOW);
      }

      if (text) {
        optionText.setBBCode(text);
      }

      if (!this.optionsMeetsReqs[i] && (option.optionMode === MysteryEncounterOptionMode.DISABLED_OR_DEFAULT || option.optionMode === MysteryEncounterOptionMode.DISABLED_OR_SPECIAL)) {
        optionText.disableEvent(true);
      }
      if (this.blockInput) {
        optionText.setAlpha(0.5);
      }

      // Animates the option text scrolling sideways
      // if (optionTextWidth > nonScrollWidth) {
      //   this.optionScrollTweens[i] = this.scene.tweens.add({
      //     targets: optionText,
      //     delay: Utils.fixedInt(2000),
      //     loop: -1,
      //     hold: Utils.fixedInt(2000),
      //     duration: Utils.fixedInt((optionTextWidth - nonScrollWidth) / 15 * 2000),
      //     x: `-=${(optionTextWidth - nonScrollWidth)}`
      //   });
      // }
      const tooltip = this.displayOptionTooltip(i);

      container.add(new HTMLContainer().add([optionText, tooltip]));
    }

    // Description Window
    this.ui.findObject("#mystery-encounter-title").removeAll().setBBCode(titleText ?? "");

    // Rarity of encounter
    const index = mysteryEncounter.encounterTier === MysteryEncounterTier.COMMON ? 0 :
      mysteryEncounter.encounterTier === MysteryEncounterTier.GREAT ? 1 :
        mysteryEncounter.encounterTier === MysteryEncounterTier.ULTRA ? 2 :
          mysteryEncounter.encounterTier === MysteryEncounterTier.ROGUE ? 3 : 4;
    const ballType = getPokeballAtlasKey(index);
    this.ui.findObject("#mystery-ball-type").removeAll().setBBCode(ballType);

    this.ui.findObject("#mystery-encounter-description").removeAll().setBBCode(descriptionText ?? "")
  }

  /**
   * Updates and displays the tooltip for a given option
   * The tooltip will auto wrap and scroll if it is too long
   */
  private displayOptionTooltip(cursor = this.getCursor()) {

    let text: string | null;
    const cursorOption = this.encounterOptions[cursor];
    const optionDialogue = cursorOption.dialogue!;
    if (!this.optionsMeetsReqs[cursor] && (cursorOption.optionMode === MysteryEncounterOptionMode.DISABLED_OR_DEFAULT || cursorOption.optionMode === MysteryEncounterOptionMode.DISABLED_OR_SPECIAL) && optionDialogue.disabledButtonTooltip) {
      text = getEncounterText(this.scene, optionDialogue.disabledButtonTooltip, TextStyle.TOOLTIP_CONTENT);
    } else {
      text = getEncounterText(this.scene, optionDialogue.buttonTooltip, TextStyle.TOOLTIP_CONTENT);
    }

    // Auto-color options green/blue for good/bad by looking for (+)/(-)
    if (text) {
      const primaryStyleString = [...text.match(new RegExp(/\[color=[^\[]*\]\[shadow=[^\[]*\]/i))!][0];
      text = text.replace(/(\(\+\)[^\(\[]*)/gi, substring => "[/color][/shadow]" + getBBCodeFrag(substring, TextStyle.SUMMARY_GREEN) + "[/color][/shadow]" + primaryStyleString);
      text = text.replace(/(\(\-\)[^\(\[]*)/gi, substring => "[/color][/shadow]" + getBBCodeFrag(substring, TextStyle.SUMMARY_BLUE) + "[/color][/shadow]" + primaryStyleString);
    }


    // Dex progress indicator
    if (cursorOption.hasDexProgress && !this.showDexProgress) {
      this.showHideDexProgress(true);
    } else if (!cursorOption.hasDexProgress) {
      this.showHideDexProgress(false);
    }
    return new HTMLContainer().setBBCode(text)
  }

  override clear(): void {
    super.clear();
    this.overrideSettings = undefined;
    this.getUi().getMessageHandler().clearText();
    this.eraseCursor();
  }

  private eraseCursor(): void {
  }

  /**
   * Will show or hide the Dex progress icon for an option that has dex progress
   * @param show - if true does show, if false does hide
   */
  private showHideDexProgress(show: boolean) {
  }
}
