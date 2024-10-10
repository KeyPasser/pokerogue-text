import {Button} from "#enums/buttons";
import i18next from "i18next";
import HUiHandler from "./HUiHandler";
import { HTMLContainer } from "../Root";

export default class HEvolutionSceneHandler extends HUiHandler {
  public canCancel: boolean;
  public cancelled: boolean;
  public awaitingActionInput:boolean = false;
  public evolutionContainer = new HTMLContainer();

  protected onActionInput: Function | null;

  setup() {
    
  }

  show(_args: any[]): boolean {
    this.awaitingActionInput = true;
    const dom = document.createElement('div')
    dom.classList.add("evolution")
    dom.innerHTML=`<span></span><div>${i18next.t("menu:cancel")}</div>`
    dom.addEventListener('click',(e)=>{
        const index = Array.from(dom.children).indexOf(e.target as HTMLElement);
        if(index == 1){
            this.processInput(Button.CANCEL)
        }
    })
    return true;
  }

  processInput(button: Button): boolean {
    if (this.canCancel && !this.cancelled && button === Button.CANCEL) {
      this.cancelled = true;
      return true;
    }

    if (this.awaitingActionInput) {
      if (button === Button.CANCEL || button === Button.ACTION) {
        if (this.onActionInput) {
          const originalOnActionInput = this.onActionInput;
          this.onActionInput = null;
          originalOnActionInput();
          return true;
        }
      }
    }

    return false;
  }

  setCursor(_cursor: integer): boolean {
    return false;
  }

  clear() {
    this.canCancel = false;
    this.cancelled = false;
  }
}
