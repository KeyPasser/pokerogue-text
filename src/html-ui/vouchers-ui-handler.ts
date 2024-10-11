import { Button } from "#app/enums/buttons.js";
import { getVoucherTypeIcon, getVoucherTypeName, Voucher, vouchers } from "#app/system/voucher.js";
import i18next from "i18next";
import HUiHandler from "./PhaseUI/HUiHandler";
import { HTMLDialog } from "./Root";
import { Mode } from "./UI";
import "./vouchers-ui-handler.scss"
import TextBattleScene from "#app/html-ui/text-battle-scene";

export default class HVouchersUiHandler extends HUiHandler {
  ui:HTMLDialog;

  constructor(scene: TextBattleScene, mode: Mode | null = null) {
    super(scene);
  }

  setup() {
  }
  init(){
    if(!this.ui){
      this.ui = new HTMLDialog(()=>{
        this.ui.hide();
        this.scene.ui.revertMode();
      }).setInnerHTML(`
        <div class="voucher-ui">
          
        </div>
        `)
    }

  }

  show(args: any[]): boolean {
    super.show(args);

    this.init();

    this.updateVoucherIcons();

    this.ui.show();

    return true;
  }
  showText(selector=".voucher-description",text=""){
    this.ui.findObject(selector).setText(text);
  }
  protected showVoucher(voucher: Voucher) {
    if(!voucher)return;
    
    const voucherUnlocks = this.scene.gameData.voucherUnlocks;
    const unlocked = voucherUnlocks.hasOwnProperty(voucher.id);

    this.showText(".voucher-title",getVoucherTypeName(voucher.voucherType));
    this.showText(".voucher-description", voucher.description);
    this.showText(".voucher-locked", unlocked ? new Date(voucherUnlocks[voucher.id]).toLocaleDateString() : i18next.t("voucher:locked"));
  }

  processInput(button: Button): boolean {
    const ret = true;

    return ret;
  }

  setCursor(cursor: integer): boolean {
    const ret = true;
    return ret;
  }

  setScrollCursor(scrollCursor: integer): boolean {
    return true;
  }

  updateVoucherIcons(): void {
    const voucherUnlocks = this.scene.gameData.voucherUnlocks;

    let html = ""

    Object.values(vouchers).forEach((voucher: Voucher, i: integer) => {
      const unlocked = voucherUnlocks.hasOwnProperty(voucher.id);

      html += `<div class="voucher-info ${unlocked&&'unlocked'}">
            <div class="voucher-title">${getVoucherTypeName(voucher.voucherType)}</div>
            <div class="voucher-description">${voucher.description}</div>
            <div class="voucher-locked">${unlocked ? new Date(voucherUnlocks[voucher.id]).toLocaleDateString() : i18next.t("voucher:locked")}</div>
          </div>`
    });

    this.ui.findObject(".voucher-ui").setInnerHTML(html);

  }

  clear() {
    this.ui.getDOM().remove();
  }

  eraseCursor() {
  }
}
