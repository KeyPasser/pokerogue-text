import BattleScene from "../battle-scene";
import Pokemon from "../field/pokemon";
import { getRootContainer, HTMLObject } from "./Root";

export default class HPartyExpBar extends HTMLObject {

  public shown: boolean;
  scene: BattleScene

  constructor(scene: BattleScene) {
    super();
    this.scene = scene;
  }

  setup(): void {
    this.dom = getRootContainer(this.scene).find("#party-exp-bar") as HTMLDivElement;
  }

  showPokemonExp(pokemon: Pokemon, expValue: integer, showOnlyLevelUp: boolean, newLevel: number): Promise<void> {

    return new Promise<void>(resolve => {
      if (this.shown) {
        return resolve();
      }
      let text = pokemon.name+" ";
      // if we want to only display the level in the small frame
      if (showOnlyLevelUp) {
        if (newLevel > 200) { // if the level is greater than 200, we only display Lv. UP
          text+="Lv. UP";
        } else { // otherwise we display Lv. Up and the new level
          text+=`Lv. UP: ${newLevel.toString()}`;
        }
      } else {
        // if we want to display the exp
        text += `+${expValue.toString()}`;
      }

      this.dom.innerHTML = text;
      this.show();
    });
  }

}
