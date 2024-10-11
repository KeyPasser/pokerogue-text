import { Mode } from "../../ui/ui";
import { getMoveTargets } from "../../data/move";
import {Button} from "#enums/buttons";
import { Moves } from "#enums/moves";
import TextBattleScene from "#app/html-ui/text-battle-scene";
import { BattlerIndex } from "#app/battle.js";
import i18next from "i18next";
import "./target-select-style.scss"
import HUiHandler from "./HUiHandler";
import { HTMLContainer } from "../Root";

export type TargetSelectCallback = (targets: BattlerIndex[]) => void;

export default class HTargetSelectUi extends HUiHandler {
  private fieldIndex: integer;
  private move: Moves;
  private targetSelectCallback: TargetSelectCallback;

  private isMultipleTargets: boolean = false;
  private targets: BattlerIndex[];
  dom:HTMLContainer;

  constructor(scene: TextBattleScene) {
    super(scene);//, Mode.TARGET_SELECT

    this.cursor = -1;
  }

  setup(): void { }

  show(args: any[]): boolean {
    if (args.length < 3) {
      return false;
    }

    this.fieldIndex = args[0] as integer;
    this.move = args[1] as Moves;
    this.targetSelectCallback = args[2] as TargetSelectCallback;

    const moveTargets = getMoveTargets(this.scene.getPlayerField()[this.fieldIndex], this.move);
    this.targets = moveTargets.targets;
    this.isMultipleTargets = moveTargets.multiple ?? false;

    if (!this.targets.length) {
      return false;
    }
    if(!this.dom){
      this.dom = new HTMLContainer().addClass("h-targets").setInnerHTML(`
        <div class="targets"></div>
        <div class="buttons">    
          <div class="cancel">${i18next.t("menuUiHandler:cancel")}</div>
          <div class="OK">${i18next.t("settings:buttonAction")}</div>
        </div>`)
        const buttons = this.dom.findObject(".buttons");
        buttons.on("click",(e)=>{
          const index = Array.from(buttons.getDOM().children).indexOf(e.target as HTMLElement);
          if(index == 0){
            this.targetSelectCallback([]);
          }
          if(index == 1){
            const targetIndexes: BattlerIndex[] = this.isMultipleTargets ? this.targets : [this.cursor];
            this.targetSelectCallback(targetIndexes);
          }
        });


        this.dom.findObject(".targets").on('click',(e)=>{
          const target = e.target as HTMLElement;

            const index = target.parentElement ? Array.from(target.parentElement.children).indexOf(target as HTMLElement) : -1;
            if(index < this.targets.length&&index>=0){
              this.cursor = this.targets[index]
    
              const targetIndexes: BattlerIndex[] = this.isMultipleTargets ? this.targets : [this.cursor];
              this.targetSelectCallback(targetIndexes);
            }
        })
    }
      

    this.dom.findObject(".targets").setInnerHTML(this.targets.map(v=>{
      return `<div class=${this.scene.getField()[v].isPlayer()&&"player"}>`+this.scene.getField()[v].name+"</div>"
    }).join(""));

    this.dom.setVisible(true);
    this.scene.textPlugin.showOptionDom(this.dom.getDOM())

    this.scene.getModifierBar(true);

    return true;
  }

  processInput(button: Button): boolean {
    let success = false;
    return success;
  }
  clear(): void {
    this.dom.setVisible(false)
  }
}
