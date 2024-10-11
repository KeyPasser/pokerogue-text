
import * as Utils from "../../utils";
import { MoveCategory } from "#app/data/move.js";
import i18next from "i18next";
import {Button} from "#enums/buttons";
import Pokemon, { PokemonMove } from "#app/field/pokemon.js";
import UiHandler from "#app/ui/ui-handler.js";
import TextBattleScene from "#app/html-ui/text-battle-scene";
import { Mode } from "../UI";
import { CommandPhase } from "#app/phases/command-phase.js";
import { getTypeDamageMultiplierColor, Type } from "#app/data/type.js";
import { Command } from "./command-ui";
import HUiHandler from "./HUiHandler";

export default class HFightUiHandler extends HUiHandler {
  public static readonly MOVES_CONTAINER_NAME = "moves";

  protected fieldIndex: integer = 0;
  protected cursor2: integer = 0;
  private fightDom: HTMLDivElement;

  constructor(scene: TextBattleScene) {
    super(scene);//, Mode.FIGHT
    const dom = this.fightDom = scene.textPlugin?.createOptionDom("fightSelect");
    dom&&dom.addEventListener("click", (e) => {
      const index = Array.from(dom.children).indexOf(e.target as HTMLElement);

      const pokemon = (this.scene.getCurrentPhase() as CommandPhase).getPokemon();
      const moveset = pokemon.getMoveset();
      if(index == moveset.length){
        return this.processInput(Button.CANCEL)
      }
      this.setCursor(index);
      this.processInput(Button.ACTION);
    });
  }

  setup() {
  }

  show(args: any[]): boolean {

    this.fieldIndex = args.length ? args[0] as integer : 0;

    this.setCursor(this.getCursor());
    this.displayMoves();

    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    const cursor = this.getCursor();

    if (button === Button.CANCEL || button === Button.ACTION) {
      if (button === Button.ACTION) {
        if ((this.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, cursor, false)) {
          success = true;
        } 
      } else {
        ui.setMode(Mode.COMMAND, this.fieldIndex);
        success = true;
      }
    }

    let textInputCursor = button as integer;
    if(textInputCursor >99){
      textInputCursor -= 100;
      const pokemon = (this.scene.getCurrentPhase() as CommandPhase).getPokemon();
      const moveset = pokemon.getMoveset();
      if(textInputCursor == moveset.length){
        return this.processInput(Button.CANCEL)
      }

      this.setCursor(textInputCursor);
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

  /**
   * Gets multiplier text for a pokemon's move against a specific opponent
   * Returns undefined if it's a status move
   */
  private getEffectivenessText(pokemon: Pokemon, opponent: Pokemon, pokemonMove: PokemonMove): string | undefined {
    const effectiveness = opponent.getMoveEffectiveness(pokemon, pokemonMove);
    if (effectiveness === undefined) {
      return undefined;
    }

    return `${effectiveness}x`;
  }

  displayMoves() {
    const fightDom = this.fightDom;
    (fightDom.innerHTML = "");

    const pokemon = (this.scene.getCurrentPhase() as CommandPhase).getPokemon();
    const moveset = pokemon.getMoveset();
    const getType = (type)=>{
        switch(type){
            case MoveCategory.PHYSICAL:
                return '*'
            case MoveCategory.SPECIAL:
                return 'O'
            case MoveCategory.STATUS:
                return '-'
        }
    }

    for (let moveIndex = 0; moveIndex < 4; moveIndex++) {
        if (moveIndex < moveset.length) {
            const pokemonMove = moveset[moveIndex]!; // TODO is the bang correct?

            //(`types${Utils.verifyLang(i18next.resolvedLanguage) ? `_${i18next.resolvedLanguage}` : ""}`, Type[pokemonMove.getMove().type].toLowerCase());
            //("categories", MoveCategory[pokemonMove.getMove().category].toLowerCase());

            const power = pokemonMove.getMove().power;
            const accuracy = pokemonMove.getMove().accuracy;
            const maxPP = pokemonMove.getMovePp();
            const pp = maxPP - pokemonMove.ppUsed;

            // (`${Utils.padInt(pp, 2, "  ")}/${Utils.padInt(maxPP, 2, "  ")}`); //ppText
            // (`${power >= 0 ? power : "---"}`); //powerText
            // (`${accuracy >= 0 ? accuracy : "---"}`); //accuracyText


            fightDom.innerHTML += `<div>${pokemonMove.getName()} <br/> ${i18next.t(`pokemonInfo:Type.${Type[pokemonMove.getMove().type]}`)} ${getType(pokemonMove.getMove().category)}<br/>${Utils.padInt(pp, 2, "  ")}/${Utils.padInt(maxPP, 2, "  ")}<br/>${power >= 0 ? power : "---"}<br/>${accuracy >= 0 ? accuracy : "---"}</div>`
        }
    }
    fightDom.innerHTML += `<div>${i18next.t("partyUiHandler:CANCEL")}</div>`;

    this.scene.textPlugin.showOptionDom(fightDom);
  }


  clear() {
    super.clear();
    this.clearMoves();

    this.scene.textPlugin?.hideOptionDom(this.fightDom);
  }

  clearMoves() {
    const opponents = (this.scene.getCurrentPhase() as CommandPhase).getPokemon().getOpponents();
    opponents.forEach((opponent) => {
      opponent.updateEffectiveness(undefined);
    });
  }
}
