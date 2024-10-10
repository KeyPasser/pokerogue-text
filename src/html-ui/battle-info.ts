import { getTierColor, HTMLContainer, HTMLObject } from "./Root";
import { Type, getTypeRgb } from "../data/type";
import { StatusEffect } from "#app/enums/status-effect.js";
import TextBattleScene from "#app/text-battle-scene.js";
import * as Utils from "../utils";
import Pokemon, { EnemyPokemon, PlayerPokemon } from "#app/field/pokemon";
import { getGenderSymbol } from "#app/data/gender.js";
import i18next from "i18next";
import { getLevelRelExp, getLevelTotalExp } from "#app/data/exp";
import "./battle-info-style.scss"
import { getIVsName, setPokemonNameComponent } from "./widgets/pokeName";
import { TextStyle } from "#app/ui/text.js";
import { ShinyColor } from "./Constants";
import { checkPokemonMissing, getPokeTypeColor } from "./util";
import { Stat } from "#app/enums/stat";

const HStatusEffect = {
  [StatusEffect.NONE]: "",
  [StatusEffect.POISON]: "PSN",
  [StatusEffect.TOXIC]: "TOX",
  [StatusEffect.PARALYSIS]: "PAR",
  [StatusEffect.SLEEP]: "SLP",
  [StatusEffect.FREEZE]: "FRZ",
  [StatusEffect.BURN]: "BRN",
  [StatusEffect.FAINT]: "FNT",
}

const padLevel = (level: integer) => {
  if (level >= 0) {
    return "+" + level;
  }
  return level.toString();
};

export class HPokeBattleInfo extends HTMLContainer {
  private baseY: number;

  private player: boolean;
  private mini: boolean;
  private boss: boolean;
  private bossSegments: integer;
  private offset: boolean;
  private lastName: string | null;
  private lastTeraType: Type;
  private lastStatus: StatusEffect;
  private lastHp: integer;
  private lastMaxHp: integer;
  private lastHpFrame: string | null;
  private lastExp: integer;
  private lastLevelExp: integer;
  private lastLevel: integer;
  private lastLevelCapped: boolean;
  private lastStats: string;

  private lastBattleStats: string;
  public expMaskRect = new HTMLContainer(0, 0);

  private statOrder: Stat[];
  private readonly statOrderPlayer = [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.ACC, Stat.EVA, Stat.SPD ];
  private readonly statOrderEnemy = [ Stat.HP, Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.ACC, Stat.EVA, Stat.SPD ];

  container:HTMLDivElement;

  constructor(scene: TextBattleScene, x: number, y: number, player: boolean, container: HTMLDivElement) {
    super('unset', 'unset')

    this.scene = scene;

    this.player = player;
    this.mini = !player;
    this.boss = false;
    this.offset = false;
    this.lastName = null;
    this.lastTeraType = Type.UNKNOWN;
    this.lastStatus = StatusEffect.NONE;
    this.lastHp = -1;
    this.lastMaxHp = -1;
    this.lastHpFrame = null;
    this.lastExp = -1;
    this.lastLevelExp = -1;
    this.lastLevel = -1;

    this.dom.innerHTML = `<div class="poke-info ${player && "player"}">
            <div class="left">
                <div class="line1">
                    <div class="poke-name"></div>
                    <div class="poke-gender"></div>
                    <div class="poke-tera iconfont icon-tera"></div>
                    <div class="poke-fusion iconfont icon-jiyin"></div>
                    <div class="iconfont icon-champion"></div>
                    <div class="poke-level">
                        <span>lv.</span>
                        <span class="level-number"></span>
                    </div>
                    <div class="poke-generation"></div>
                </div>
                <div class="line2">
                  <div class="type-container">
                      <div class="type1 iconfont"></div>
                      <div class="type2 iconfont"></div>
                      <div class="type3 iconfont"></div>
                    </div>
                    <div class="iconfont icon-pokeball"></div>
                    <div class="poke-status iconfont"></div>
                    <div class="poke-hp">
                        <div class="hpNumber">
                            <span class="cur-hp"></span>
                            <span>/</span>
                            <span class="max-hp"></span>
                        </div>
                        <div class="dividers"></div>
                        <div class="poke-percentage"></div>
                    </div>
                </div>
                <div class="player-poke">
                    <div class="battle-stat">
                       <span class="iconfont bs0">${getIVsName(0)}+0</span>
                       <span class="iconfont bs1">${getIVsName(1)}+0</span>
                       <span class="iconfont bs2">${getIVsName(2)}+0</span>
                       <span class="iconfont bs3">${getIVsName(3)}+0</span>
                       <span class="iconfont bs4">${getIVsName(4)}+0</span>
                       <span class="iconfont bs5">${getIVsName(5)}+0</span>
                       <span class="iconfont bs6">${getIVsName(6)}+0</span>
                    </div>
                    <div class="poke-exp">
                        <div class="poke-percentage"></div>
                    </div>
                </div>
            </div>
        </div>`;

    this.setVisible(false);
    container.append(this.dom);

    this.container = container;

    this.statOrder = this.player ? this.statOrderPlayer : this.statOrderEnemy; // this tells us whether or not to use the player or enemy battle stat order
  }

  getStatsValueContainer(): any {
    return {
      list: []
    };
  }
  updateDomText(selector, text: string) {
    const dom = this.dom.querySelector(selector) as HTMLDivElement;
    dom.textContent = text;
  }
  initInfo(pokemon: Pokemon) {
    this.updateNameText(pokemon);

    this.name = pokemon.getNameToRender();

    this.updateDomText(".poke-gender", getGenderSymbol(pokemon.gender));

    this.lastTeraType = pokemon.getTeraType();

    const tera = this.dom.querySelector(".poke-tera") as HTMLDivElement;
    tera.title = `${Utils.toReadableString(Type[this.lastTeraType])} Terastallized`;
    tera.style.display = (this.lastTeraType !== Type.UNKNOWN) ? "block" : "none";

    const isFusion = pokemon.isFusion();

    const fusion = this.dom.querySelector(".poke-fusion") as HTMLDivElement;
    fusion.title = `${pokemon.species.getName(pokemon.formIndex)}/${pokemon.fusionSpecies?.getName(pokemon.fusionFormIndex)}`
    fusion.style.display = (isFusion) ? "block" : "none";

    const doubleShiny = isFusion && pokemon.shiny && pokemon.fusionShiny;
    const baseVariant = !doubleShiny ? pokemon.getVariant() : pokemon.variant;

    let dom;

    
    dom = this.findObject(".icon-champion");

    if (pokemon.scene.gameMode.isClassic) {
      if (pokemon.scene.gameData.starterData[pokemon.species.getRootSpeciesId()].classicWinCount > 0 && pokemon.scene.gameData.starterData[pokemon.species.getRootSpeciesId(true)].classicWinCount > 0) {
        dom.setAlpha(1)
      } else{
        dom.setAlpha(0)
      }
    }else{
      dom.setAlpha(0)
    }

    if (!this.player) {
      //i18next.t("battleInfo:generation", { generation: i18next.t(`starterSelectUiHandler:gen${pokemon.species.generation}`) })

      const dexEntry = pokemon.scene.gameData.dexData[pokemon.species.speciesId];

      dom = this.dom.querySelector(".icon-pokeball") as HTMLDivElement;
      dom.style.display = (dexEntry.caughtAttr) ? "block" : "none";

      if (checkPokemonMissing(pokemon)) {
        dom.classList.add("missing");
      }else{
        dom.classList.remove("missing");
      }

      if (this.boss) {
        this.updateBossSegmentDividers(pokemon as EnemyPokemon);
      }
    }

    if (this.player) {
      this.findObject(".icon-pokeball").setVisible(false);
      this.setHpNumbers(pokemon.hp, pokemon.getMaxHp());
    }
    this.lastHp = pokemon.hp;
    this.lastMaxHp = pokemon.getMaxHp();

    this.setLevel(pokemon.level);
    this.lastLevel = pokemon.level;

    const types = pokemon.getTypes(true);

    dom = this.dom.querySelector(".type1") as HTMLDivElement;
    dom.className="type1 iconfont icon-pt-"+types[0];
    dom.style.color = "#"+getPokeTypeColor(types[0]).toString(16);

    dom = this.dom.querySelector(".type2") as HTMLDivElement;
    if (types.length > 1) {
      dom.className="type2 iconfont icon-pt-"+types[1];
      dom.style.color = "#"+getPokeTypeColor(types[1]).toString(16);
    } else {
      dom.style.display = "none";
    }

    dom = this.dom.querySelector(".type3") as HTMLDivElement;
    if (types.length > 2) {
      dom.className="type3 iconfont icon-pt-"+types[2];
      dom.style.color = "#"+getPokeTypeColor(types[2]).toString(16);
    }
    else {
      dom.style.display = "none";
    }

    dom = this.dom.querySelector(".player-poke") as HTMLDivElement;
    if (this.player) {
      dom = this.dom.querySelector(".poke-percentage") as HTMLDivElement;
      dom.style.left = (pokemon.levelExp / getLevelTotalExp(pokemon.level, pokemon.species.growthRate)) + "%";

      this.lastExp = pokemon.exp;
      this.lastLevelExp = pokemon.levelExp;

      this.findObject(".hpNumber").setAlpha(1);
      this.findObject(".poke-exp").setAlpha(1);
    } else {
      this.findObject(".hpNumber").setAlpha(0);
      this.findObject(".poke-exp").setAlpha(0);
    }

    const battleStats = [0,0,0,0,0,0,0];
    const stats = this.statOrder.map(() => 0);

    this.lastStats = stats.join("");
    this.updateStats(stats);

    const gen = i18next.t("challenges:singleGeneration.gen_" + pokemon.species.generation);
    this.findObject(".poke-generation")
    .setText(gen)
    .setTitle(i18next.t("battleInfo:generation",{generation:gen}))
  }

  getTextureName(): string {
    return `pbinfo_${this.player ? "player" : "enemy"}${!this.player && this.boss ? "_boss" : this.mini ? "_mini" : ""}`;
  }

  setMini(mini: boolean): void {
    if (this.mini === mini) {
      return;
    }

    this.mini = mini;

    if (this.player) {
      this.y -= 12 * (mini ? 1 : -1);
      this.baseY = this.y;
    }

  }

  toggleStats(visible: boolean): void {

  }

  updateBossSegments(pokemon: EnemyPokemon): void {
    const boss = !!pokemon.bossSegments;

    if (boss !== this.boss) {
      this.boss = boss;
    }

    this.bossSegments = boss ? pokemon.bossSegments : 0;
    this.updateBossSegmentDividers(pokemon);
  }

  updateBossSegmentDividers(pokemon: EnemyPokemon): void {

    if (this.boss && this.bossSegments > 1) {
      const uiTheme = (this.scene as TextBattleScene).uiTheme;
      const maxHp = pokemon.getMaxHp();

      let dividers = ""
      for (let s = 0; s < this.bossSegments; s++) {
        dividers += `<div class="${pokemon.bossSegmentIndex > s ? "guad" : ""}"></div>`
      }

      let dom = this.dom.querySelector(".poke-hp .dividers") as HTMLDivElement;
      dom.innerHTML = dividers;
    }
  }

  setOffset(offset: boolean): void {
    if (this.offset === offset) {
      return;
    }

    this.offset = offset;

    this.x += 10 * (this.offset === this.player ? 1 : -1);
    this.y += 27 * (this.offset ? 1 : -1);
    this.baseY = this.y;
  }

  updateInfo(pokemon: Pokemon, instant?: boolean): Promise<void> {
    return new Promise(resolve => {
      if (!this.scene) {
        return resolve();
      }

      const nameUpdated = this.lastName !== pokemon.getNameToRender();

      if (nameUpdated) {
        this.updateNameText(pokemon);
      }

      const teraType = pokemon.getTeraType();
      const teraTypeUpdated = true;

      if (teraTypeUpdated) {
        const tera = this.dom.querySelector(".poke-tera") as HTMLDivElement;
        tera.title = `${Utils.toReadableString(Type[teraType])} Terastallized`;
        tera.style.display = (this.lastTeraType !== Type.UNKNOWN) ? "block" : "none";

        this.lastTeraType = teraType;
      }

      if (nameUpdated || teraTypeUpdated) {
        const fusion = this.dom.querySelector(".poke-fusion") as HTMLDivElement;
        fusion.title = `${pokemon.species.getName(pokemon.formIndex)}/${pokemon.fusionSpecies?.getName(pokemon.fusionFormIndex)}`
        fusion.style.display = (pokemon.fusionSpecies) ? "block" : "none";
      }

      if (this.lastStatus !== (pokemon.status?.effect || StatusEffect.NONE)) {
        this.lastStatus = pokemon.status?.effect || StatusEffect.NONE;

        let dom = this.dom.querySelector(".poke-status") as HTMLDivElement;

        if (this.lastStatus !== StatusEffect.NONE) {
          switch(this.lastStatus){
            case StatusEffect.POISON:
              dom.style.color = "#a040a0";
              dom.innerHTML = "&#xe639;";
              break;
            case StatusEffect.TOXIC:
              dom.style.color = "#a040a0";
              dom.innerHTML = "&#xe639;";
              break;
            case StatusEffect.PARALYSIS:
              dom.style.color = "#f8d030";
              dom.innerHTML = "&#xe64e;";
              break;
            case StatusEffect.SLEEP:
              dom.style.color = "#a8a878";
              dom.innerHTML = "slp";
              break;
            case StatusEffect.FREEZE:
              dom.style.color = "#98d8d8";
              dom.innerHTML = "&#xe613;";
              break;
            case StatusEffect.BURN:
              dom.style.color = "#f08030";
              dom.innerHTML = "&#xe621;";
              break;
          }
        } else {
          dom.style.color = "#111";
          dom.innerHTML = "";
        }
      }

      const types = pokemon.getTypes(true);
      let dom = this.dom.querySelector(".type1") as HTMLDivElement;
      dom.className="type1 iconfont icon-pt-"+types[0];
      dom.style.color = "#"+getPokeTypeColor(types[0]).toString(16);
  
      dom = this.dom.querySelector(".type2") as HTMLDivElement;
      if (types.length > 1) {
        dom.className="type2 iconfont icon-pt-"+types[1];
        dom.style.color = "#"+getPokeTypeColor(types[1]).toString(16);
      } else {
        dom.style.display = "none";
      }
  
      dom = this.dom.querySelector(".type3") as HTMLDivElement;
      if (types.length > 2) {
        dom.className="type2 iconfont icon-pt-"+types[2];
        dom.style.color = "#"+getPokeTypeColor(types[2]).toString(16);
      }
      else {
        dom.style.display = "none";
      }

      const updatePokemonHp = () => {

        dom = this.dom.querySelector(".poke-hp .poke-percentage") as HTMLDivElement;
        dom.style.width = `${(pokemon.hp / pokemon.getMaxHp()) * 100}%`;

        if (!this.player) {
          this.lastHp = pokemon.hp;
        }
        this.lastMaxHp = pokemon.getMaxHp();

        this.setHpNumbers(pokemon.hp, pokemon.getMaxHp());
      };

      if (this.player) {
        const isLevelCapped = pokemon.level >= (this.scene as TextBattleScene).getMaxExpLevel();

        if ((this.lastExp !== pokemon.exp || this.lastLevel !== pokemon.level)) {
          const originalResolve = resolve;

          const durationMultipler = Math.max(Phaser.Tweens.Builders.GetEaseFunction("Cubic.easeIn")(1 - (Math.min(pokemon.level - this.lastLevel, 10) / 10)), 0.1);

          resolve = () => this.updatePokemonExp(pokemon, false, durationMultipler).then(() => originalResolve());

        } else if (isLevelCapped !== this.lastLevelCapped) {
          this.setLevel(pokemon.level);
        }

        this.lastLevelCapped = isLevelCapped;

        const switchPokes = Array.from(this.container.children)
        .filter((v,i)=>{
          const poke = this.scene.getParty()[i];
          if(!poke)return false;
          
          let pokeName = poke.name;
          if(poke.nickname){
            pokeName = decodeURIComponent(escape(atob(poke.nickname)));
          }

          return v.querySelector(".poke-name")?.textContent!=pokeName
        });

        if (switchPokes.length == 2) {
            switchPokes[1]&&switchPokes[0].replaceWith(switchPokes[1]);
            switchPokes[0]&&this.container.append(switchPokes[0]);
        }
      }

        updatePokemonHp();
        this.setLevel(pokemon.level);
        this.lastLevel = pokemon.level;

      const stats = pokemon.getStatStages();
      const statsStr = stats.join("");

      if (this.lastStats !== statsStr) {
        this.updateStats(stats);
        this.lastStats = statsStr;
      }

      resolve();
    });
  }

  updateStats(stats: integer[]): void {
    stats.map((s, i) => {
      i=i+1;
      if (i !== Stat.HP) {
        const level = s;
        const tier = Math.abs(level) - 1;
        const color = getTierColor(tier);
        this.findObject(".bs" + i).setText(`${getIVsName(i)}${padLevel(level)}`).setColor(color);
      }
    });
  }

  updateNameText(pokemon: Pokemon): void {
    setPokemonNameComponent(pokemon,this.findObject(".poke-name"));

    this.lastName = pokemon.getNameToRender();
  }

  updatePokemonExp(pokemon: Pokemon, instant?: boolean, levelDurationMultiplier: number = 1): Promise<void> {
    return new Promise(resolve => {
      const levelUp = this.lastLevel < pokemon.level;
      const relLevelExp = getLevelRelExp(this.lastLevel + 1, pokemon.species.growthRate);
      const levelExp = levelUp ? relLevelExp : pokemon.levelExp;
      let ratio = relLevelExp ? levelExp / relLevelExp : 0;
      if (this.lastLevel >= (this.scene as TextBattleScene).getMaxExpLevel(true)) {
        if (levelUp) {
          ratio = 1;
        } else {
          ratio = 0;
        }
        instant = true;
      }
      const durationMultiplier = Phaser.Tweens.Builders.GetEaseFunction("Sine.easeIn")(1 - (Math.max(this.lastLevel - 100, 0) / 150));
      const duration = this.visible && !instant ? (((levelExp - this.lastLevelExp) / relLevelExp) * 1650) * durationMultiplier * levelDurationMultiplier : 0;
      if (ratio === 1) {
        this.lastLevelExp = 0;
        this.lastLevel++;
      } else {
        this.lastExp = pokemon.exp;
        this.lastLevelExp = pokemon.levelExp;
      }

      if (ratio === 1) {
        (this.scene as TextBattleScene).playSound("level_up");
        this.setLevel(this.lastLevel);
        this.scene.time.delayedCall(500 * levelDurationMultiplier, () => {
          this.updateInfo(pokemon, instant).then(() => resolve());
        });
        return;
      }
      resolve();
    });
  }

  setLevel(level: integer): void {
    const isCapped = level >= (this.scene as TextBattleScene).getMaxExpLevel();
    const levelStr = level.toString();

    let dom = this.findObject(".level-number");
    dom.setText(levelStr);
    if(isCapped){
      dom.setColor(TextStyle.PARTY_RED);
    }else{
      dom.setColor(ShinyColor.Variant0);
    }
  }

  setHpNumbers(hp: integer, maxHp: integer): void {
    if (!this.player || !this.scene) {
      return;
    }
    let dom = this.dom.querySelector(".cur-hp") as HTMLDivElement;
    dom.textContent = hp.toString();

    dom = this.dom.querySelector(".max-hp") as HTMLDivElement;
    dom.textContent = maxHp.toString();
  }

  /**
   * Request the flyoutMenu to toggle if available and hides or shows the effectiveness window where necessary
   */
  toggleFlyout(visible: boolean): void {

  }

  /**
   * Show or hide the type effectiveness multiplier window
   * Passing undefined will hide the window
   */
  updateEffectiveness(effectiveness?: string) {
    if (this.player) {
      return;
    }

  }

  getBaseY(): number {
    return this.baseY;
  }

  resetY(): void {
  }
}
