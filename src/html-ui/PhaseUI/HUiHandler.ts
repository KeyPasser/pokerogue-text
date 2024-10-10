import { Button } from "#app/enums/buttons.js";
import TextBattleScene from "#app/text-battle-scene.js";

export default class HUiHandler{
    protected scene: TextBattleScene;
    protected cursor: integer;
    constructor(scene: TextBattleScene) {
        this.scene = scene
      }
      getUi(){
        return this.scene.ui
      }
      setup(){
        
      }
      clear(){}
      hide(){

      }
      show(...args){

      }
      processInput(button: Button){
        return true;
      }
}