import HTMLContainer, { getRootContainer } from '#app/html-ui/Root.js';

import PartyUiHandler, { PartyUiMode } from "../../ui/party-ui-handler";
import { Mode } from "../../ui/ui";
import UiHandler from "#app/ui/ui-handler.js";
import i18next from "i18next";
import { Button } from "#enums/buttons";
import TextBattleScene from "#app/html-ui/text-battle-scene";
import TransferUI from "../transfer-ui";
import HUiHandler from "./HUiHandler";
import { getPokemonNameWithAffix } from "#app/messages.js";
import { CommandPhase } from "#app/phases/command-phase.js";
import "./command-ui.scss"

export enum Command {
  FIGHT = 0,
  BALL,
  POKEMON,
  RUN
}

export default class HCommandUiHandler extends HUiHandler {
  protected fieldIndex: integer = 0;
  protected cursor2: integer = 0;
  private dom: HTMLElement;

  constructor(scene: TextBattleScene) {
    super(scene);//, Mode.COMMAND
  }

  setup() {

  }
  show(args: any[]): boolean {
    super.show(args);

    const commands = [
      i18next.t("commandUiHandler:fight"),
      i18next.t("commandUiHandler:ball"),
      i18next.t("commandUiHandler:pokemon"),
      i18next.t("commandUiHandler:run"),
      args[0] == 1 && i18next.t("menu:cancel"),
    ];

    if (!this.dom) {
      const dom = this.dom = this.scene.textPlugin.createOptionDom("commandSelect");
      dom.addEventListener("click", (e) => {
        const index = Array.from(dom.children).indexOf(e.target as HTMLElement);
        if (index == 4) {
          return this.processInput(Button.CANCEL);
        }

        this.setCursor(index);
        this.processInput(Button.ACTION);
      });
    }
    const dom = this.dom;
    dom.innerHTML = "";
    for (let c = 0; c < commands.length; c++) {
      const command = commands[c];
      if (!command) continue;
      dom.innerHTML += `<div>${commands[c]}</div>`;
    }

    let commandPhase: CommandPhase;
    const currentPhase = this.scene.getCurrentPhase();
    if (currentPhase instanceof CommandPhase) {
      commandPhase = currentPhase;
    } else {
      commandPhase = this.scene.getStandbyPhase() as CommandPhase;
    }

    const textPlugin = this.scene.textPlugin;
    textPlugin.showMsg(i18next.t("commandUiHandler:actionMessage",
      {
        pokemonName: getPokemonNameWithAffix(commandPhase.getPokemon())
      }
    ));

    this.scene.textPlugin.showOptionDom(dom);

    if(getRootContainer().autoSkip()&&args[0]===0){
      (this.dom.children[3] as HTMLDivElement).click();
    }

    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    const cursor = this.getCursor();

    if (button === Button.CANCEL || button === Button.ACTION) {

      if (button === Button.ACTION) {
        switch (cursor) {
          // Fight
          case 0:
            if ((this.scene.getCurrentPhase() as CommandPhase).checkFightOverride()) {
              return true;
            }
            ui.setMode(Mode.FIGHT, (this.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
            success = true;
            break;
          // Ball
          case 1:
            ui.setModeWithoutClear(Mode.BALL);
            success = true;
            break;
          // Pokemon
          case 2:
            ui.setMode(Mode.PARTY, PartyUiMode.SWITCH, (this.scene.getCurrentPhase() as CommandPhase).getPokemon().getFieldIndex(), null, PartyUiHandler.FilterNonFainted);
            success = true;
            break;
          // Run
          case 3:
            (this.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.RUN, 0);
            success = true;
            break;
        }
      } else {
        (this.scene.getCurrentPhase() as CommandPhase).cancel();
      }
    } else {
      switch (button) {
        case Button.UP:
          if (cursor >= 2) {
            success = this.setCursor(cursor - 2);
          }
          break;
        case Button.DOWN:
          if (cursor < 2) {
            success = this.setCursor(cursor + 2);
          }
          break;
        case Button.LEFT:
          if (cursor % 2 === 1) {
            success = this.setCursor(cursor - 1);
          }
          break;
        case Button.RIGHT:
          if (cursor % 2 === 0) {
            success = this.setCursor(cursor + 1);
          }
          break;
      }
    }

    const hCursor = button as integer;
    if (hCursor > 99) {
      if (hCursor == 104) {
        return this.processInput(Button.CANCEL);
      }
      this.setCursor(hCursor - 100);
      this.processInput(Button.ACTION);
    }

    return success;
  }

  getCursor(): integer {
    return !this.fieldIndex ? this.cursor : this.cursor2;
  }

  setCursor(cursor: integer): boolean {
    const changed = this.getCursor() !== cursor;
    if (changed) {
      if (!this.fieldIndex) {
        this.cursor = cursor;
      } else {
        this.cursor2 = cursor;
      }
    }

    return changed;
  }

  clear(): void {
    this.dom.remove();
  }
}
