
import { getPokeballName } from "#app/data/pokeball.js";
import { CommandPhase } from "#app/phases/command-phase.js";
import TextBattleScene from "#app/text-battle-scene.js";
import {Button} from "#enums/buttons";
import i18next from "i18next";
import { Command } from "./command-ui";
import { Mode } from "../UI";
import HUiHandler from "./HUiHandler";

export default class HBallUiHandler extends HUiHandler {
  private countsText: Phaser.GameObjects.Text;

  setup() {

  }
  show(args: any[]): boolean {
      const TextPlugin = this.scene.textPlugin;
      const dom = TextPlugin.createOptionDom("ball")
      for (let pb = 0; pb < Object.keys(this.scene.pokeballCounts).length; pb++) {
        dom.innerHTML += `<div>${getPokeballName(pb)} (${this.scene.pokeballCounts[pb]})</div>`;
      }
      dom.innerHTML +=`<div>${i18next.t("menu:cancel")}</div>`
      dom.addEventListener("click", (e) => {

        const commandPhase = this.scene.getCurrentPhase() as CommandPhase;
        const index = Array.from(dom.children).indexOf(e.target as HTMLElement);
        if(index == -1 || index==5){
          this.scene.ui.setMode(Mode.COMMAND, commandPhase.getFieldIndex());
        }else{
          this.setCursor(index);
          
          this.processInput(Button.ACTION);
        }

        TextPlugin.hideOptionDom(dom);
      });
      TextPlugin.showOptionDom(dom);

    return true;
  }
  setCursor(i){
    this.cursor = i;
    return true;
  }
  processInput(button: Button): boolean {
    const ui = this.scene.ui;

    let success = false;

    const pokeballTypeCount = Object.keys(this.scene.pokeballCounts).length;

    if (button === Button.ACTION || button === Button.CANCEL) {
      const commandPhase = this.scene.getCurrentPhase() as CommandPhase;
      success = true;
      if (button === Button.ACTION && this.cursor < pokeballTypeCount) {
        if (this.scene.pokeballCounts[this.cursor]) {
          if (commandPhase.handleCommand(Command.BALL, this.cursor)) {
            this.scene.ui.setMode(Mode.COMMAND, commandPhase.getFieldIndex());
            this.scene.ui.setMode(Mode.MESSAGE);
            success = true;
          }
        } else {
          ui.playError();
        }
      } else {
        ui.setMode(Mode.COMMAND, commandPhase.getFieldIndex());
        success = true;
      }
    } else {
    }

    let textInputCursor = button as integer;
    if(textInputCursor >99){
      textInputCursor -= 100;
      if(textInputCursor==5){
        return this.processInput(Button.CANCEL)
      }
      this.setCursor(textInputCursor);
      this.processInput(Button.ACTION);
    }

    return success;
  }

  updateCounts() {
    this.countsText.setText(Object.values(this.scene.pokeballCounts).map(c => `x${c}`).join("\n"));
  }

  clear() {
    const TextPlugin = this.scene.textPlugin;
    TextPlugin.removeDom(".ball")
  }
}
