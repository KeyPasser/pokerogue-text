import BattleScene, { starterColors } from "../battle-scene";

import * as Utils from "../utils";
import { PlayerPokemon, PokemonMove } from "../field/pokemon";
import { getStarterValueFriendshipCap, speciesStarters } from "../data/pokemon-species";
import { argbFromRgba } from "@material/material-color-utilities";
import { Type, getTypeRgb } from "../data/type";
import Move, { MoveCategory } from "../data/move";
import { getPokeballAtlasKey } from "../data/pokeball";
import { getGenderColor, getGenderSymbol } from "../data/gender";
import { getLevelRelExp, getLevelTotalExp } from "../data/exp";
import { PokemonHeldItemModifier } from "../modifier/modifier";
import { StatusEffect } from "../data/status-effect";
import { getBiomeName } from "../data/biomes";
import { Nature, getNatureName, getNatureStatMultiplier } from "../data/nature";
import { loggedInUser } from "../account";
import { Variant, getVariantTint } from "#app/data/variant";
import { Button } from "#enums/buttons";
import { Ability, allAbilities } from "../data/ability.js";
import i18next from "i18next";
import { modifierSortFunc } from "../modifier/modifier";
import { PlayerGender } from "#enums/player-gender";
import HUiHandler from "./PhaseUI/HUiHandler";
import { SummaryUiMode } from "#app/ui/summary-ui-handler.js";
import TextBattleScene from "#app/html-ui/text-battle-scene";
import { HTMLContainer, HTMLDialog } from "./Root";
import { getBBCodeFrag, getTextColor, TextStyle } from "#app/ui/text.js";
import { Mode } from "./UI";
import "./summary-ui-handler.scss"
import { bbcodeToHtml } from "./TextPlugin";
import SummaryTemplate from "virtual:summary.hs";
import { ShinyColor } from "./Constants";
import { setPokemonNameComponent } from "./widgets/pokeName";
import { getStatKey, PERMANENT_STATS, Stat } from "#app/enums/stat.js";

enum Page {
  PROFILE,
  STATS,
  MOVES
}


export default class HSummaryUiHandler extends HUiHandler {
  private summaryUiMode: SummaryUiMode;

  private numberText: HTMLContainer;
  private nameText: HTMLContainer;
  private splicedIcon: HTMLContainer;
  private pokeball: HTMLContainer;
  private levelText: HTMLContainer;
  private genderText: HTMLContainer;
  private shinyIcon: HTMLContainer;
  private fusionShinyIcon: HTMLContainer;
  private candyIcon: HTMLContainer;
  private candyCountText: HTMLContainer;
  private championRibbon: HTMLContainer;
  private statusContainer: HTMLContainer;
  private status: HTMLContainer;

  private pokemon: PlayerPokemon | null;
  private playerParty: boolean;
  /**This is set to false when checking the summary of a freshly caught Pokemon as it is not part of a player's party yet but still needs to display its items**/
  private newMove: Move | null;
  private moveSelectFunction: Function | null;
  private transitioning: boolean;
  private statusVisible: boolean;
  private moveEffectsVisible: boolean;

  private moveSelect: boolean;
  private moveCursor: integer;
  private selectedMoveIndex: integer;
  private selectCallback: Function | null;
  private tabInited: { [key: integer]: boolean } = {};
  public onClose: Function | null;

  private dom: HTMLDialog = new HTMLDialog(() => {
    if(this.onClose){
      this.onClose()
    }else{
      this.processInput(Button.CANCEL);
    }
  }).setTitle(i18next.t("pokemonSummary:pokemonInfo"));


  constructor(scene: TextBattleScene) {
    super(scene);//, Mode.SUMMARY
  }

  setup() {
  }

  init() {
    const ui = this.dom;
    this.dom.setName("summary-ui");

    const moveLabel = i18next.t("pokemonSummary:powerAccuracyCategory") as string;
    const moveLabelArray = moveLabel.split("\n");

    ui.getDOM().innerHTML = SummaryTemplate({
      candy:i18next.t("filterBar:sortByCandies"),
      power:moveLabelArray[0],
      accuracy:moveLabelArray[1],
      category:moveLabelArray[2],
    })
    ui.getDOM().addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      if (["status-tab", "stats-tab", "move-tab"].includes(target.id)) {
        ui.getDOM().querySelectorAll("#poke-summary-tab>*").forEach((tab) => {
          tab.classList.remove("active");
        })
        ui.getDOM().querySelectorAll("#tab-body>*").forEach((tab) => {
          tab.classList.remove("active");
        })
        target.classList.add("active")
        switch (target.id) {
          case "status-tab":
            this.populatePageContainer(this.cursor=0);
            ui.find("#status").classList.add('active');
            break;
          case 'stats-tab':
            this.populatePageContainer(this.cursor=1);
            ui.find("#stats").classList.add('active');
            break;
          case 'move-tab':
            this.populatePageContainer(this.cursor=2);
            ui.find("#move").classList.add('active');
            break;
        }
      }

      if (this.moveSelect) {
        let move: HTMLElement | null = target;

        while (move && move.id !== "summary-ui" && move.id.indexOf("move") === -1) {
          move = move.parentElement;
        }

        if (!move || move.id === "summary-ui") return;

        const moveIndex = parseInt(move.id.replace("move", ""));
        if (!isNaN(moveIndex) && moveIndex < 4) {
          this.setCursor(moveIndex);
          this.processInput(Button.ACTION);
        }
      }

      switch (target.id) {
        case 'up':
          this.processInput(Button.UP);
          break;
        case 'down':
          this.processInput(Button.DOWN);
      }
    })

    let hc = ui.findObject("#number");
    hc.setText("0000")
    hc.setColor(TextStyle.SUMMARY)
    this.numberText = hc;

    hc = ui.findObject("#name");
    hc.setColor(TextStyle.SUMMARY)
    this.nameText = hc;

    hc = ui.findObject("#spliced");
    this.splicedIcon = hc;
    this.splicedIcon.setVisible(false);

    this.shinyIcon = ui.findObject("#shiny");
    this.shinyIcon.setVisible(false);

    this.fusionShinyIcon = ui.findObject("#shiny_star_2");
    this.fusionShinyIcon.setVisible(false);
    this.fusionShinyIcon.setOrigin(0, 0);

    this.pokeball = ui.findObject("#pb");

    this.candyIcon = ui.findObject("#candy");
    this.candyCountText = ui.findObject("#candy-count");

    this.championRibbon = ui.findObject("#champion_ribbon");
    this.championRibbon.setVisible(false);

    this.levelText = ui.findObject("#level");
    this.levelText.setColor(TextStyle.SUMMARY_ALT);

    this.genderText = ui.findObject("#gender");
    this.genderText.setColor(TextStyle.SUMMARY_ALT);


    this.status = ui.findObject("#statuses");

    const moveDetails = i18next.t("pokemonSummary:powerAccuracyCategory") as string;
    const moveDetailsArray = moveDetails.split("\n");

    const moveContainer = ui.findObject("#move").getDOM()
    moveContainer.querySelectorAll("#details #power span:first-child").forEach((span) => {
      span.innerHTML = moveDetailsArray[0];
    });

    moveContainer.querySelectorAll("#details #accuracy span:first-child").forEach((span) => {
      span.innerHTML = moveDetailsArray[1];
    });
    moveContainer.querySelectorAll("#details #category span:first-child").forEach((span) => {
      span.innerHTML = moveDetailsArray[2];
    });
  }
  hideSelectors() {
    this.dom.findObject('.poke-select').setAlpha(0);
  }
  getPageKey(page?: integer) {
    if (page === undefined) {
      page = this.cursor;
    }
    return `summary_${Page[page].toLowerCase()}`;
  }

  show(args: any[]): boolean {
    if (!this.numberText) this.init();
    this.tabInited = {}
    /* args[] information
    * args[0] : the Pokemon displayed in the Summary-UI
    * args[1] : the summaryUiMode (defaults to 0)
    * args[2] : the start page (defaults to Page.PROFILE)
    * args[3] : contains the function executed when the user exits out of Summary UI
    * args[4] : optional boolean used to determine if the Pokemon is part of the player's party or not (defaults to true, necessary for PR #2921 to display all relevant information)
    */

    this.pokemon = args[0] as PlayerPokemon;
    this.summaryUiMode = args.length > 1 ? args[1] as SummaryUiMode : SummaryUiMode.DEFAULT;
    this.playerParty = args[4] ?? true;

    this.cursor = args[1]||0;

    //const colorScheme = starterColors[this.pokemon.species.getRootSpeciesId()];
    //this.candyIcon.setTint(argbFromRgba(Utils.rgbHexToRgba(colorScheme[0])));

    this.numberText.setText(Utils.padInt(this.pokemon.species.speciesId, 4));
    this.numberText.setColor(getTextColor(!this.pokemon.isShiny() ? TextStyle.SUMMARY : TextStyle.SUMMARY_GOLD));
    this.numberText.setShadowColor(getTextColor(!this.pokemon.isShiny() ? TextStyle.SUMMARY : TextStyle.SUMMARY_GOLD, true));

    this.nameText.setText(this.pokemon.getNameToRender());

    const isFusion = this.pokemon.isFusion();
    this.splicedIcon.setVisible(isFusion);

    if (this.splicedIcon.visible) {
      // this.splicedIcon.on("pointerover", () => (this.scene as BattleScene).ui.showTooltip("", `${this.pokemon?.species.getName(this.pokemon.formIndex)}/${this.pokemon?.fusionSpecies?.getName(this.pokemon?.fusionFormIndex)}`, true));
      // this.splicedIcon.on("pointerout", () => (this.scene as BattleScene).ui.hideTooltip());
    }

    if (this.scene.gameData.starterData[this.pokemon.species.getRootSpeciesId()].classicWinCount > 0 && this.scene.gameData.starterData[this.pokemon.species.getRootSpeciesId(true)].classicWinCount > 0) {
      this.championRibbon.setVisible(true);
    } else {
      this.championRibbon.setVisible(false);
    }

    let currentFriendship = this.scene.gameData.starterData[this.pokemon.species.getRootSpeciesId()].friendship;
    if (!currentFriendship || currentFriendship === undefined) {
      currentFriendship = 0;
    }

    this.candyCountText.setText(`${this.scene.gameData.starterData[this.pokemon.species.getRootSpeciesId()].candyCount}`);

    setPokemonNameComponent(this.pokemon, this.nameText);

    const doubleShiny = isFusion && this.pokemon.shiny && this.pokemon.fusionShiny;

    this.fusionShinyIcon.setPosition(this.shinyIcon.x, this.shinyIcon.y);
    this.fusionShinyIcon.setVisible(doubleShiny);
    // if (isFusion) {
    //   this.fusionShinyIcon.setTint(getVariantTint(this.pokemon.fusionVariant));
    // }

    this.pokeball.setText(getPokeballAtlasKey(this.pokemon.pokeball));
    this.levelText.setText('Lv.'+this.pokemon.level.toString());
    this.genderText.setText(getGenderSymbol(this.pokemon.getGender(true)));
    this.genderText.setColor(getGenderColor(this.pokemon.getGender(true)));
    this.genderText.setShadowColor(getGenderColor(this.pokemon.getGender(true), true));

    switch (this.summaryUiMode) {
      case SummaryUiMode.DEFAULT:
        const page = args.length < 2 ? Page.PROFILE : args[2] as Page;
        this.hideMoveEffect(true);
        this.setCursor(page);
        if (args.length > 3) {
          this.selectCallback = args[3];
        }
        this.dom.findObject('.poke-select').setAlpha(1);
        break;
      case SummaryUiMode.LEARN_MOVE:
        this.newMove = args[2] as Move;
        this.moveSelectFunction = args[3] as Function;

        this.dom.findObject('.poke-select').setAlpha(0);

        this.showMoveEffect(true);
        this.setCursor(Page.MOVES);
        this.showMoveSelect();
        break;
    }

    const fromSummary = args.length >= 2;

    if (this.pokemon.status || this.pokemon.pokerus) {
      this.showStatus(!fromSummary);
      this.status.setText(this.pokemon.status ? StatusEffect[this.pokemon.status.effect].toLowerCase() : "pokerus");
    } else {
      this.hideStatus(!fromSummary);
    }

    this.populatePageContainer(this.cursor);

    const ui = this.dom;
    ui.getDOM().querySelectorAll("#poke-summary-tab>*").forEach((tab) => {
      tab.classList.remove("active");
    })
    ui.getDOM().querySelectorAll("#tab-body>*").forEach((tab) => {
      tab.classList.remove("active");
    })
    ui.findAll(".selected").forEach((dom) => dom.classList.remove("selected"));

    switch (this.cursor) {
      case 0:
        ui.find("#status").classList.add('active');
        ui.find("#status-tab").classList.add('active');
        break;
      case 1:
        ui.find("#stats").classList.add('active');
        ui.find("#stats-tab").classList.add('active');
        break;
      case 2:
        ui.find("#move").classList.add('active');
        ui.find("#move-tab").classList.add('active');
        break;
    }

    this.dom.show();

    return true;
  }

  processInput(button: Button): boolean {
    if (this.transitioning) {
      return false;
    }

    const ui = this.getUi();
    const fromPartyMode = ui.handlers[Mode.PARTY].active;
    let success = false;
    let error = false;

    if (this.moveSelect) {
      if (button === Button.ACTION) {
        if (this.pokemon && this.moveCursor < this.pokemon.moveset.length) {
          if (this.summaryUiMode === SummaryUiMode.LEARN_MOVE) {
            this.moveSelectFunction && this.moveSelectFunction(this.moveCursor);
          } else {
            if (this.selectedMoveIndex === -1) {
              this.selectedMoveIndex = this.moveCursor;
              this.setCursor(this.moveCursor);
            } else {
              if (this.selectedMoveIndex !== this.moveCursor) {

              }

              this.selectedMoveIndex = -1;
            }
          }
          success = true;
        } else if (this.moveCursor === 4) {
          return this.processInput(Button.CANCEL);
        } else {
          error = true;
        }
      } else if (button === Button.CANCEL) {
        this.hideMoveSelect();
        success = true;
      } else {
        switch (button) {
          case Button.UP:
            success = this.setCursor(this.moveCursor ? this.moveCursor - 1 : 4);
            break;
          case Button.DOWN:
            success = this.setCursor(this.moveCursor < 4 ? this.moveCursor + 1 : 0);
            break;
          case Button.LEFT:
            this.moveSelect = false;
            this.setCursor(Page.STATS);
            if (this.summaryUiMode === SummaryUiMode.LEARN_MOVE) {
              this.hideMoveEffect();
              this.destroyBlinkCursor();
              success = true;
              break;
            } else {
              this.hideMoveSelect();
              success = true;
              break;
            }
        }
      }
    } else {
      if (button === Button.ACTION) {
        if (this.cursor === Page.MOVES) {
          this.showMoveSelect();
          success = true;
        } else if (this.cursor === Page.PROFILE && this.pokemon?.hasPassive()) {
        }
      } else if (button === Button.CANCEL) {
        if (this.summaryUiMode === SummaryUiMode.LEARN_MOVE) {
          this.hideMoveSelect();
        } else {
          if (this.selectCallback instanceof Function) {
            const selectCallback = this.selectCallback;
            this.selectCallback = null;
            selectCallback();
          }

          if (!fromPartyMode) {
            ui.setMode(Mode.MESSAGE);
          } else {
            ui.setMode(Mode.PARTY);
          }
        }
        success = true;
      } else {
        const pages = Utils.getEnumValues(Page);
        switch (button) {
          case Button.UP:
          case Button.DOWN:
            if (this.summaryUiMode === SummaryUiMode.LEARN_MOVE) {
              break;
            } else if (!fromPartyMode) {
              break;
            }
            const isDown = button === Button.DOWN;
            const party = this.scene.getParty();
            const partyMemberIndex = this.pokemon ? party.indexOf(this.pokemon) : -1;
            if ((isDown && partyMemberIndex < party.length - 1) || (!isDown && partyMemberIndex)) {
              const page = this.cursor;
              this.clear();
              this.show([party[partyMemberIndex + (isDown ? 1 : -1)], this.summaryUiMode, page]);
            }
            break;
          case Button.LEFT:
            if (this.cursor) {
              success = this.setCursor(this.cursor - 1);
            }
            break;
          case Button.RIGHT:
            if (this.cursor < pages.length - 1) {
              success = this.setCursor(this.cursor + 1);
              if (this.summaryUiMode === SummaryUiMode.LEARN_MOVE && this.cursor === Page.MOVES) {
                this.moveSelect = true;
              }
            }
            break;
        }
      }
    }

    if (success) {
      ui.playSelect();
    } else if (error) {
      ui.playError();
    }

    return success || error;
  }

  setCursor(cursor: integer, overrideChanged: boolean = false): boolean {
    let changed: boolean = overrideChanged || this.moveCursor !== cursor;

    if (this.moveSelect) {
      this.moveCursor = cursor;

      const selectedMove = this.getSelectedMove();

      if (selectedMove) {

        this.showMoveEffect();
      } else {
        this.hideMoveEffect();
      }

    } else {
      changed = this.cursor !== cursor;
      if (changed) {
        this.cursor = cursor;

        this.getUi().hideTooltip();
      }
    }

    return changed;
  }

  populatePageContainer(tab: integer = 0) {
    const ui = this.dom;
    if (this.tabInited[tab]) return;
    switch (tab) {
      case 0: {
        const trainerText = bbcodeToHtml(`${i18next.t("pokemonSummary:ot")}/${getBBCodeFrag(loggedInUser?.username || i18next.t("pokemonSummary:unknown"), this.scene.gameData.gender === PlayerGender.FEMALE ? TextStyle.SUMMARY_PINK : TextStyle.SUMMARY_BLUE)}[/shadow][/color]`)

        ui.find("#trainer").innerHTML = trainerText;

        const id = ui.findObject("#id");
        id.setText("ID No." + this.scene.gameData.trainerId.toString());
        id.setColor(TextStyle.SUMMARY_ALT);

        const types = this.pokemon?.getTypes(false, false, true)!; // TODO: is this bang correct?


        const typesDom = ui.findObject('#poke-type');
        typesDom.removeAll(true);

        const label = new HTMLContainer();
        label.setText(i18next.t("pokemonSummary:type") + "/")
        typesDom.add(label);

        typesDom.add(types.map(t => {
          let label = new HTMLContainer();
          label.setText(i18next.t(`pokemonInfo:Type.${Type[t]}`))
          return label
        }));


        if (this.pokemon?.isTerastallized()) {
          ui.findObject('#tera').setVisible(true);
        } else {
          ui.findObject('#tera').setVisible(false);
        }

        if (this.pokemon?.getLuck()) {
          const luckLabelText = ui.findObject('#luck-label');
          luckLabelText.setText(i18next.t("common:luckIndicator"))
          luckLabelText.setColor(TextStyle.SUMMARY_ALT);

          const luckText = ui.findObject('#luck-text');
          luckText.setText(this.pokemon?.getLuck())
          luckText.setColor(TextStyle.SUMMARY);
        }

        
        const allAbilityInfo = [this.pokemon?.getAbility(true)!]; // Creates an array to iterate through

        const abs = this.pokemon?.battleData?.abilitiesApplied!;
        if(abs&&abs.length){
          allAbilityInfo.length = 0;
          abs.forEach((ability) => {
            allAbilityInfo.push(allAbilities[ability]);
          })
        }

        // Only add to the array and set up displaying a passive if it's unlocked
        if (this.pokemon?.hasPassive()) {
          allAbilityInfo.push(this.pokemon.getPassiveAbility());
        }
        const abilityDom = ui.findObject("#ability");
        abilityDom.removeAll(true);

        abilityDom.getDOM().innerHTML = allAbilityInfo.map(ability => {
          return `<div id="ability-title">${ability.name}</div>
                      <div id="ability-desc">${ability.description}</div>`
        }).join("\n");

        const closeFragment = `[/shadow][/color]`;

        const rawNature = Utils.toReadableString(Nature[this.pokemon?.getNature()!]); // TODO: is this bang correct?
        const nature = `${getBBCodeFrag(Utils.toReadableString(getNatureName(this.pokemon?.getNature()!)), TextStyle.SUMMARY_RED)}${closeFragment}`; // TODO: is this bang correct?

        const memoString = i18next.t("pokemonSummary:memoString", {
          metFragment: i18next.t(`pokemonSummary:metFragment.${this.pokemon?.metBiome === -1? "apparently": "normal"}`, {
            biome: `${getBBCodeFrag(getBiomeName(this.pokemon?.metBiome!), TextStyle.SUMMARY_RED)}${closeFragment}`, // TODO: is this bang correct?
            level: `${getBBCodeFrag(this.pokemon?.metLevel.toString()!, TextStyle.SUMMARY_RED)}${closeFragment}`, // TODO: is this bang correct?
            wave: `${getBBCodeFrag((this.pokemon?.metWave ? this.pokemon.metWave.toString()! : i18next.t("pokemonSummary:unknownTrainer")), TextStyle.SUMMARY_RED)}${closeFragment}`,
          }),
          natureFragment: nature
        });

        const memoText = ui.findObject("#memo").removeAll();
        memoText.setColor(TextStyle.WINDOW_ALT);
        memoText.setBBCode(String(memoString));
        break;
      }
      case 1:
        {
          let container = ui.findObject("#ivs");
          container.removeAll(true);

          PERMANENT_STATS.forEach((stat, s) => {
            const statName = i18next.t(getStatKey(stat));

            const natureStatMultiplier = getNatureStatMultiplier(this.pokemon?.getNature()!, s); // TODO: is this bang correct?

            const statLabel = new HTMLContainer();
            statLabel.setText(statName);
            statLabel.setColor(natureStatMultiplier === 1 ? TextStyle.SUMMARY : natureStatMultiplier > 1 ? TextStyle.SUMMARY_PINK : TextStyle.SUMMARY_BLUE);

            const statValueText = stat !== Stat.HP
              ? Utils.formatStat(this.pokemon?.stats[s]!) // TODO: is this bang correct?
              : `${Utils.formatStat(this.pokemon?.hp!, true)}/${Utils.formatStat(this.pokemon?.getMaxHp()!, true)}`; // TODO: are those bangs correct?

            const statValueDom = new HTMLContainer();
            statValueDom.setText(statValueText);
            statValueDom.setColor(TextStyle.WINDOW_ALT);

            const ivContainer = new HTMLContainer();
            ivContainer.add([statLabel, statValueDom]);

            container.add(ivContainer);
          });

          const itemModifiers = (this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier
            && m.pokemonId === this.pokemon?.id, this.playerParty) as PokemonHeldItemModifier[])
            .sort(modifierSortFunc);

          container = ui.findObject("#items");
          container.removeAll(true);

          itemModifiers.forEach((item, i) => {

            const icon = new HTMLContainer();
            icon.addClass("modifier");
            icon.setText(item.stackCount);
            if (item.stackCount >= item.getMaxStackCount(this.scene)) {
              icon.setColor(TextStyle.SUMMARY_GRAY);
            }

            icon.setToolTip(item.type.name, item.type.getDescription(this.scene))

            container.add(icon);
          });

          const pkmLvl = this.pokemon?.level!; // TODO: is this bang correct?
          const pkmLvlExp = this.pokemon?.levelExp!; // TODO: is this bang correct?
          const pkmExp = this.pokemon?.exp!; // TODO: is this bang correct?
          const pkmSpeciesGrowthRate = this.pokemon?.species.growthRate!; // TODO: is this bang correct?
          const relLvExp = getLevelRelExp(pkmLvl + 1, pkmSpeciesGrowthRate);
          const expRatio = pkmLvl < this.scene.getMaxExpLevel() ? pkmLvlExp / relLvExp : 0;

          const expLabel = ui.findObject("#cur-exp .label");
          expLabel.setText(i18next.t("pokemonSummary:expPoints"));
          expLabel.setColor(TextStyle.SUMMARY);

          const nextLvExpLabel = ui.findObject("#next-level .label");
          nextLvExpLabel.setText(i18next.t("pokemonSummary:nextLv"));
          nextLvExpLabel.setColor(TextStyle.SUMMARY);

          const expText = ui.findObject("#cur-exp .number");
          expText.setText(pkmExp.toString());
          expText.setColor(TextStyle.WINDOW_ALT);


          const nextLvExp = pkmLvl < this.scene.getMaxExpLevel()
            ? getLevelTotalExp(pkmLvl + 1, pkmSpeciesGrowthRate) - pkmExp
            : 0;

          const nextLvExpText = ui.findObject("#next-level .number");
          nextLvExpText.setText(nextLvExp.toString());
          nextLvExpText.setColor(TextStyle.WINDOW_ALT);
        }
        break;
      case 2: {
        const move4 = ui.findObject("#move4");

        if (this.summaryUiMode === SummaryUiMode.LEARN_MOVE) {
          move4.setAlpha(1);
          move4.findObject(".name").setText(this.summaryUiMode === SummaryUiMode.LEARN_MOVE && this.newMove ? this.newMove.name : i18next.t("pokemonSummary:cancel"))

          const pp = Utils.padInt(this.newMove?.pp!, 2, "  "); // TODO: is this bang correct?
          const ppText = ui.findObject("#move4 .pp")
          ppText.setText(`${pp}/${pp}`);
          ppText.setColor(TextStyle.WINDOW);

          move4.findObject(".type").setText(i18next.t(`pokemonInfo:Type.${Type[this.newMove?.type!]}`));

          const move = this.newMove!;
          const power = move.power;
            const accuracy = move.accuracy;
            const category = {
              0:"*",
              1:"O",
              2:"^"
            }[move.category];

            move4.findObject("#description").setText(move.effect);

            const details = move4.findObject("#details");
            details.findObject("#power span:last-child").setText(power.toString());
            details.findObject("#accuracy span:last-child").setText(accuracy.toString());
            details.findObject("#category span:last-child").setText(category);
        } else {
          move4.setAlpha(0)
        }

        for (let m = 0; m < 4; m++) {
          const move: PokemonMove | null = this.pokemon && this.pokemon.moveset.length > m ? this.pokemon?.moveset[m] : null;

          const moveN = ui.findObject(`#move${m}`);

          if (move) {
            moveN.findObject(".type").setText(i18next.t(`pokemonInfo:Type.${Type[move.getMove().type!]}`))
          }
          moveN.findObject(".name").setText(move ? move.getMove().name : "-");
          moveN.findObject(".pp").setText("--/--");

          if (move) {
            const maxPP = move.getMovePp();
            const pp = maxPP - move.ppUsed;
            moveN.findObject(".pp").setText(`${Utils.padInt(pp, 2, "  ")}/${Utils.padInt(maxPP, 2, "  ")}`);

            const power = move.getMove().power;
            const accuracy = move.getMove().accuracy;
            const category = {
              0:"*",
              1:"O",
              2:"^"
            }[move.getMove().category];

            moveN.findObject("#description").setText(move.getMove().effect);

            const details = moveN.findObject("#details");
            details.findObject("#power span:last-child").setText(power.toString());
            details.findObject("#accuracy span:last-child").setText(accuracy.toString());
            details.findObject("#category span:last-child").setText(category);
          }
        }

      }
        break;
    }

  }

  showStatus(instant?: boolean) {
    if (this.statusVisible) {
      return;
    }
    this.statusVisible = true;
    this.scene.tweens.add({
      targets: this.statusContainer,
      x: 0,
      duration: instant ? 0 : 250,
      ease: "Sine.easeOut"
    });
  }

  hideStatus(instant?: boolean) {
    if (!this.statusVisible) {
      return;
    }
    this.statusVisible = false;
    this.scene.tweens.add({
      targets: this.statusContainer,
      x: -106,
      duration: instant ? 0 : 250,
      ease: "Sine.easeIn"
    });
  }

  getSelectedMove(): Move | null {
    if (this.cursor !== Page.MOVES) {
      return null;
    }

    if (this.moveCursor < 4 && this.pokemon && this.moveCursor < this.pokemon.moveset.length) {
      return this.pokemon.moveset[this.moveCursor]!.getMove(); // TODO: is this bang correct?
    } else if (this.summaryUiMode === SummaryUiMode.LEARN_MOVE && this.moveCursor === 4) {
      return this.newMove;
    }
    return null;
  }

  showMoveSelect() {
    this.moveSelect = true;
    this.selectedMoveIndex = -1;
    this.setCursor(0);
    this.showMoveEffect();
  }

  hideMoveSelect() {
    if (this.summaryUiMode === SummaryUiMode.LEARN_MOVE) {
      this.moveSelectFunction && this.moveSelectFunction(4);
      return;
    }

    this.moveSelect = false;
    this.destroyBlinkCursor();
    this.hideMoveEffect();
  }

  destroyBlinkCursor() {
  }

  showMoveEffect(instant?: boolean) {
    if (instant) return (this.dom.find("#move-tab") as HTMLDivElement).click();
    this.dom.findObject("#move" + this.moveCursor).addClass('selected');
  }

  hideMoveEffect(instant?: boolean) {
    if (!this.moveEffectsVisible) {
      return;
    }
    this.moveEffectsVisible = false;

  }

  clear() {
    const ui = this.dom;
    ui.getDOM().querySelectorAll("#poke-summary-tab>*").forEach((tab) => {
      tab.classList.remove("active");
    })
    ui.getDOM().querySelectorAll("#tab-body>*").forEach((tab) => {
      tab.classList.remove("active");
    })

    ui.findObject("#status-tab").addClass("active");
    ui.findObject("#status").addClass("active");

    this.pokemon = null;
    this.cursor = -1;
    this.newMove = null;
    if (this.moveSelect) {
      this.moveSelect = false;
      this.moveSelectFunction = null;
      this.hideMoveEffect(true);
    }
    this.dom.hide();
  }
}
