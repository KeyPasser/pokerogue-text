import * as Utils from "../utils";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";
import {Button} from "#enums/buttons";
import i18next from "i18next";
import HUiHandler from "./PhaseUI/HUiHandler";
import TextBattleScene from "#app/text-battle-scene";
import HTMLContainer from "./Root";
import { getTextColor, TextStyle } from "#app/ui/text";
import { getIVsName } from "./widgets/pokeName";
import { Stat, PERMANENT_STATS, getStatKey } from "#app/enums/stat";

export default class HBattleMessageUiHandler extends HUiHandler {
  bg = new HTMLContainer();
  nameBoxContainer = new HTMLContainer();
  constructor(scene: TextBattleScene) {
    super(scene);//, Mode.MESSAGE
    
  }

  setup(): void {

  }

  show(args: any[]): boolean {
    super.show(args);

    return true;
  }

  processInput(button: Button): boolean {

    return false;
  }

  clear() {
    super.clear();
  }

  showText(text: string, delay?: integer | null, callback?: Function | null, callbackDelay?: integer | null, prompt?: boolean | null, promptDelay?: integer | null) {
    const charVarMap = new Map<integer, string>();
    const delayMap = new Map<integer, integer>();
    const soundMap = new Map<integer, string>();
    const actionPattern = /@(c|d|s)\{(.*?)\}/;
    let actionMatch: RegExpExecArray | null;
    while ((actionMatch = actionPattern.exec(text))) {
      switch (actionMatch[1]) {
      case "c":
        charVarMap.set(actionMatch.index, actionMatch[2]);
        break;
      case "d":
        delayMap.set(actionMatch.index, parseInt(actionMatch[2]));
        break;
      case "s":
        soundMap.set(actionMatch.index, actionMatch[2]);
        break;
      }
      text = text.slice(0, actionMatch.index) + text.slice(actionMatch.index + actionMatch[2].length + 4);
    }

    this.scene.textPlugin?.showMsg(text);

    callback?.();
  }

  showDialogue(text: string, name?: string, delay?: integer | null, callback?: Function, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer) {
    name&&this.scene.textPlugin?.showMsg(name);
    this.showText(text, delay, callback, callbackDelay, prompt, promptDelay);
  }

  promptLevelUpStats(partyMemberIndex: integer, prevStats: integer[], showTotals: boolean): Promise<void> {
    return new Promise(resolve => {
      if (!this.scene.showLevelUpStats) {
        return resolve();
      }
      const newStats = (this.scene as TextBattleScene).getParty()[partyMemberIndex].stats;
      let levelUpStatsValuesText = "";
      const stats = Utils.getEnumValues(Stat);
      for (const s of stats) {
        levelUpStatsValuesText += `${showTotals ? newStats[s] : newStats[s] - prevStats[s]}\n`;
      }

      // this.onActionInput = () => {
        if (!showTotals) {
          return this.promptLevelUpStats(partyMemberIndex, [], true).then(() => resolve());
        } else {
          resolve();
        }
      // };
    });
  }

  promptIvs(pokemonId: integer, ivs: integer[], shownIvsCount: integer): Promise<void> {
    return new Promise(resolve => {
      this.scene.executeWithSeedOffset(() => {
        let levelUpStatsValuesText = "";

        const shownStats = this.getTopIvs(ivs, shownIvsCount);
        for (const s of PERMANENT_STATS) {
          levelUpStatsValuesText += `${shownStats.includes(s) ? this.getIvDescriptor(ivs[s], s, pokemonId) : "???"}\n`;
        }

        this.scene.textPlugin?.showBBCodeMsg(levelUpStatsValuesText);

        resolve();
      }, pokemonId);
    });
  }

  getTopIvs(ivs: integer[], shownIvsCount: integer): Stat[] {
    const stats = Utils.getEnumValues(Stat);
    let shownStats: Stat[] = [];
    if (shownIvsCount < 6) {
      const statsPool = stats.slice(0);
      for (let i = 0; i < shownIvsCount; i++) {
        let shownStat: Stat | null = null;
        let highestIv = -1;
        statsPool.map(s => {
          if (ivs[s] > highestIv) {
            shownStat = s as Stat;
            highestIv = ivs[s];
          }
        });
        if (shownStat !== null && shownStat !== undefined) {
          shownStats.push(shownStat);
          statsPool.splice(statsPool.indexOf(shownStat), 1);
        }
      }
    } else {
      shownStats = stats;
    }
    return shownStats;
  }

  getIvDescriptor(value: integer, typeIv: integer, pokemonId: integer): string {
    const starterSpecies = this.scene.getPokemonById(pokemonId)!.species.getRootSpeciesId(); // we are using getRootSpeciesId() here because we want to check against the baby form, not the mid form if it exists
    const starterIvs: number[] = this.scene.gameData.dexData[starterSpecies].ivs;
    const uiTheme = (this.scene as TextBattleScene).uiTheme; // Assuming uiTheme is accessible

    // Function to wrap text in color based on comparison
    const coloredText = (text: string, isBetter: boolean, ivValue) => {
      let textStyle: TextStyle;
      if (isBetter) {
        if (ivValue === 31) {
          textStyle = TextStyle.PERFECT_IV;
        } else {
          textStyle = TextStyle.SUMMARY_GREEN;
        }
      } else {
        textStyle = TextStyle.SUMMARY;
      }
      //const textStyle: TextStyle = isBetter ? TextStyle.SUMMARY_GREEN : TextStyle.SUMMARY;
      const color = getTextColor(textStyle, false, uiTheme);
      return `[color=${color}][shadow=${getTextColor(textStyle, true, uiTheme)}]${text}[/shadow][/color]`;
    };

    if (value > 30) {
      return coloredText(i18next.t("battleMessageUiHandler:ivBest"), value > starterIvs[typeIv], value);
    }
    if (value === 30) {
      return coloredText(i18next.t("battleMessageUiHandler:ivFantastic"), value > starterIvs[typeIv], value);
    }
    if (value > 20) {
      return coloredText(i18next.t("battleMessageUiHandler:ivVeryGood"), value > starterIvs[typeIv], value);
    }
    if (value > 10) {
      return coloredText(i18next.t("battleMessageUiHandler:ivPrettyGood"), value > starterIvs[typeIv], value);
    }
    if (value > 0) {
      return coloredText(i18next.t("battleMessageUiHandler:ivDecent"), value > starterIvs[typeIv], value);
    }

    return coloredText(i18next.t("battleMessageUiHandler:ivNoGood"), value > starterIvs[typeIv], value);
  }

  showNameText(name: string): void {
  }

  hideNameText(): void {
  }
  clearText(): void {
  }
}
