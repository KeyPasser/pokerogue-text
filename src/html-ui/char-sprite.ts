import BattleScene from "../battle-scene";
import * as Utils from "../utils";
import { HTMLContainer, HTMLObject } from "./Root";

export default class HCharSprite extends HTMLContainer {
  private sprite: Phaser.GameObjects.Sprite;
  private transitionSprite: Phaser.GameObjects.Sprite;

  public key: string;
  public variant: string;
  public shown: boolean;

  constructor(scene: BattleScene, additional:boolean = false) {
    super()
  }

  setup(): void {

  }
  showPbTray(){
    
  }
  showCharacter(key: string, variant: string): Promise<void> {
    return new Promise(resolve => {
      resolve();
    });
  }

  setVariant(variant: string): Promise<void> {
    return new Promise(resolve => {
      
          resolve();
    });
  }

  hide(): Promise<void> {
    return new Promise(resolve => {
        return resolve();

    });
  }
}
