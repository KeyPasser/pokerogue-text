
import * as Utils from "../../utils";
import {Button} from "#enums/buttons";
import TextBattleScene from "../text-battle-scene";
import { Mode } from "../UI";
import HUiHandler from "./HUiHandler";

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

export default class AbstractHTMLOptionSelectUiHandler extends HUiHandler {
  protected optionSelectBg: Phaser.GameObjects.NineSlice;
  protected optionSelectText: Phaser.GameObjects.Text;
  protected optionSelectIcons: Phaser.GameObjects.Sprite[];

  protected config: OptionSelectConfig | null;

  protected blockInput: boolean;

  protected scrollCursor: integer = 0;

  protected scale: number = 0.1666666667;

  private htmlDom: HTMLDivElement;

  constructor(scene: TextBattleScene, mode: Mode | null) {
    super(scene)

    this.htmlDom = scene.textPlugin?.createOptionDom("option-select");
  }

  getWindowHeight(): integer {
    return (Math.min((this.config?.options || []).length, this.config?.maxOptions || 99) + 1) * 96 * this.scale;
  }

  setup() {

    this.setCursor(0);
  }

  protected setupOptions() {
    const options = this.config?.options || [];

      if(this.htmlDom){
        this.htmlDom.innerHTML = "";
        options.map((option,i)=>{
          var dom = document.createElement('div');
          dom.innerHTML = option.label;
          this.htmlDom.append(dom);
          dom.addEventListener('click',()=>{
            this.setCursor(i);
            this.processInput(Button.ACTION);
          })
        })
      }
  }

  show(args: any[]): boolean {
    if (!args.length || !args[0].hasOwnProperty("options") || !args[0].options.length) {
      return false;
    }

    this.config = args[0] as OptionSelectConfig;
    this.setupOptions();

    this.scrollCursor = 0;
    this.setCursor(0);

    if (this.config.delay) {
      this.blockInput = true;
      this.optionSelectText.setAlpha(0.5);
      this.scene.time.delayedCall(Utils.fixedInt(this.config.delay), () => this.unblockInput());
    }

    this.scene.textPlugin?.showOptionDom(this.htmlDom);

    return true;
  }

  processInput(button: Button): boolean {
    let success = false;

    const options = this.getOptionsWithScroll();

    if (button === Button.ACTION || button === Button.CANCEL) {
      if (this.blockInput) {
        return false;
      }

      success = true;
      if (button === Button.CANCEL) {
        if (this.config?.maxOptions && this.config.options.length > this.config.maxOptions) {
          this.scrollCursor = (this.config.options.length - this.config.maxOptions) + 1;
          this.cursor = options.length - 1;
        } else if (!this.config?.noCancel) {
          this.setCursor(options.length - 1);
        } else {
          return false;
        }
      }
      const option = this.config?.options[this.cursor + (this.scrollCursor - (this.scrollCursor ? 1 : 0))];
      if (option?.handler()) {
        if (!option.keepOpen) {
          this.clear();
        }
      }
    } else {
      switch (button) {
      case Button.UP:
        if (this.cursor) {
          success = this.setCursor(this.cursor - 1);
        } else if (this.cursor === 0) {
          success = this.setCursor(options.length -1);
        }
        break;
      case Button.DOWN:
        if (this.cursor < options.length - 1) {
          success = this.setCursor(this.cursor + 1);
        } else {
          success = this.setCursor(0);
        }
        break;
      }
      if (this.config?.supportHover) {
        // handle hover code if the element supports hover-handlers and the option has the optional hover-handler set.
        this.config?.options[this.cursor + (this.scrollCursor - (this.scrollCursor ? 1 : 0))]?.onHover?.();
      }
    }

    const cursor = button as number;
    if(cursor>99){
      this.setCursor(cursor-100);
      this.processInput(Button.ACTION);
    }

    return success;
  }

  unblockInput(): void {
    if (!this.blockInput) {
      return;
    }

    this.blockInput = false;
    this.optionSelectText.setAlpha(1);
  }

  getOptionsWithScroll(): OptionSelectItem[] {
    if (!this.config) {
      return [];
    }

    const options = this.config.options.slice(0);

    if (!this.config.maxOptions || this.config.options.length < this.config.maxOptions) {
      return options;
    }

    const optionsScrollTotal = options.length;
    const optionStartIndex = this.scrollCursor;
    const optionEndIndex = Math.min(optionsScrollTotal, optionStartIndex + (!optionStartIndex || this.scrollCursor + (this.config.maxOptions - 1) >= optionsScrollTotal ? this.config.maxOptions - 1 : this.config.maxOptions - 2));

    if (this.config?.maxOptions && options.length > this.config.maxOptions) {
      options.splice(optionEndIndex, optionsScrollTotal);
      options.splice(0, optionStartIndex);
      if (optionStartIndex) {
        options.unshift({
          label: scrollUpLabel,
          handler: () => true
        });
      }
      if (optionEndIndex < optionsScrollTotal) {
        options.push({
          label: scrollDownLabel,
          handler: () => true
        });
      }
    }

    return options;
  }

  setCursor(cursor: integer): boolean {
    const changed = this.cursor !== cursor;

    let isScroll = false;
    const options = this.getOptionsWithScroll();
    if (changed && this.config?.maxOptions && this.config.options.length > this.config.maxOptions) {
      if (Math.abs(cursor - this.cursor) === options.length - 1) {
        // Wrap around the list
        const optionsScrollTotal = this.config.options.length;
        this.scrollCursor = cursor ? optionsScrollTotal - (this.config.maxOptions - 1) : 0;
        this.setupOptions();
      } else {
        // Move the cursor up or down by 1
        const isDown = cursor && cursor > this.cursor;
        if (isDown) {
          if (options[cursor].label === scrollDownLabel) {
            isScroll = true;
            this.scrollCursor++;
          }
        } else {
          if (!cursor && this.scrollCursor) {
            isScroll = true;
            this.scrollCursor--;
          }
        }
        if (isScroll && this.scrollCursor === 1) {
          this.scrollCursor += isDown ? 1 : -1;
        }
      }
    }
    if (isScroll) {
      this.setupOptions();
    } else {
      this.cursor = cursor;
    }

    return changed;
  }

  clear() {
    this.config = null;
    this.eraseCursor();

    this.scene.textPlugin?.hideOptionDom(this.htmlDom);
  }

  eraseCursor() {
  }
}
