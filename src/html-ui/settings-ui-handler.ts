import TextBattleScene from "#app/html-ui/text-battle-scene";
import HUiHandler from "./PhaseUI/HUiHandler";
import SettingTemplate from "virtual:settings.hs";
import { Mode } from "./UI";
import { HTMLContainer, HTMLDialog } from "./Root";
import i18next from "i18next";
import { Setting, settingIndex, SettingKeys, SettingType } from "#app/system/settings/settings";
import "./settings.scss"

export default class HSettingsUiHandler extends HUiHandler {
  private dom:HTMLDialog;
  /**
   * Creates an instance of SettingsGamepadUiHandler.
   *
   * @param scene - The BattleScene instance.
   * @param mode - The UI mode, optional.
   */
  constructor(scene: TextBattleScene, mode: Mode | null = null) {
    super(scene);//, SettingType.GENERAL, mode
  }
  setup(){
  }
  init(){
    if(this.dom)return
    this.dom = new HTMLDialog(()=>{
      this.scene.ui.revertMode();
      this.dom.hide();
    }).addClass("top-settings");
    this.dom.setInnerHTML(SettingTemplate({
      General:i18next.t("settings:General"),
      Display:i18next.t("settings:Display"),
      Audio:i18next.t("settings:Audio"),
      Gamepad:i18next.t("settings:Gamepad"),
      Keyboard:i18next.t("settings:Keyboard"),
    }));

    const getObject = (selecotr)=>this.dom.findObject(selecotr);
    const tabCmpt = getObject(".tab")
    .on("click",(e)=>{
      const target = e.target as HTMLElement;
      tabCmpt.findObject(".active").removeClass("active");
      target.classList.add("active");

      getObject(".tabbody .active").removeClass("active");
      getObject('#'+target.classList[0]).addClass("active");
    })

    getObject('#general-tab').removeAll()
    .setInnerHTML(
      [
        'Game_Speed',
        'HP_Bar_Speed',
        'EXP_Gains_Speed',
        'EXP_Party_Display',
        'Skip_Seen_Dialogues',
        'Battle_Style',
        'Enable_Retries',
        'Hide_IVs',
        'Tutorials',
        'Touch_Controls',
        'Vibration',
      ].map((key)=>{
        const setting = Setting[settingIndex(SettingKeys[key])];
        return `<div class="setting">
          <label>${setting.label}</label>
          <div class="setting-value">${
            setting.options.map((option,i)=>{
              return `<label><input name="${key}" type="radio" value="${option.value}"></input><span>${option.label}</span></label>`
            }).join("")
          }</div>
        </div>`
      }).join("")
    );

    getObject('#display-tab').removeAll()
    .setInnerHTML(
      [
        'Language',
        'UI_Theme',
        'Window_Type',
        'Money_Format',
        'Damage_Numbers',
        'Move_Animations',
        'Show_Stats_on_Level_Up',
        'Candy_Upgrade_Notification',
        'Candy_Upgrade_Display',
        'Move_Info',
        'Show_Moveset_Flyout',
        'Show_Arena_Flyout',
        'Show_Time_Of_Day_Widget',
        'Time_Of_Day_Animation',
        'Sprite_Set',
        'Fusion_Palette_Swaps',
        'Player_Gender',
        'Type_Hints',
        'Show_BGM_Bar',
        'Move_Touch_Controls',
        'Shop_Overlay_Opacity',
      ].map((key)=>{
        const setting = Setting[settingIndex(SettingKeys[key])];
        return `<div class="setting">
          <label>${setting.label}</label>
          <div class="setting-value">${
            setting.options.map((option,i)=>{
              return `<label><input name="${key}" type="radio" value="${option.value}"></input><span>${option.label}</span></label>`
            }).join("")
          }</div>
        </div>`
      }).join("")
    );

    getObject('#audio-tab').removeAll()
    .setInnerHTML(
      [
        'Master_Volume',
        'BGM_Volume',
        'SE_Volume',
        'Music_Preference',
      ].map(key=>{
        const setting = Setting[settingIndex(SettingKeys[key])];
        return `<div class="setting">
          <label>${setting.label}</label>
          <div class="setting-value">${
            setting.options.map((option,i)=>{
              return `<label><input name="${key}" type="radio" value="${option.value}"></input><span>${option.label}</span></label>`
            }).join("")
          }</div>
        </div>`
      }).join("")
    )
  }
  show(){
    this.init();
    this.dom.show();
  }
  processInput(){

  }
  updateBindings(): void {}
  activateSetting(setting: Setting): boolean {
    return false;
  }
  clear(){
    this.dom.hide();
  }
}
