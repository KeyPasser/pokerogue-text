import * as Utils from "../utils";
import { DexAttr, GameData } from "../system/game-data";
import { speciesStarters } from "../data/pokemon-species";
import {Button} from "#enums/buttons";
import i18next from "i18next";
import HUiHandler from "./PhaseUI/HUiHandler";
import TextBattleScene from "#app/html-ui/text-battle-scene";
import { Mode } from "./UI";
import { HTMLDialog } from "./Root";
import "./game-stats-ui-handler.scss"

interface DisplayStat {
  label_key?: string;
  sourceFunc?: (gameData: GameData) => string;
  hidden?: boolean;
}

interface DisplayStats {
  [key: string]: DisplayStat | string
}

const displayStats: DisplayStats = {
  playTime: {
    label_key: "playTime",
    sourceFunc: gameData => Utils.getPlayTimeString(gameData.gameStats.playTime)
  },
  battles: {
    label_key: "totalBattles",
    sourceFunc: gameData => gameData.gameStats.battles.toString(),
  },
  startersUnlocked: {
    label_key: "starters",
    sourceFunc: gameData => {
      const starterCount = gameData.getStarterCount(d => !!d.caughtAttr);
      return `${starterCount} (${Math.floor((starterCount / Object.keys(speciesStarters).length) * 1000) / 10}%)`;
    }
  },
  shinyStartersUnlocked: {
    label_key: "shinyStarters",
    sourceFunc: gameData => {
      const starterCount = gameData.getStarterCount(d => !!(d.caughtAttr & DexAttr.SHINY));
      return `${starterCount} (${Math.floor((starterCount / Object.keys(speciesStarters).length) * 1000) / 10}%)`;
    }
  },
  dexSeen: {
    label_key: "speciesSeen",
    sourceFunc: gameData => {
      const seenCount = gameData.getSpeciesCount(d => !!d.seenAttr);
      return `${seenCount} (${Math.floor((seenCount / Object.keys(gameData.dexData).length) * 1000) / 10}%)`;
    }
  },
  dexCaught: {
    label_key: "speciesCaught",
    sourceFunc: gameData => {
      const caughtCount = gameData.getSpeciesCount(d => !!d.caughtAttr);
      return `${caughtCount} (${Math.floor((caughtCount / Object.keys(gameData.dexData).length) * 1000) / 10}%)`;
    }
  },
  ribbonsOwned: {
    label_key: "ribbonsOwned",
    sourceFunc: gameData => gameData.gameStats.ribbonsOwned.toString(),
  },
  classicSessionsPlayed:{
    label_key: "classicRuns",
    sourceFunc: gameData => gameData.gameStats.classicSessionsPlayed.toString(),
  },
  sessionsWon: {
    label_key: "classicWins",
    sourceFunc: gameData => gameData.gameStats.sessionsWon.toString(),
  },
  dailyRunSessionsPlayed: {
    label_key: "dailyRunAttempts",
    sourceFunc: gameData => gameData.gameStats.dailyRunSessionsPlayed.toString(),
  },
  dailyRunSessionsWon: {
    label_key: "dailyRunWins",
    sourceFunc: gameData => gameData.gameStats.dailyRunSessionsWon.toString(),
  },
  endlessSessionsPlayed: {
    label_key: "endlessRuns",
    sourceFunc: gameData => gameData.gameStats.endlessSessionsPlayed.toString(),
    hidden: true
  },
  highestEndlessWave: {
    label_key: "highestWaveEndless",
    sourceFunc: gameData => gameData.gameStats.highestEndlessWave.toString(),
    hidden: true
  },
  highestMoney: {
    label_key: "highestMoney",
    sourceFunc: gameData => Utils.formatFancyLargeNumber(gameData.gameStats.highestMoney),
  },
  highestDamage: {
    label_key: "highestDamage",
    sourceFunc: gameData => gameData.gameStats.highestDamage.toString(),
  },
  highestHeal: {
    label_key: "highestHPHealed",
    sourceFunc: gameData => gameData.gameStats.highestHeal.toString(),
  },
  pokemonSeen: {
    label_key: "pokemonEncountered",
    sourceFunc: gameData => gameData.gameStats.pokemonSeen.toString(),
  },
  pokemonDefeated: {
    label_key: "pokemonDefeated",
    sourceFunc: gameData => gameData.gameStats.pokemonDefeated.toString(),
  },
  pokemonCaught: {
    label_key: "pokemonCaught",
    sourceFunc: gameData => gameData.gameStats.pokemonCaught.toString(),
  },
  pokemonHatched: {
    label_key: "eggsHatched",
    sourceFunc: gameData => gameData.gameStats.pokemonHatched.toString(),
  },
  subLegendaryPokemonSeen: {
    label_key: "subLegendsSeen",
    sourceFunc: gameData => gameData.gameStats.subLegendaryPokemonSeen.toString(),
    hidden: true
  },
  subLegendaryPokemonCaught: {
    label_key: "subLegendsCaught",
    sourceFunc: gameData => gameData.gameStats.subLegendaryPokemonCaught.toString(),
    hidden: true
  },
  subLegendaryPokemonHatched: {
    label_key: "subLegendsHatched",
    sourceFunc: gameData => gameData.gameStats.subLegendaryPokemonHatched.toString(),
    hidden: true
  },
  legendaryPokemonSeen: {
    label_key: "legendsSeen",
    sourceFunc: gameData => gameData.gameStats.legendaryPokemonSeen.toString(),
    hidden: true
  },
  legendaryPokemonCaught: {
    label_key: "legendsCaught",
    sourceFunc: gameData => gameData.gameStats.legendaryPokemonCaught.toString(),
    hidden: true
  },
  legendaryPokemonHatched: {
    label_key: "legendsHatched",
    sourceFunc: gameData => gameData.gameStats.legendaryPokemonHatched.toString(),
    hidden: true
  },
  mythicalPokemonSeen: {
    label_key: "mythicalsSeen",
    sourceFunc: gameData => gameData.gameStats.mythicalPokemonSeen.toString(),
    hidden: true
  },
  mythicalPokemonCaught: {
    label_key: "mythicalsCaught",
    sourceFunc: gameData => gameData.gameStats.mythicalPokemonCaught.toString(),
    hidden: true
  },
  mythicalPokemonHatched: {
    label_key: "mythicalsHatched",
    sourceFunc: gameData => gameData.gameStats.mythicalPokemonHatched.toString(),
    hidden: true
  },
  shinyPokemonSeen: {
    label_key: "shiniesSeen",
    sourceFunc: gameData => gameData.gameStats.shinyPokemonSeen.toString(),
    hidden: true
  },
  shinyPokemonCaught: {
    label_key: "shiniesCaught",
    sourceFunc: gameData => gameData.gameStats.shinyPokemonCaught.toString(),
    hidden: true
  },
  shinyPokemonHatched: {
    label_key: "shiniesHatched",
    sourceFunc: gameData => gameData.gameStats.shinyPokemonHatched.toString(),
    hidden: true
  },
  pokemonFused: {
    label_key: "pokemonFused",
    sourceFunc: gameData => gameData.gameStats.pokemonFused.toString(),
    hidden: true
  },
  trainersDefeated: {
    label_key: "trainersDefeated",
    sourceFunc: gameData => gameData.gameStats.trainersDefeated.toString(),
  },
  eggsPulled: {
    label_key: "eggsPulled",
    sourceFunc: gameData => gameData.gameStats.eggsPulled.toString(),
    hidden: true
  },
  rareEggsPulled: {
    label_key: "rareEggsPulled",
    sourceFunc: gameData => gameData.gameStats.rareEggsPulled.toString(),
    hidden: true
  },
  epicEggsPulled: {
    label_key: "epicEggsPulled",
    sourceFunc: gameData => gameData.gameStats.epicEggsPulled.toString(),
    hidden: true
  },
  legendaryEggsPulled: {
    label_key: "legendaryEggsPulled",
    sourceFunc: gameData => gameData.gameStats.legendaryEggsPulled.toString(),
    hidden: true
  },
  manaphyEggsPulled: {
    label_key: "manaphyEggsPulled",
    sourceFunc: gameData => gameData.gameStats.manaphyEggsPulled.toString(),
    hidden: true
  },
};

export default class HGameStatsUiHandler extends HUiHandler {
  ui:HTMLDialog;

  constructor(scene: TextBattleScene, mode: Mode | null = null) {
    super(scene);
  }
  init(){
    if(!this.ui){
      this.ui = new HTMLDialog(()=>{
        this.clear();
        this.ui.hide();
        this.scene.ui.revertMode();
      }).setTitle(i18next.t("gameStatsUiHandler:stats"))
      .setInnerHTML(`
        <div class="game-stats">
          ${
            new Array(18).fill(null).map((_, s) => {
              return `<div class="stat"><div class="stat-label"></div><div class="stat-value"></div></div>`
            }).join("")
          }
        </div>
        `)
    }
  }
  setup() {

  }

  show(args: any[]): boolean {
    super.show(args);

    this.init();

    this.setCursor(0);

    this.updateStats();

    this.ui.show();

    return true;
  }

  updateStats(): void {
    const statKeys = Object.keys(displayStats);
    statKeys.forEach((key, s) => {
      const stat = displayStats[key] as DisplayStat;
      const value = stat.sourceFunc!(this.scene.gameData); // TODO: is this bang correct?

      const ui = this.ui.findObject(`.stat:nth-child(${s+1})`);
      ui.findObject(".stat-label").setText(!stat.hidden || isNaN(parseInt(value)) || parseInt(value) ? i18next.t(`gameStatsUiHandler:${stat.label_key}`) : "???");
      ui.findObject(".stat-value").setText(value);
    });
  }

  setCursor(cursor: integer): boolean {
    return true;
  }

  clear() {
    super.clear();
    this.ui.getDOM()?.remove();
  }
}

export function initStatsKeys() {
  const statKeys = Object.keys(displayStats);

  for (const key of statKeys) {
    if (typeof displayStats[key] === "string") {
      let label = displayStats[key] as string;
      let hidden = false;
      if (label.endsWith("?")) {
        label = label.slice(0, -1);
        hidden = true;
      }
      displayStats[key] = {
        label_key: label,
        sourceFunc: gameData => gameData.gameStats[key].toString(),
        hidden: hidden
      };
    } else if (displayStats[key] === null) {
      displayStats[key] = {
        sourceFunc: gameData => gameData.gameStats[key].toString()
      };
    }
    if (!(displayStats[key] as DisplayStat).label_key) {
      const splittableKey = key.replace(/([a-z]{2,})([A-Z]{1}(?:[^A-Z]|$))/g, "$1_$2");
      (displayStats[key] as DisplayStat).label_key = Utils.toReadableString(`${splittableKey[0].toUpperCase()}${splittableKey.slice(1)}`);
    }
  }
}
