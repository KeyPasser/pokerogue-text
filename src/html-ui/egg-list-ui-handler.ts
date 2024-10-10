
import { Egg } from "../data/egg";
import {Button} from "#enums/buttons";
import i18next from "i18next";
import HUiHandler from "./PhaseUI/HUiHandler";
import TextBattleScene from "#app/text-battle-scene.js";
import { getTierColor, HTMLDialog } from "./Root";
import { ModifierTier } from "#app/modifier/modifier-tier.js";
import "./eggs-list.scss"

export default class HEggListUiHandler extends HUiHandler {
  private ui: HTMLDialog

  constructor(scene: TextBattleScene) {
    super(scene);//, Mode.EGG_LIST
  }

  setup() {
  }

  show(args: any[]): boolean {
    let e = 0;

    let dialog = this.ui;
    if(!this.ui){
        dialog = this.ui = new HTMLDialog(()=>{
            this.clear();
            this.scene.ui.revertMode();
        }).setName("egg-list").setInnerHTML(`<div class="eggs-container"></div>
        <div class="msg"></div>`)
    }

    dialog.setTitle(i18next.t("menuUiHandler:EGG_LIST")+" "+this.scene.gameData.eggs.length+" / 100")

    const eggsContainer = dialog.findObject(".eggs-container")
    .setInnerHTML(this.scene.gameData.eggs.map((egg, i) => 
      `<div data-index=${i} style="color:#${getTierColor(egg.tier as any as ModifierTier).toString(16)}">${i18next.t("egg:egg")} (${egg.getEggDescriptor()})</div>`
    ).join(""));

    this.setCursor(0);
    dialog.show();

    eggsContainer.on("click", (e) => {
      if (e.target instanceof HTMLElement) {
        const index = e.target.getAttribute("data-index");
        if (index) {
          this.setEggDetails(this.scene.gameData.eggs[index]);
        }
      }
    });

    return true;
  }

  processInput(button: Button): boolean {
    let success = false;
    const error = false;

    return success || error;
  }

  setEggDetails(egg: Egg): void {
    let html = "";
    html += `<div>${i18next.t("egg:egg")} (${egg.getEggDescriptor()})</div>
    <div>${new Date(egg.timestamp).toLocaleString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "numeric"
    })}</div>
    <div>${egg.getEggHatchWavesMessage()}</div>
    <div>${egg.getEggTypeDescriptor(this.scene)}</div>`;

    const msg = this.ui.findObject(".msg").setInnerHTML(html);
  }

  setCursor(cursor: integer): boolean {
    let changed = false;

    return changed;
  }

  clear(): void {
    this.ui.hide();
  }
}
