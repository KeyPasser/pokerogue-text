import { getPokemonNameWithAffix } from "#app/messages.js";
import BattleScene from "../battle-scene";
import Pokemon from "../field/pokemon";
import i18next from "i18next";
import { getRootContainer, HTMLContainer, HTMLObject } from "./Root";
import "./ability-bat-style.scss"

export default class HAbilityBar extends HTMLContainer {
  private autoHideTimer: NodeJS.Timeout | null;
  public shown: boolean;

  constructor(scene: BattleScene) {
    super(getRootContainer(scene).find("#ability-bar") as HTMLDivElement);
    this.scene = scene;
    
    this.dom.addEventListener('click',function(e){
      (e.target as HTMLElement).style.display = 'none'
    })
  }

  setup(): void {
    
  }

  showAbility(pokemon: Pokemon, passive: boolean = false): void {
    const ability = `${i18next.t("fightUiHandler:abilityFlyInText", { pokemonName: getPokemonNameWithAffix(pokemon), passive: passive ? i18next.t("fightUiHandler:passive") : "", abilityName: !passive ?  pokemon.getAbility().name : pokemon.getPassiveAbility().name })}`;
    console.log(ability)

    this.dom.innerHTML = ability;
    this.dom.style.display = "block";

    setTimeout(() => {
      this.dom.style.display = 'none'
    }, 2000);
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
