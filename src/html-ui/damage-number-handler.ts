import { TextStyle, addTextObject } from "../ui/text";
import * as Utils from "../utils";
import { BattlerIndex } from "../battle";

import TextBattleScene from "#app/html-ui/text-battle-scene";
import { DamageResult, HitResult } from "#app/field/pokemon.js";
import type Pokemon from "#app/field/pokemon.js";
import i18next from "i18next";
type TextAndShadowArr = [ string | null, string | null ];

export default class HDamageNumberHandler {
  scene:TextBattleScene
  constructor(scene:TextBattleScene) {
    this.scene = scene;
  }

  add(target: Pokemon, amount: integer, result: DamageResult | HitResult.HEAL = HitResult.EFFECTIVE, critical: boolean = false): void {
    if(result!=HitResult.HEAL){
      this.scene.textPlugin.showBBCodeMsg(
        `[color=]${i18next.t("battlerTags:damagingTrapLapse",{
          pokemonNameWithAffix:target.getNameToRender(),
          moveName:amount
        })}[/color]`
      )
    }else{
      this.scene.textPlugin.showBBCodeMsg(
        `[color=]${i18next.t("battlerTags:aquaRingLapse",{
          moveName:target.getNameToRender(),
          pokemonName:amount
        })}[/color]`
      )
    }
  }
}
