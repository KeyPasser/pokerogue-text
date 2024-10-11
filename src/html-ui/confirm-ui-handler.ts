import i18next from "i18next";
import {Button} from "#enums/buttons";
import HUiHandler from "./PhaseUI/HUiHandler";
import TextBattleScene from "#app/html-ui/text-battle-scene";
import { getRootContainer, HTMLContainer } from "./Root";


export default class HConfirmUiHandler extends HUiHandler {

  public static readonly windowWidth: integer = 48;

  private switchCheck: boolean;
  private container: HTMLContainer;

  constructor(scene: TextBattleScene) {
    super(scene);//, Mode.CONFIRM
  }

  getWindowWidth(): integer {
    return 0;
  }

  show(args: any[]): boolean {
    let container = this.container;
    if(!container){
      container = this.container = new HTMLContainer().addClass("option-select");
    }
    if (args.length === 4 && args[0] instanceof Function && args[1] instanceof Function && args[2] instanceof Function && args[3] === "fullParty") {
        [
          {
            label: i18next.t("partyUiHandler:SUMMARY"),
            handler: () => {
              args[0]();
              return true;
            },
          }, {
            label: i18next.t("menu:yes"),
            handler: () => {
              args[1]();
              return true;
            }
          }, {
            label: i18next.t("menu:no"),
            handler: () => {
              args[2]();
              return true;
            }
          }
        ].map(option =>{
          const optionObj = new HTMLContainer().setText(option.label).on('click',option.handler)
          container.add(optionObj)
        })
        this.scene.textPlugin.showOptionDom(container.getDOM());
      return true;
    } else if (args.length >= 2 && args[0] instanceof Function && args[1] instanceof Function) {
      [
          {
            label: i18next.t("menu:yes"),
            handler: () => {
              args[0]();
              return true;
            }
          },
          {
            label: i18next.t("menu:no"),
            handler: () => {
              args[1]();
              return true;
            }
          }
        ].map(option =>{
          const optionObj = new HTMLContainer().setText(option.label).on('click',option.handler)
          container.add(optionObj)
        })
        this.scene.textPlugin.showOptionDom(container.getDOM());

        if(getRootContainer().autoSkip()){
          (container.findObject("div:nth-child(2)").getDOM()).click();
        }

      return true;
    }

    return false;
  }

  processInput(button: number): boolean {
    this.container.find("div:nth-child(" + (button - 99) + ")")?.click();
    return true;
  }

  setCursor(cursor: integer): boolean {
    return true;
  }
  clear(): void {
    this.container.destroy();
  }
}
