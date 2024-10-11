import BattleScene from "#app/battle-scene.js";
import TextBattleScene from "#app/html-ui/text-battle-scene";
import { Mode } from "../../ui/ui";
import AbstractHTMLOptionSelectUiHandler from "./abstact-option-ui";

export default class HTitleUiHandler extends AbstractHTMLOptionSelectUiHandler {
  constructor(scene: TextBattleScene | BattleScene, mode: Mode = Mode.TITLE) {
    super(scene as TextBattleScene, mode as any);
  }
}
