import BattleScene from "../battle-scene";
import { Species } from "#enums/species";
import {  HTMLContainer, HTMLObject } from "./Root";
import i18next from "i18next";
import { allSpecies } from "#app/data/pokemon-species";
import TextBattleScene from "#app/text-battle-scene.js";

export default class HCandyBar extends HTMLContainer {

  private autoHideTimer: NodeJS.Timeout | null;

  public shown: boolean;

  constructor(scene: TextBattleScene) {
    super();
    this.scene = scene;
  }

  setup(): void {
  }

  showStarterSpeciesCandy(starterSpeciesId: Species, count: integer): Promise<void> {
    // let species = allSpecies[starterSpeciesId];
    // species = species?allSpecies[species.getRootSpeciesId()]:species;
    const scene = this.scene as TextBattleScene;
    const starter = scene.gameData.starterData[starterSpeciesId];
    return new Promise<void>(resolve => {
      const text = i18next.t("filterBar:sortByCandies") + ` ${starter.candyCount + count} (+${count.toString()})`;
      
      scene.textPlugin.showMsg(text);
      resolve()
    });
  }

  resetAutoHideTimer(): void {
    if (this.autoHideTimer) {
      clearInterval(this.autoHideTimer);
    }
    this.autoHideTimer = setTimeout(() => {
      this.hide();
      this.autoHideTimer = null;
    }, 2500);
  }
}
