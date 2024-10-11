import { Button } from "#enums/buttons";
import i18next from "i18next";
import { Achv, achvs, getAchievementDescription } from "../system/achv";
import { ParseKeys } from "i18next";
import { PlayerGender } from "#enums/player-gender";
import HUiHandler from "./PhaseUI/HUiHandler";
import { Mode } from "./UI";
import TextBattleScene from "#app/html-ui/text-battle-scene.js";

export default class HAchvsUiHandler extends HUiHandler {
  constructor(scene: TextBattleScene, mode: Mode | null = null) {
    super(scene);
  }

  setup() {

    this.setCursor(0);

  }

  show(args: any[]): boolean {
    this.updateAchvIcons();

    this.setCursor(0);

    return true;
  }


  processInput(button: Button): boolean {
    const ui = this.scene.ui;

    let success = false;

    if (button === Button.CANCEL) {
      success = true;
      this.scene.ui.revertMode();
    } else {
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


  /**
   * updateAchvIcons(): void
   * Determines what data is to be displayed on the UI and updates it accordingly based on the current value of this.scrollCursor
   */
  updateAchvIcons(): void {
    const achvUnlocks = this.scene.gameData.achvUnlocks;

    const achvRange = Object.values(achvs);

    const dialog = document.createElement('dialog');
    dialog.id = "achvs";

    let content = "<div class='back'>←</div><ul>";

        // We need to get the player gender from the game data to add the correct prefix to the achievement name
    
    achvRange.forEach((achv: Achv, i: integer) => {
    //   const icon = this.achvIcons[i];
      const unlocked = achvUnlocks.hasOwnProperty(achv.id);
      const hidden = !unlocked && achv.secret && (!achv.parentId || !achvUnlocks.hasOwnProperty(achv.parentId));
      const tinted = !hidden && !unlocked;

      const genderIndex = this.scene.gameData.gender ?? PlayerGender.MALE;
      const genderStr = PlayerGender[genderIndex].toLowerCase();

      let name = i18next.t(`achv:${achv.localizationKey}.name` as ParseKeys,{context:genderStr});
      let description = getAchievementDescription(achv.localizationKey);

      if(!hidden)
        content+=`<li style="filter:contrast(${unlocked?"1":"0.2"});"><div>${name}</div><div>${description}</div><div>${achv.score}pt</div><div>${unlocked ? new Date(achvUnlocks[achv.id]).toLocaleDateString() : i18next.t(`achv:Locked.name` as ParseKeys,{context:genderStr})}</div></li>`
    //   icon.setFrame(!hidden ? achv.iconImage : "unknown");
    //   icon.setVisible(true);
    //   if (tinted) {
    //     icon.setTintFill(0);
    //   } else {
    //     icon.clearTint();
    //   }
    });
    dialog.innerHTML = content+"</ul>";
    document.body.append(dialog);

    dialog.addEventListener('click',e=>{
        const target = e.target as HTMLDivElement;
        if(target.classList.contains('back')){
            dialog.close();
            this.scene.ui.revertMode();
        }
    })

    dialog.showModal();
  }

  clear() {
    this.eraseCursor();
  }

  eraseCursor() {
  }
}
