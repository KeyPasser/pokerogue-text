import BattleScene from "../battle-scene";
import * as Utils from "../utils";
import { argbFromRgba } from "@material/material-color-utilities";
import {Button} from "#enums/buttons";
import HUiHandler from "./PhaseUI/HUiHandler";
import { HTMLContainer } from "./Root";
import TextBattleScene from "#app/text-battle-scene.js";
import { Mode } from "./UI";

export interface OptionSelectConfig {
  xOffset?: number;
  yOffset?: number;
  options: OptionSelectItem[];
  maxOptions?: integer;
  delay?: integer;
  noCancel?: boolean;
  supportHover?: boolean;
}

export interface OptionSelectItem {
  label: string;
  handler: () => boolean;
  onHover?: () => void;
  keepOpen?: boolean;
  overrideSound?: boolean;
  item?: string;
  itemArgs?: any[];
}

const scrollUpLabel = "↑";
const scrollDownLabel = "↓";

export default class HOptionSelectUiHandler extends HUiHandler {
  protected config: OptionSelectConfig | null;

  protected scale: number = 0.1666666667;

  private cursorObj: Phaser.GameObjects.Image | null;
  private dom: HTMLContainer;
  private mode:Mode;

  constructor(scene: TextBattleScene, mode: Mode = Mode.OPTION_SELECT) {
    super(scene);
    this.mode = mode;
  }

  getWindowWidth(): integer{
    return 0;
  };

  getWindowHeight(): integer {
    return 0;
  }

  setup() {
    const ui = this.getUi();
    this.setCursor(0);
  }

  protected setupOptions() {
    const options = this.config?.options || [];
    
    if(!this.dom)
      this.dom = new HTMLContainer().addClass("option-select")
    .on('click', (e) => {
      const index = Array.from(this.dom.getDOM().children).indexOf(e.target as HTMLElement);
      if (index >= 0) {
        this.config?.options[index].handler();
      }
    })
    this.dom.setInnerHTML(
        options.map(o => `<div>${o.label}</div>`).join("\n")
      );

    this.scene.textPlugin.showOptionDom(this.dom.getDOM());
  }

  show(args: any[]): boolean {
    if (!args.length || !args[0].hasOwnProperty("options") || !args[0].options.length) {
      return false;
    }

    this.config = args[0] as OptionSelectConfig;
    this.setupOptions();

    this.setCursor(0);

    return true;
  }

  processInput(button: Button): boolean {
    return true;
  }

  unblockInput(): void {
  }

  getOptionsWithScroll(): OptionSelectItem[] {
    return [];
  }

  setCursor(cursor: integer): boolean {
    const changed = this.cursor !== cursor;
    this.cursor = cursor
    return changed;
  }

  clear() {
    super.clear();
    this.config = null;
    this.eraseCursor();
    this.dom&&this.dom.destroy();
  }

  eraseCursor() {
  }
}
