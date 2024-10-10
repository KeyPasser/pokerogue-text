import {Button} from "#enums/buttons";
import i18next from "i18next";
import { Challenge } from "#app/data/challenge.js";
import * as Utils from "../utils";
import { Challenges } from "#app/enums/challenges.js";
import HUiHandler from "./PhaseUI/HUiHandler";
import TextBattleScene from "#app/text-battle-scene.js";
import { Mode } from "./UI";
import HTMLContainer, { HTMLDialog } from "./Root";
import "./challenges-select-ui-handler.scss"
import { TitlePhase } from "#app/phases/title-phase.js";
import { SelectStarterPhase } from "#app/phases/select-starter-phase.js";

/**
 * Handles all the UI for choosing optional challenges.
 */
export default class HGameChallengesUiHandler extends HUiHandler {
  ui:HTMLDialog;

  constructor(scene: TextBattleScene, mode: Mode | null = null) {
    super(scene);
  }

  setup() {

  }

  /**
   * Adds the default text color to the description text
   * @param text text to set to the BBCode description
   */
  setDescription(text: string): void {
    //this.descriptionText.setText(`[color=${Color.ORANGE}][shadow=${ShadowColor.ORANGE}]${text}`);
  }

  /**
   * initLabels
   * init all challenge labels
   */
  initLabels(): void {
    
  }

  /**
   * update the text the cursor is on
   */
  updateText(): void {
    
  }

  init(){
    if (this.ui) {
      return;
    }
    this.ui = new HTMLDialog(()=>{
      this.scene.clearPhaseQueue();
      this.scene.pushPhase(new TitlePhase(this.scene));
      this.scene.getCurrentPhase()?.end();

    }).setName("challenge-ui")
    .setTitle(i18next.t("challenges:title"))
    .setInnerHTML(`
        <label class="gen">
          <span>${i18next.t("challenges:singleGeneration.name")}</span>
          <select class="gen-selector">
          <option value="0">${i18next.t(`filterBar:all`)}</option>
          ${
            [
              "1",
              "2",
              "3",
              "4",
              "5",
              "6",
              "7",
              "8",
              "9",
            ].map(key=>{
              return `<option value="${key}">${i18next.t(`challenges:singleGeneration.gen_${key}`)}</option>`
            }).join("")
          }</select>
          </label>
        <label class="type">
          <span>${i18next.t("challenges:singleType.name")}</span>
          <select class="type-selector">
          <option value="0">${i18next.t(`filterBar:all`)}</option>
          ${
            [ 
              "NORMAL",
              "FIGHTING",
              "FLYING",
              "POISON",
              "GROUND",
              "ROCK",
              "BUG",
              "GHOST",
              "STEEL",
              "FIRE",
              "WATER",
              "GRASS",
              "ELECTRIC",
              "PSYCHIC",
              "ICE",
              "DRAGON",
              "DARK",
              "FAIRY",].map((t, i) => `<option value="${i+1}">${i18next.t(`pokemonInfo:Type.${t}`)}</option>`).join("")
          }
          </select>
        </label>
        <label class="first-try">
          <span>${i18next.t("challenges:freshStart.name")}</span>
          <select class="first-try-selector">
            <option value="0">${i18next.t("challenges:freshStart.value.0")}</option>
            <option value="1">${i18next.t("challenges:freshStart.value.1")}</option>
          </select>
        </label>
        
        <label class="start">
          <button class="start-button">${i18next.t("start")}</button>
        </label>
      `);
      this.ui.findObject("button.start-button").on("click",()=>{
        const challenges = this.scene.gameMode.challenges;

        const gen = (this.ui.find("select.gen-selector") as HTMLSelectElement).value;
        const type = (this.ui.find("select.type-selector") as HTMLSelectElement).value;
        const firstTry = (this.ui.find("select.first-try-selector") as HTMLSelectElement).value;

        challenges[0].value = +gen;
        challenges[1].value = +type;
        challenges[2].value = +firstTry;

        const totalDifficulty = this.scene.gameMode.challenges.reduce((v, c) => v + c.getDifficulty(), 0);
        const totalMinDifficulty = this.scene.gameMode.challenges.reduce((v, c) => v + c.getMinDifficulty(), 0);
        if (totalDifficulty >= totalMinDifficulty) {
          this.scene.unshiftPhase(new SelectStarterPhase(this.scene));
          this.scene.getCurrentPhase()?.end();
        }
      })
   
    this.setup();
  }
  show(args: any[]): boolean {
    this.init()

    this.ui.show();

    return true;
  }

  /**
   * Processes input from a specified button.
   * This method handles navigation through a UI menu, including movement through menu items
   * and handling special actions like cancellation. Each button press may adjust the cursor
   * position or the menu scroll, and plays a sound effect if the action was successful.
   *
   * @param button - The button pressed by the user.
   * @returns `true` if the action associated with the button was successfully processed, `false` otherwise.
   */
  processInput(button: Button): boolean {
    const ui = this.getUi();

    return true;
  }

  setCursor(cursor: integer): boolean {

    return true;
  }

  setScrollCursor(scrollCursor: integer): boolean {


    return true;
  }

  getActiveChallenge(): Challenge {
    return this.scene.gameMode.challenges[0];
  }

  clear() {
    this.ui.remove();
  }

  eraseCursor() {
  }
}
