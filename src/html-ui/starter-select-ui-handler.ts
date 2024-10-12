import { move } from './../locales/pt_BR/move';
import { BattleSceneEventType, CandyUpgradeNotificationChangedEvent } from "../events/battle-scene";
import { pokemonPrevolutions } from "#app/data/pokemon-evolutions";
import { Variant, getVariantTint } from "#app/data/variant";
import i18next from "i18next";
import { allAbilities } from "../data/ability";
import { speciesEggMoves } from "../data/egg-moves";
import { GrowthRate, getGrowthRateColor } from "../data/exp";
import { Gender, getGenderColor, getGenderSymbol } from "../data/gender";
import Move, { allMoves, MoveCategory } from "../data/move";
import { Nature, getNatureName } from "../data/nature";
import { pokemonFormChanges } from "../data/pokemon-forms";
import { LevelMoves, pokemonFormLevelMoves, pokemonSpeciesLevelMoves } from "../data/pokemon-level-moves";
import PokemonSpecies, { allSpecies, getPokemonSpecies, getPokemonSpeciesForm, getStarterValueFriendshipCap, speciesStarters, starterPassiveAbilities } from "../data/pokemon-species";
import { Type } from "../data/type";
import { GameModes } from "../game-mode";
import { AbilityAttr, DexAttr, DexAttrProps, DexEntry, StarterMoveset, StarterAttributes, StarterPreferences, StarterPrefs } from "../system/game-data";
import { Tutorial, handleTutorial } from "../tutorial";
import * as Utils from "../utils";
import { Egg } from "#app/data/egg";
import Overrides from "#app/overrides";
import { SettingKeyboard } from "#app/system/settings/settings-keyboard";
import { Passive as PassiveAttr } from "#enums/passive";
import * as Challenge from "../data/challenge";
import { Device } from "#enums/devices";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Button } from "#enums/buttons";
import { EggSourceType } from "#app/enums/egg-source-types";
import HUiHandler from "./PhaseUI/HUiHandler";
import TextBattleScene from "#app/html-ui/text-battle-scene";
import { StarterSelectCallback } from "#app/ui/starter-select-ui-handler";
import StarterTemplate from "virtual:starter.hs";
import { HTMLContainer, HTMLObject } from "./Root";
import { DropDownState } from "#app/ui/dropdown";
import { getTextColor, TextStyle } from "#app/ui/text";
import { Mode } from "./UI";
import "./starter-select-ui-handler.scss"
import { ShinyColor } from './Constants';
import { ConfirmDialog } from './widgets/confirmDialog';
import { TitlePhase } from '#app/phases/title-phase';
import { SelectChallengePhase } from '#app/phases/select-challenge-phase.js';
import { showSprite } from './widgets/pokeName';
import { getPokeTypeColor } from './util';
import { PlayerPokemon } from '#app/field/pokemon.js';

export const IVKey = [
  i18next.t("pokemonInfo:Stat.HPStat"),
  i18next.t("pokemonInfo:Stat.ATK"),
  i18next.t("pokemonInfo:Stat.DEF"),
  i18next.t("pokemonInfo:Stat.SPATK"),
  i18next.t("pokemonInfo:Stat.SPDEF"),
  i18next.t("pokemonInfo:Stat.SPD"),
]

interface LanguageSetting {
  starterInfoTextSize: string,
  instructionTextSize: string,
  starterInfoXPos?: integer,
  starterInfoYOffset?: integer
}

const languageSettings: { [key: string]: LanguageSetting } = {
  "en": {
    starterInfoTextSize: "56px",
    instructionTextSize: "38px",
  },
  "de": {
    starterInfoTextSize: "48px",
    instructionTextSize: "35px",
    starterInfoXPos: 33,
  },
  "es": {
    starterInfoTextSize: "56px",
    instructionTextSize: "35px",
  },
  "fr": {
    starterInfoTextSize: "54px",
    instructionTextSize: "35px",
  },
  "it": {
    starterInfoTextSize: "56px",
    instructionTextSize: "38px",
  },
  "pt_BR": {
    starterInfoTextSize: "47px",
    instructionTextSize: "38px",
    starterInfoXPos: 33,
  },
  "zh": {
    starterInfoTextSize: "47px",
    instructionTextSize: "38px",
    starterInfoYOffset: 1,
    starterInfoXPos: 24,
  },
  "pt": {
    starterInfoTextSize: "48px",
    instructionTextSize: "42px",
    starterInfoXPos: 33,
  },
  "ko": {
    starterInfoTextSize: "52px",
    instructionTextSize: "38px",
  },
  "ja": {
    starterInfoTextSize: "51px",
    instructionTextSize: "38px",
  },
  "ca-ES": {
    starterInfoTextSize: "56px",
    instructionTextSize: "38px",
  },
};

const starterCandyCosts: { passive: integer, costReduction: [integer, integer], egg: integer }[] = [
  { passive: 40, costReduction: [25, 60], egg: 30 }, // 1 Cost
  { passive: 40, costReduction: [25, 60], egg: 30 }, // 2 Cost
  { passive: 35, costReduction: [20, 50], egg: 25 }, // 3 Cost
  { passive: 30, costReduction: [15, 40], egg: 20 }, // 4 Cost
  { passive: 25, costReduction: [12, 35], egg: 18 }, // 5 Cost
  { passive: 20, costReduction: [10, 30], egg: 15 }, // 6 Cost
  { passive: 15, costReduction: [8, 20], egg: 12 },  // 7 Cost
  { passive: 10, costReduction: [5, 15], egg: 10 },  // 8 Cost
  { passive: 10, costReduction: [5, 15], egg: 10 },  // 9 Cost
  { passive: 10, costReduction: [5, 15], egg: 10 },  // 10 Cost
];

// Position of UI elements
const filterBarHeight = 17;
const speciesContainerX = 109; // if team on the RIGHT: 109 / if on the LEFT: 143
const teamWindowX = 285; // if team on the RIGHT: 285 / if on the LEFT: 109
const teamWindowY = 18;
const teamWindowWidth = 34;
const teamWindowHeight = 132;

function getPassiveCandyCount(baseValue: integer): integer {
  return starterCandyCosts[baseValue - 1].passive;
}

function getValueReductionCandyCounts(baseValue: integer): [integer, integer] {
  return starterCandyCosts[baseValue - 1].costReduction;
}

function getSameSpeciesEggCandyCounts(baseValue: integer): integer {
  return starterCandyCosts[baseValue - 1].egg;
}

/**
 * Calculates the starter position for a Pokemon of a given UI index
 * @param index UI index to calculate the starter position of
 * @returns An interface with an x and y property
 */
function calcStarterPosition(index: number, scrollCursor: number = 0): { x: number, y: number } {
  const yOffset = 13;
  const height = 17;
  const x = (index % 9) * 18;
  const y = yOffset + (Math.floor(index / 9) - scrollCursor) * height;

  return { x: x, y: y };
}

/**
 * Calculates the y position for the icon of stater pokemon selected for the team
 * @param index index of the Pokemon in the team (0-5)
 * @returns the y position to use for the icon
 */
function calcStarterIconY(index: number) {
  const starterSpacing = teamWindowHeight / 7;
  const firstStarterY = teamWindowY + starterSpacing / 2;
  return Math.round(firstStarterY + starterSpacing * index);
}

/**
 * Finds the index of the team Pokemon closest vertically to the given y position
 * @param y the y position to find closest starter Pokemon
 * @param teamSize how many Pokemon are in the team (0-6)
 * @returns index of the closest Pokemon in the team container
 */
function findClosestStarterIndex(y: number, teamSize: number = 6): number {
  let smallestDistance = teamWindowHeight;
  let closestStarterIndex = 0;
  for (let i = 0; i < teamSize; i++) {
    const distance = Math.abs(y - (calcStarterIconY(i) - 13));
    if (distance < smallestDistance) {
      closestStarterIndex = i;
      smallestDistance = distance;
    }
  }
  return closestStarterIndex;
}

/**
 * Finds the row of the filtered Pokemon closest vertically to the given Pokemon in the team
 * @param index index of the Pokemon in the team (0-5)
 * @param numberOfRows the number of rows to check against
 * @returns index of the row closest vertically to the given Pokemon
 */
function findClosestStarterRow(index: number, numberOfRows: number) {
  const currentY = calcStarterIconY(index) - 13;
  let smallestDistance = teamWindowHeight;
  let closestRowIndex = 0;
  for (let i = 0; i < numberOfRows; i++) {
    const distance = Math.abs(currentY - calcStarterPosition(i * 9).y);
    if (distance < smallestDistance) {
      closestRowIndex = i;
      smallestDistance = distance;
    }
  }
  return closestRowIndex;
}

class DropDownLabel extends HTMLContainer {
  state: number;
  constructor(text: string, value: any = 0, state: number = 0) {
    super(document.createElement("option"));
    this.setText(text);
    this.state = state;
    this.setValue(value);
  }
  setValue(value: any): this {
    const option = (this.dom as HTMLOptionElement);
    option.value = value;
    if (value === "ALL") {
      option.selected = true;
    }
    return this;
  }
  select() {
    (this.dom as HTMLOptionElement).selected = true;
  }
}

class DropDownOptions extends HTMLContainer {
  constructor(scene: TextBattleScene, className: any, label: DropDownLabel | DropDownLabel[], onChange: (e: string) => void = () => { }) {
    if (Array.isArray(label)) {
      super(document.createElement("select"));
    } else {
      super(document.createElement("option"));
    }
    this.addClass(className)
    this.add(label);
    this.on('change', onChange);
  }
}

class StarterContainer extends HTMLContainer {
  icon: HTMLContainer;
  species: PokemonSpecies;
  _enable: boolean;
  _alpha: string = '1';
  starterComponent: HStarterSelectUiHandler;
  constructor(scene: TextBattleScene, species: PokemonSpecies, starterComponent:HStarterSelectUiHandler) {
    super(document.createElement("div"));
    this.scene = scene;

    this.starterComponent = starterComponent;
    this.add([
      new HTMLContainer(document.createElement("span")).addClass('name'),
      new HTMLContainer(document.createElement("span")).addClass('cost'),
      new HTMLContainer(document.createElement("button")).setText("?")
        .on('click', (e) => {
          const dexAttrCursor = this.starterComponent.getCurrentDexProps(species.speciesId);

          const props = this.scene.gameData.getSpeciesDexAttrProps(species, dexAttrCursor);

          showSprite(new PlayerPokemon (scene,species,
            5, 0, 
            props.formIndex,
            props.female?Gender.FEMALE:Gender.MALE,
            props.shiny,
            props.variant,[], Nature.HARDY
          ) , e);
          e.stopPropagation();
        })
    ]);
    this.findObject(".name").setText(species.name);
    this.icon = this;
    this.species = species;
  }
  setCost(cost) {
    this.findObject(".cost").setText(cost.toString());
  }
  get cost() {
    return +(this.find(".cost").textContent || "0");
  }
  enable(enable) {
    this._enable = enable;
    this.dom.style.pointerEvents = enable ? "auto" : "none";
    this.dom.style.opacity = enable ? this._alpha : '0.5';
  }
  setAlpha(alpha: string): void {
    this._alpha = alpha;
    if (this._enable) {
      this.dom.style.opacity = alpha;
    }
  }
  setVisible(visible) {
    if (this._enable) {
      return super.setVisible(visible);
    }

    this.dom.style.display = visible ? "block" : "none";

    return this;
  }
}

enum SelectedEvent {
  Selected = 'selected',
  Unselected = 'unselected'
}

class MoveContainer extends HTMLContainer {
  move: Move | null;
  onChange: (event: SelectedEvent, object: HTMLObject, move) => void;
  constructor(scene: TextBattleScene, move: Move | null, index: number) {
    super(document.createElement("div"));
    let input: HTMLContainer;
    this.add(
      [input = new HTMLContainer(document.createElement("div")),
      new HTMLContainer(document.createElement("span")).setText(move ? move.name : "???")]
    )

    input.addClass("move-selected");
    input.on('click', () => {
      if (!input.getText()) {
        this.onChange(SelectedEvent.Selected, input, move)
      } else {
        this.onChange(SelectedEvent.Unselected, input, move)
      }
    })
    if (index > -1) {
      input.setText((index + 1).toString());
    }

    this.move = move;
  }

  on(event: string, callback: (...args) => void) {
    if (event === 'change') {
      this.onChange = callback;
      return this;
    }
    return super.on(event, callback);
  }
}

class EggMoveContainer extends HTMLContainer {
  move: Move | null;
  constructor(scene: TextBattleScene, eggMove: Move | null, eggMoveUnlocked: boolean) {
    super(document.createElement("div"));

    this.setText(eggMove && eggMoveUnlocked ? eggMove.name : "???")
    this.move = eggMove;
  }
}

export default class HStarterSelectUiHandler extends HUiHandler {
  private starterContainers: StarterContainer[] = [];
  private filteredStarterContainers: StarterContainer[] = [];
  private validStarterContainers: StarterContainer[] = [];

  private pokemonNumberText: HTMLContainer;
  private pokemonNameText: HTMLContainer;
  private pokemonGrowthRateLabelText: HTMLContainer;
  private pokemonGrowthRateText: HTMLContainer;
  private pokemonLuckLabelText: HTMLContainer;
  private pokemonLuckText: HTMLContainer;
  private pokemonGenderText: HTMLContainer;
  private pokemonUncaughtText: HTMLContainer;
  private pokemonAbilityLabelText: HTMLContainer;
  private pokemonAbilityText: HTMLContainer;
  private pokemonPassiveLabelText: HTMLContainer;
  private pokemonPassiveText: HTMLContainer;
  private pokemonNatureLabelText: HTMLContainer;
  private pokemonNatureText: HTMLContainer;
  private pokemonCandyCountText: HTMLContainer;
  private pokemonCaughtCountText: HTMLContainer;
  private pokemonHatchedCountText: HTMLContainer;

  private shinyLabel: HTMLContainer;
  private formLabel: HTMLContainer;
  private genderLabel: HTMLContainer;
  private abilityLabel: HTMLContainer;
  private natureLabel: HTMLContainer;
  private variantLabel: HTMLContainer;
  private goFilterLabel: HTMLContainer;

  private pokemonFormText: HTMLContainer;

  private statsMode: boolean;
  private starterIconsCursorIndex: number;
  private filterMode: boolean;
  private dexAttrCursor: bigint = 0n;
  private abilityCursor: number = -1;
  private natureCursor: number = -1;
  private filterBarCursor: integer = 0;
  private starterMoveset: StarterMoveset | null;
  private scrollCursor: number;

  private allSpecies: PokemonSpecies[] = [];
  private lastSpecies: PokemonSpecies;
  private speciesLoaded: Map<Species, boolean> = new Map<Species, boolean>();
  public starterSpecies: PokemonSpecies[] = [];
  private pokerusSpecies: PokemonSpecies[] = [];
  private starterAttr: bigint[] = [];
  private starterAbilityIndexes: integer[] = [];
  private starterNatures: Nature[] = [];
  private starterMovesets: StarterMoveset[] = [];
  private speciesStarterDexEntry: DexEntry | null;
  private speciesStarterMoves: Moves[];
  private canCycleShiny: boolean;
  private canCycleForm: boolean;
  private canCycleGender: boolean;
  private canCycleAbility: boolean;
  private canCycleNature: boolean;
  private canCycleVariant: boolean;
  private value: integer = 0;
  private canAddParty: boolean;

  private assetLoadCancelled: Utils.BooleanHolder | null;
  private valueLimitLabel: HTMLContainer;


  //variables to keep track of the dynamically rendered list of instruction prompts for starter select
  private instructionRowX = 0;
  private instructionRowY = 0;
  private instructionRowTextOffset = 9;
  private filterInstructionRowX = 0;
  private filterInstructionRowY = 0;

  private starterSelectCallback: StarterSelectCallback | null;

  private starterPreferences: StarterPreferences;

  protected blockInput: boolean = false;
  private dom: HTMLContainer;
  contextMenu: HTMLContainer;
  missMove: Array<{
    index: number,
    oldMove: Moves,
    newMove?: Moves
  }> = []

  constructor(scene: TextBattleScene) {
    super(scene);//, Mode.STARTER_SELECT
  }

  setup() {
  }
  init() {
    this.dom = new HTMLContainer(document.createElement("div")).setName("starter");
    this.dom.setInnerHTML(StarterTemplate({
      all: i18next.t("filterBar:all"),
      start: i18next.t("common:start"),
    }));

    const currentLanguage = i18next.resolvedLanguage!; // TODO: is this bang correct?
    const langSettingKey = Object.keys(languageSettings).find(lang => currentLanguage.includes(lang))!; // TODO: is this bang correct?
    const textSettings = languageSettings[langSettingKey];

    // gen filter
    const genContainer = this.dom.findObject(".gen");
    [
      i18next.t("starterSelectUiHandler:gen1"),
      i18next.t("starterSelectUiHandler:gen2"),
      i18next.t("starterSelectUiHandler:gen3"),
      i18next.t("starterSelectUiHandler:gen4"),
      i18next.t("starterSelectUiHandler:gen5"),
      i18next.t("starterSelectUiHandler:gen6"),
      i18next.t("starterSelectUiHandler:gen7"),
      i18next.t("starterSelectUiHandler:gen8"),
      i18next.t("starterSelectUiHandler:gen9"),
    ].map((gen, index) => {
      genContainer.add(new HTMLContainer(document.createElement("option")).setValue(index + 1).setText(gen))
    })
    genContainer.on('change', this.updateStarters)

    // type filter
    const typeKeys = Object.keys(Type).filter(v => isNaN(Number(v)));

    let container = this.dom.findObject(".type");
    container.on('change', this.updateStarters);

    typeKeys.forEach((type, index) => {
      if (index === 0 || index === 19) {
        return;
      }
      container.add(new HTMLContainer(document.createElement("option")).setValue(index).setText(i18next.t(`pokemonInfo:Type.${type}`)))
    });

    container = this.dom.findObject(".captured");
    container.on('change', this.updateStarters);
    [
      "s3",
      "s2",
      "s1",
      i18next.t("filterBar:normal"),
      i18next.t("filterBar:uncaught")
    ].map((gen, index) => {
      container.add(new HTMLContainer(document.createElement("option")).setValue(index).setText(gen))
    });

    // unlocks filter
    container = this.dom.findObject(".passive");
    container.on('change', this.updateStarters);

    [
      i18next.t("filterBar:passive"),
      i18next.t("filterBar:passiveLocked"),
      i18next.t("filterBar:passiveUnlocked"),
      i18next.t("filterBar:passiveUnlockable"),
    ].map((gen, index) => {
      container.add(new DropDownLabel(gen)
        .setValue(!index ? "ALL" : index))
    })

    container = this.dom.findObject(".cost");
    container.on('change', this.updateStarters);
    const costReductionLabels = [
      i18next.t("filterBar:costReduction"),
      i18next.t("filterBar:costReductionUnlocked"),
      i18next.t("filterBar:costReductionUnlockable"),
      i18next.t("filterBar:costReductionLocked"),
    ].map((gen, index) => {
      container.add(new DropDownLabel(gen)
        .setValue(!index ? "ALL" : index))
    });

    // misc filter
    const favoriteLabels = [
      new DropDownLabel(i18next.t("filterBar:favorite"), "ALL", DropDownState.OFF),
      new DropDownLabel(i18next.t("filterBar:isFavorite"), 0, DropDownState.ON),
      new DropDownLabel(i18next.t("filterBar:notFavorite"), 1, DropDownState.EXCLUDE),
    ];
    const winLabels = [
      new DropDownLabel(i18next.t("filterBar:ribbon"), "ALL", DropDownState.OFF),
      new DropDownLabel(i18next.t("filterBar:hasWon"), 0, DropDownState.ON),
      new DropDownLabel(i18next.t("filterBar:hasNotWon"), 1, DropDownState.EXCLUDE),
    ];
    const hiddenAbilityLabels = [
      new DropDownLabel(i18next.t("filterBar:hiddenAbility"), "ALL", DropDownState.OFF),
      new DropDownLabel(i18next.t("filterBar:hasHiddenAbility"), 0, DropDownState.ON),
      new DropDownLabel(i18next.t("filterBar:noHiddenAbility"), 1, DropDownState.EXCLUDE),
    ];
    const eggLabels = [
      new DropDownLabel(i18next.t("filterBar:egg"), "ALL", DropDownState.OFF),
      new DropDownLabel(i18next.t("filterBar:eggPurchasable"), 0, DropDownState.ON),
    ];
    const pokerusLabels = [
      new DropDownLabel(i18next.t("filterBar:pokerus"), "ALL", DropDownState.OFF),
      new DropDownLabel(i18next.t("filterBar:hasPokerus"), 0, DropDownState.ON),
    ];
    const miscFilter = [
      new DropDownOptions(this.scene, "FAVORITE", favoriteLabels, this.updateStarters),
      new DropDownOptions(this.scene, "WIN", winLabels, this.updateStarters),
      new DropDownOptions(this.scene, "HIDDEN_ABILITY", hiddenAbilityLabels, this.updateStarters),
      new DropDownOptions(this.scene, "EGG", eggLabels, this.updateStarters),
      new DropDownOptions(this.scene, "POKERUS", pokerusLabels, this.updateStarters),
    ];

    this.dom.findObject(".misc").add(miscFilter);
    this.dom.findObject(".misc-label").setText(i18next.t("filterBar:miscFilter"));


    // sort filter
    const sortOptions = [
      new DropDownLabel(i18next.t("filterBar:sortByNumber") + " ↑", 0, DropDownState.ON),
      new DropDownLabel(i18next.t("filterBar:sortByNumber") + " ↓", 1, DropDownState.ON),
      new DropDownLabel(i18next.t("filterBar:sortByCost") + " ↑", 2),
      new DropDownLabel(i18next.t("filterBar:sortByCost") + " ↓", 3),
      new DropDownLabel(i18next.t("filterBar:sortByCandies") + " ↑", 4),
      new DropDownLabel(i18next.t("filterBar:sortByCandies") + " ↓", 5),
      new DropDownLabel(i18next.t("filterBar:sortByIVs") + " ↑", 6),
      new DropDownLabel(i18next.t("filterBar:sortByIVs") + " ↓", 7),
      new DropDownLabel(i18next.t("filterBar:sortByName") + " ↑", 8),
      new DropDownLabel(i18next.t("filterBar:sortByName") + " ↓", 9)
    ];
    this.dom.findObject(".sort-label").setText(i18next.t("filterBar:sortFilter"));
    this.dom.findObject(".sort").add(sortOptions)
      .on('change', this.updateStarters);

    this.dom.findObject(".grow-rate-label").setText(i18next.t("starterSelectUiHandler:growthRate"))

    //i18next.t("starterSelectUiHandler:uncaught")


    // The position should be set per language
    const starterInfoXPos = textSettings?.starterInfoXPos || 31;
    const starterInfoYOffset = textSettings?.starterInfoYOffset || 0;

    // The font size should be set per language
    const starterInfoTextSize = textSettings?.starterInfoTextSize || 56;

    const getObject = (selector) => this.dom.findObject(selector);
    this.pokemonGrowthRateText = getObject(".poke-growth");
    this.pokemonLuckLabelText = getObject(".poke-luck-label");
    this.pokemonLuckText = getObject(".poke-luck");
    this.pokemonGenderText = getObject(".poke-gender")
      .on('click', () => {
        let starterAttributes = this.starterPreferences[this.lastSpecies.speciesId];
        const props = this.scene.gameData.getSpeciesDexAttrProps(this.lastSpecies, this.getCurrentDexProps(this.lastSpecies.speciesId));
        starterAttributes.female = !props.female;
        this.setSpeciesDetails(this.lastSpecies, undefined, undefined, !props.female, undefined, undefined, undefined);
      });
    this.pokemonUncaughtText = getObject(".poke-uncaught");
    this.pokemonAbilityLabelText = getObject(".poke-ability-label");
    this.pokemonAbilityText = getObject(".poke-ability")
      .on('click', () => {
        if (this.canCycleAbility) {

          let starterAttributes = this.starterPreferences[this.lastSpecies.speciesId];

          const abilityCount = this.lastSpecies.getAbilityCount();
          const abilityAttr = this.scene.gameData.starterData[this.lastSpecies.speciesId].abilityAttr;
          let newAbilityIndex = this.abilityCursor;
          do {
            newAbilityIndex = (newAbilityIndex + 1) % abilityCount;
            if (!newAbilityIndex) {
              if (abilityAttr & AbilityAttr.ABILITY_1) {
                break;
              }
            } else if (newAbilityIndex === 1) {
              if (this.lastSpecies.ability1 === this.lastSpecies.ability2) {
                newAbilityIndex = (newAbilityIndex + 1) % abilityCount;
              }
              break;
            } else {
              if (abilityAttr & AbilityAttr.ABILITY_HIDDEN) {
                break;
              }
            }
          } while (newAbilityIndex !== this.abilityCursor);
          starterAttributes.ability = newAbilityIndex; // store the selected ability
          this.setSpeciesDetails(this.lastSpecies, undefined, undefined, undefined, undefined, newAbilityIndex, undefined);
        }
      })
    this.pokemonPassiveLabelText = getObject(".poke-passive-label");
    this.pokemonPassiveText = getObject(".poke-passive");
    this.pokemonNatureLabelText = getObject(".poke-nature-label");
    this.pokemonNatureText = getObject(".poke-nature")
      .on('change', (e) => {
        let starterAttributes = this.starterPreferences[this.lastSpecies.speciesId];
        // update default nature in starter save data
        if (!starterAttributes) {
          starterAttributes = this.starterPreferences[this.lastSpecies.speciesId] = {};
        }
        const n = (+e.target.value);
        starterAttributes.nature = n as unknown as integer;

        // set nature for starter
        this.setSpeciesDetails(this.lastSpecies, undefined, undefined, undefined, undefined, undefined, n, undefined);
        this.blockInput = false;
      });

    this.pokemonAbilityLabelText = this.dom.findObject(".poke-ability-label").setText(i18next.t("starterSelectUiHandler:ability")).setColor(TextStyle.SUMMARY_ALT);


    this.pokemonPassiveLabelText = this.dom.findObject(".poke-passive-label").setText(i18next.t("starterSelectUiHandler:passive")).setColor(TextStyle.SUMMARY_ALT);


    this.pokemonNatureLabelText = this.dom.findObject(".poke-nature-label").setText(i18next.t("starterSelectUiHandler:nature")).setColor(TextStyle.SUMMARY_ALT);


    this.dom.findObject(".start").setText(i18next.t("common:start")).setColor(TextStyle.SUMMARY_ALT);

    const starterSpecies: Species[] = [];

    const containerDom = this.dom.findObject(".poke-list");
    for (const species of allSpecies) {
      if (!speciesStarters.hasOwnProperty(species.speciesId) || !species.isObtainable()) {
        continue;
      }

      starterSpecies.push(species.speciesId);
      this.speciesLoaded.set(species.speciesId, false);
      this.allSpecies.push(species);

      const starterContainer = new StarterContainer(this.scene, species, this);
      starterContainer.on('click', () => {
        this.setSpecies(species);
      }).on('contextmenu', e => {
        this.setSpecies(species);

        const boundingRect = starterContainer.getDOM().getBoundingClientRect();
        this.showOptions(e, boundingRect);
        e.stopPropagation();
        e.preventDefault();
      })

      this.starterContainers.push(starterContainer);
      containerDom.add(starterContainer);
    }

    this.pokemonLuckLabelText = this.dom.findObject(".poke-luck-label")
      .setText(i18next.t("common:luckIndicator"))
      .setColor(TextStyle.SUMMARY_ALT);


    // this.pokemonCandyIcon = this.scene.add.sprite(4.5, 18, "candy");
    // this.pokemonCandyIcon.setScale(0.5);
    // this.pokemonCandyIcon.setOrigin(0, 0);
    // this.starterSelectContainer.add(this.pokemonCandyIcon);

    this.pokemonFormText = this.dom.findObject(".poke-form-label")
      .setText(i18next.t("starterSelectUiHandler:cycleForm"))
      .setColor(TextStyle.SUMMARY_ALT);

    this.dom.findObject(".poke-egg-moves-label")
      .setText(i18next.t("starterSelectUiHandler:eggMoves"))
      .setColor(TextStyle.SUMMARY_ALT);


    // The font size should be set per language
    const instructionTextSize = textSettings.instructionTextSize;

    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);

    this.scene.executeWithSeedOffset(() => {
      for (let c = 0; c < 3; c++) {
        let randomSpeciesId: Species;
        let species: PokemonSpecies | undefined;

        const generateSpecies = () => {
          randomSpeciesId = Utils.randSeedItem(starterSpecies);
          species = getPokemonSpecies(randomSpeciesId);
        };

        let dupe = false;

        do {
          dupe = false;

          generateSpecies();

          for (let ps = 0; ps < c; ps++) {
            if (this.pokerusSpecies[ps] === species) {
              dupe = true;
              break;
            }
          }
        } while (dupe);

        this.pokerusSpecies.push(species!); // TODO: is the bang correct?
      }
    }, 0, date.getTime().toString());

    this.pokemonNumberText = getObject(".poke-number");
    this.pokemonNameText = getObject(".poke-name")
      .on('click', this.showOptions);

    this.pokemonGrowthRateLabelText = getObject(".poke-growth-label").setText(i18next.t("starterSelectUiHandler:growthRate"));

    getObject(".cancel").setText(i18next.t("menu:cancel"))
      .on('click', () => {
        this.tryExit();
      });
    getObject(".poke-gen-label").setText(i18next.t("filterBar:genFilter"));
    getObject(".poke-type-label").setText(i18next.t("filterBar:typeFilter"));
    getObject(".poke-captured-label").setText(i18next.t("filterBar:caughtFilter"));
    getObject(".poke-unlock-label").setText(i18next.t("filterBar:unlocksFilter"));

    getObject(".poke-candy-label").setText(i18next.t("filterBar:sortByCandies") + ":").setColor(TextStyle.SUMMARY_ALT);
    getObject(".poke-moves-label").setText(i18next.t("settings:moveInfo")).setColor(TextStyle.SUMMARY_ALT);
    getObject(".poke-caught-label").setText(i18next.t("filterBar:caughtFilter") + ":").setColor(TextStyle.SUMMARY_ALT);
    getObject(".poke-hatched-label").setText(i18next.t("gameStatsUiHandler:eggsHatched") + ":").setColor(TextStyle.SUMMARY_ALT);

    this.pokemonCandyCountText = getObject(".poke-candy");
    this.pokemonCaughtCountText = getObject(".poke-caught");
    this.pokemonHatchedCountText = getObject(".poke-hatched");
    this.shinyLabel = getObject(".poke-shiny")
      .on('change', (e) => {
        if (this.canCycleShiny) {
          const newVariant = + e.target.value;

          let starterAttributes = this.starterPreferences[this.lastSpecies.speciesId];

          starterAttributes.shiny = newVariant > 0 ? true : false;
          starterAttributes.variant = newVariant > 0 ? newVariant - 1 : undefined;

          this.setSpeciesDetails(this.lastSpecies, newVariant > 0 ? true : false, undefined, undefined, newVariant > 0 ? (newVariant - 1) as Variant : undefined, undefined, undefined);
        }
      });

    this.valueLimitLabel = getObject(".poke-value-limit");

    getObject(".start").on('click', () => {
      this.tryStart(true);
    })
    let updateTask;
    getObject("#search").on('input', (e) => {
      clearTimeout(updateTask);
      updateTask = setTimeout(() => {
        this.updateStarters(e.target.value)
      }, 100);
    })

    const partyDom = getObject(".selected-list");
    partyDom.on('click', (e) => {
      const index = Array.from(partyDom.getDOM().children).indexOf(e.target);

      this.setSpecies(this.starterSpecies[index]);
    }).on('contextmenu', (e) => {
      this.showOptions(e, e.target.getBoundingClientRect());
      e.stopPropagation();
      e.preventDefault();
    })
    // this.statsContainer = new StatsContainer(this.scene, 6, 16);

    this.scene.eventTarget.addEventListener(BattleSceneEventType.CANDY_UPGRADE_NOTIFICATION_CHANGED, (e) => this.onCandyUpgradeDisplayChanged(e));

    this.updateInstructions();

    getObject(".add-to-part").on('click', () => {
      const isValidForChallenge = new Utils.BooleanHolder(true);
      const isPartyValid = this.isPartyValid();

      Challenge.applyChallenges(this.scene.gameMode, Challenge.ChallengeType.STARTER_CHOICE, this.lastSpecies, isValidForChallenge, this.scene.gameData.getSpeciesDexAttrProps(this.lastSpecies, this.getCurrentDexProps(this.lastSpecies.speciesId)), isPartyValid);

      const [isDupe] = this.isInParty(this.lastSpecies);
      
      const isOverValueLimit = this.tryUpdateValue(this.scene.gameData.getSpeciesStarterValue(this.lastSpecies.speciesId), true);
      if (!isDupe && isValidForChallenge.value && isOverValueLimit) {
        this.addToParty(this.lastSpecies, this.dexAttrCursor, this.abilityCursor, this.natureCursor as unknown as Nature, this.starterMoveset?.slice(0) as StarterMoveset);
      }
    });
    getObject(".remove-from-party").on('click', (e) => {
      const index = this.starterSpecies.indexOf(this.lastSpecies);
      this.popStarter(index);
    });
  }

  show(args: any[]): boolean {
    if (!this.dom)
      this.init();
    if (!this.starterPreferences) {
      // starterPreferences haven't been loaded yet
      this.starterPreferences = StarterPrefs.load();
    }
    if (args.length >= 1 && args[0] instanceof Function) {
      this.starterSelectCallback = args[0] as StarterSelectCallback;

      this.allSpecies.forEach((species, s) => {
        const icon = this.starterContainers[s].icon;
        const dexEntry = this.scene.gameData.dexData[species.speciesId];
        this.starterPreferences[species.speciesId] = this.starterPreferences[species.speciesId] ?? {};

        if (this.pokerusSpecies.includes(species)) {
          icon.addClass("pokerus");
        }

        if (dexEntry.caughtAttr) {
          icon.setAlpha(1);
        } else if (dexEntry.seenAttr) {
          icon.setAlpha(0.5);
        }

        this.setUpgradeAnimation(icon, species);
      });

      this.resetFilters();
      this.updateStarters("");

      this.setFilterMode(false);
      this.filterBarCursor = 0;
      this.setCursor(0);
      this.tryUpdateValue(0);

      this.contextMenu && this.contextMenu.hide();

      handleTutorial(this.scene, Tutorial.Starter_Select);

      document.body.appendChild(this.dom.getDOM());
      return true;
    }

    return false;
  }

  /**
   * Set the selections for all filters to their default starting value
   */
  resetFilters(): void {
    const caughtDropDown = this.dom.findObject(".captured");
    (caughtDropDown.getDOM() as HTMLSelectElement).selectedIndex = 0;
  }

  showText(text: string, delay?: integer, callback?: Function, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer) {
    this.dom.findObject(".msg")
      .removeAll().setText(text);

    callback && callback();

  }

  /**
   * Determines if 'Icon' based upgrade notifications should be shown
   * @returns true if upgrade notifications are enabled and set to display an 'Icon'
   */
  isUpgradeIconEnabled(): boolean {
    return this.scene.candyUpgradeNotification !== 0 && this.scene.candyUpgradeDisplay === 0;
  }
  /**
   * Determines if 'Animation' based upgrade notifications should be shown
   * @returns true if upgrade notifications are enabled and set to display an 'Animation'
   */
  isUpgradeAnimationEnabled(): boolean {
    return this.scene.candyUpgradeNotification !== 0 && this.scene.candyUpgradeDisplay === 1;
  }

  /**
   * Determines if a passive upgrade is available for the given species ID
   * @param speciesId The ID of the species to check the passive of
   * @returns true if the user has enough candies and a passive has not been unlocked already
   */
  isPassiveAvailable(speciesId: number): boolean {
    // Get this species ID's starter data
    const starterData = this.scene.gameData.starterData[speciesId];

    return starterData.candyCount >= getPassiveCandyCount(speciesStarters[speciesId])
      && !(starterData.passiveAttr & PassiveAttr.UNLOCKED);
  }

  /**
   * Determines if a value reduction upgrade is available for the given species ID
   * @param speciesId The ID of the species to check the value reduction of
   * @returns true if the user has enough candies and all value reductions have not been unlocked already
   */
  isValueReductionAvailable(speciesId: number): boolean {
    // Get this species ID's starter data
    const starterData = this.scene.gameData.starterData[speciesId];

    return starterData.candyCount >= getValueReductionCandyCounts(speciesStarters[speciesId])[starterData.valueReduction]
      && starterData.valueReduction < 2;
  }

  /**
   * Determines if an same species egg can be baught for the given species ID
   * @param speciesId The ID of the species to check the value reduction of
   * @returns true if the user has enough candies
   */
  isSameSpeciesEggAvailable(speciesId: number): boolean {
    // Get this species ID's starter data
    const starterData = this.scene.gameData.starterData[speciesId];

    return starterData.candyCount >= getSameSpeciesEggCandyCounts(speciesStarters[speciesId]);
  }

  /**
   * Sets a bounce animation if enabled and the Pokemon has an upgrade
   * @param icon {@linkcode Phaser.GameObjects.GameObject} to animate
   * @param species {@linkcode PokemonSpecies} of the icon used to check for upgrades
   * @param startPaused Should this animation be paused after it is added?
   */
  setUpgradeAnimation(icon: HTMLContainer, species: PokemonSpecies, startPaused: boolean = false): void {
    // Skip animations if they are disabled
    if (this.scene.candyUpgradeDisplay === 0 || species.speciesId !== species.getRootSpeciesId(false)) {
      return;
    }

    const passiveAvailable = this.isPassiveAvailable(species.speciesId);
    // 'Only Passives' mode
    if (this.scene.candyUpgradeNotification === 1) {
      if (passiveAvailable) {
        icon.addClass("passive");
      }
      // 'On' mode
    } else if (this.scene.candyUpgradeNotification === 2) {
      if (passiveAvailable || this.isValueReductionAvailable(species.speciesId)) {
        icon.addClass("reduction");
      }
    }
  }

  /**
   * Sets the visibility of a Candy Upgrade Icon
   */
  setUpgradeIcon(starter: StarterContainer): void {
    const species = starter.species;
    const slotVisible = !!species?.speciesId;

    if (!species || this.scene.candyUpgradeNotification === 0 || species.speciesId !== species.getRootSpeciesId(false)) {
      return;
    }

    const passiveAvailable = this.isPassiveAvailable(species.speciesId);
    // 'Only Passive Unlocks' mode
    if (this.scene.candyUpgradeNotification === 1) {

      // 'On' mode
    } else if (this.scene.candyUpgradeNotification === 2) {

    }
  }

  /**
   * Processes an {@linkcode CandyUpgradeNotificationChangedEvent} sent when the corresponding setting changes
   * @param event {@linkcode Event} sent by the callback
   */
  onCandyUpgradeDisplayChanged(event: Event): void {
    const candyUpgradeDisplayEvent = event as CandyUpgradeNotificationChangedEvent;
    if (!candyUpgradeDisplayEvent) {
      return;
    }

    // Loop through all visible candy icons when set to 'Icon' mode
    if (this.scene.candyUpgradeDisplay === 0) {
      this.filteredStarterContainers.forEach((starter) => {
        this.setUpgradeIcon(starter);
      });

      return;
    }

    // Loop through all animations when set to 'Animation' mode
    this.filteredStarterContainers.forEach((starter, s) => {
      const icon = this.filteredStarterContainers[s].icon;

      this.setUpgradeAnimation(icon, starter.species);
    });
  }

  processInput(button: Button): boolean {
    if (this.blockInput) {
      return false;
    }

    const maxColumns = 9;
    const maxRows = 9;
    const numberOfStarters = this.filteredStarterContainers.length;
    const numOfRows = Math.ceil(numberOfStarters / maxColumns);
    const currentRow = Math.floor(this.cursor / maxColumns);
    const onScreenFirstIndex = this.scrollCursor * maxColumns; // this is first starter index on the screen
    const onScreenLastIndex = Math.min(this.filteredStarterContainers.length - 1, onScreenFirstIndex + maxRows * maxColumns - 1); // this is the last starter index on the screen
    const onScreenNumberOfStarters = onScreenLastIndex - onScreenFirstIndex + 1;
    const onScreenNumberOfRows = Math.ceil(onScreenNumberOfStarters / maxColumns);
    const onScreenCurrentRow = Math.floor((this.cursor - onScreenFirstIndex) / maxColumns);

    const ui = this.getUi();

    let success = false;
    let error = false;

    if (button === Button.SUBMIT) {
      if (this.tryStart(true)) {
        success = true;
      } else {
        error = true;
      }
    } else if (button === Button.CANCEL) {
      if (this.filterMode) {
        // CANCEL with a filter menu open > close it

        // if there are possible starters go the first one of the list
        if (numberOfStarters > 0) {
          this.setFilterMode(false);
          this.scrollCursor = 0;
          this.updateScroll();
          this.setCursor(0);
        }
        success = true;

      } else if (this.statsMode) {
        success = true;
      } else if (this.starterSpecies.length) {
        this.popStarter(this.starterSpecies.length - 1);
        success = true;
        this.updateInstructions();
      } else {
        this.tryExit();
        success = true;
      }
    } else if (button === Button.STATS) {
      // if stats button is pressed, go to filter directly
      if (!this.filterMode) {
        this.setSpecies(null);
        this.filterBarCursor = 0;
        this.setFilterMode(true);
      }
    } else if (0) { // this checks to see if the start button is selected
      switch (button) {
        case Button.ACTION:
          if (this.tryStart(true)) {
            success = true;
          } else {
            error = true;
          }
          break;
        case Button.UP:
          if (this.starterSpecies.length > 0) {
            this.starterIconsCursorIndex = this.starterSpecies.length - 1;
            this.moveStarterIconsCursor(this.starterIconsCursorIndex);
          } else {
            // up from start button with no Pokemon in the team > go to filter
            this.setFilterMode(true);
          }
          success = true;
          break;
        case Button.DOWN:
          if (this.starterSpecies.length > 0) {
            this.starterIconsCursorIndex = 0;
            this.moveStarterIconsCursor(this.starterIconsCursorIndex);
          } else {
            // down from start button with no Pokemon in the team > go to filter
            this.setFilterMode(true);
          }
          success = true;
          break;
        case Button.LEFT:
          success = this.setCursor(onScreenFirstIndex + (onScreenNumberOfRows - 1) * 9 + 8); // set last column
          success = true;
          break;
        case Button.RIGHT:
          success = this.setCursor(onScreenFirstIndex + (onScreenNumberOfRows - 1) * 9); // set first column
          success = true;
          break;
      }
    } else if (this.filterMode) {
      switch (button) {
        case Button.LEFT:
          if (this.filterBarCursor > 0) {
            success = this.setCursor(this.filterBarCursor - 1);
          } else {
            success = true;
          }
          break;
        case Button.RIGHT:

          success = true;
          break;
        case Button.UP:
          if (0) {
            // else if there is filtered starters
          } else if (numberOfStarters > 0) {
            // UP from filter bar to bottom of Pokemon list
            this.setFilterMode(false);
            this.scrollCursor = Math.max(0, numOfRows - 9);
            this.updateScroll();
            const proportion = (this.filterBarCursor + 0.5) / 1;
            const targetCol = Math.min(8, Math.floor(proportion * 11));
            if (numberOfStarters % 9 > targetCol) {
              this.setCursor(numberOfStarters - (numberOfStarters) % 9 + targetCol);
            } else {
              this.setCursor(Math.max(numberOfStarters - (numberOfStarters) % 9 + targetCol - 9, 0));
            }
            success = true;
          }
          break;
        case Button.DOWN:
          if (0) {

          } else if (numberOfStarters > 0) {
            // DOWN from filter bar to top of Pokemon list
            this.setFilterMode(false);
            this.scrollCursor = 0;
            this.updateScroll();
            const proportion = this.filterBarCursor / Math.max(1, 1);
            const targetCol = Math.min(8, Math.floor(proportion * 11));
            this.setCursor(Math.min(targetCol, numberOfStarters));
            success = true;
          }
          break;
        case Button.ACTION:
          success = true;
          break;
      }
    } else {

      let starterContainer;
      const starterData = this.scene.gameData.starterData[this.lastSpecies.speciesId];
      // prepare persistent starter data to store changes
      let starterAttributes = this.starterPreferences[this.lastSpecies.speciesId];

      // this gets the correct pokemon cursor depending on whether you're in the starter screen or the party icons
      if (1) {
        starterContainer = this.filteredStarterContainers[this.cursor];
      } else {
        // if species is in filtered starters, get the starter container from the filtered starters, it can be undefined if the species is not in the filtered starters
        starterContainer = this.filteredStarterContainers[this.filteredStarterContainers.findIndex(container => container.species === this.lastSpecies)];
      }

      if (button === Button.ACTION) {
        if (!this.speciesStarterDexEntry?.caughtAttr) {
          error = true;
        } else if (this.starterSpecies.length <= 6) { // checks to see if the party has 6 or fewer pokemon

          success = true;
        }
      } else {
        const props = this.scene.gameData.getSpeciesDexAttrProps(this.lastSpecies, this.getCurrentDexProps(this.lastSpecies.speciesId));
        switch (button) {
          case Button.CYCLE_SHINY:
            if (this.canCycleShiny) {
              const newVariant = props.variant;
              starterAttributes.shiny = starterAttributes.shiny ? !starterAttributes.shiny : true;
              this.setSpeciesDetails(this.lastSpecies, !props.shiny, undefined, undefined, props.shiny ? 0 : undefined, undefined, undefined);
              if (starterAttributes.shiny) {
                this.scene.playSound("sparkle");
                // Set the variant label to the shiny tint
                const tint = getVariantTint(newVariant);
              } else {
                // starterAttributes.variant = 0;
                if (starterAttributes?.variant) {
                  delete starterAttributes.variant;
                }
                success = true;
              }
            }
            break;
          case Button.CYCLE_FORM:
            if (this.canCycleForm) {
              const formCount = this.lastSpecies.forms.length;
              let newFormIndex = props.formIndex;
              do {
                newFormIndex = (newFormIndex + 1) % formCount;
                if (this.lastSpecies.forms[newFormIndex].isStarterSelectable && this.speciesStarterDexEntry!.caughtAttr! & this.scene.gameData.getFormAttr(newFormIndex)) { // TODO: are those bangs correct?
                  break;
                }
              } while (newFormIndex !== props.formIndex);
              starterAttributes.form = newFormIndex; // store the selected form
              this.setSpeciesDetails(this.lastSpecies, undefined, newFormIndex, undefined, undefined, undefined, undefined);
              success = true;
            }
            break;
          case Button.CYCLE_GENDER:
            if (this.canCycleGender) {
              starterAttributes.female = !props.female;
              this.setSpeciesDetails(this.lastSpecies, undefined, undefined, !props.female, undefined, undefined, undefined);
              success = true;
            }
            break;
          case Button.CYCLE_ABILITY:
            if (this.canCycleAbility) {
              const abilityCount = this.lastSpecies.getAbilityCount();
              const abilityAttr = this.scene.gameData.starterData[this.lastSpecies.speciesId].abilityAttr;
              let newAbilityIndex = this.abilityCursor;
              do {
                newAbilityIndex = (newAbilityIndex + 1) % abilityCount;
                if (!newAbilityIndex) {
                  if (abilityAttr & AbilityAttr.ABILITY_1) {
                    break;
                  }
                } else if (newAbilityIndex === 1) {
                  if (this.lastSpecies.ability1 === this.lastSpecies.ability2) {
                    newAbilityIndex = (newAbilityIndex + 1) % abilityCount;
                  }
                  break;
                } else {
                  if (abilityAttr & AbilityAttr.ABILITY_HIDDEN) {
                    break;
                  }
                }
              } while (newAbilityIndex !== this.abilityCursor);
              starterAttributes.ability = newAbilityIndex; // store the selected ability
              this.setSpeciesDetails(this.lastSpecies, undefined, undefined, undefined, undefined, newAbilityIndex, undefined);
              success = true;
            }
            break;
          case Button.CYCLE_NATURE:
            if (this.canCycleNature) {
              const natures = this.scene.gameData.getNaturesForAttr(this.speciesStarterDexEntry?.natureAttr);
              const natureIndex = natures.indexOf(this.natureCursor);
              const newNature = natures[natureIndex < natures.length - 1 ? natureIndex + 1 : 0];
              // store cycled nature as default
              starterAttributes.nature = newNature as unknown as integer;
              this.setSpeciesDetails(this.lastSpecies, undefined, undefined, undefined, undefined, undefined, newNature, undefined);
              success = true;
            }
            break;
          case Button.V:
            if (this.canCycleVariant) {
              let newVariant = props.variant;
              do {
                newVariant = (newVariant + 1) % 3;
                if (!newVariant) {
                  if (this.speciesStarterDexEntry!.caughtAttr & DexAttr.DEFAULT_VARIANT) { // TODO: is this bang correct?
                    break;
                  }
                } else if (newVariant === 1) {
                  if (this.speciesStarterDexEntry!.caughtAttr & DexAttr.VARIANT_2) { // TODO: is this bang correct?
                    break;
                  }
                } else {
                  if (this.speciesStarterDexEntry!.caughtAttr & DexAttr.VARIANT_3) { // TODO: is this bang correct?
                    break;
                  }
                }
              } while (newVariant !== props.variant);
              starterAttributes.variant = newVariant; // store the selected variant
              this.setSpeciesDetails(this.lastSpecies, undefined, undefined, undefined, newVariant as Variant, undefined, undefined);
              // Cycle tint based on current sprite tint
              const tint = getVariantTint(newVariant as Variant);
              success = true;
            }
            break;
          case Button.UP:
            if (0) {
              if (currentRow > 0) {
                if (this.scrollCursor > 0 && currentRow - this.scrollCursor === 0) {
                  this.scrollCursor--;
                  this.updateScroll();
                }
                success = this.setCursor(this.cursor - 9);
              } else {
                this.setFilterMode(true);
                success = true;
              }
            } else {
              if (this.starterIconsCursorIndex === 0) {
                // Up from first Pokemon in the team > go to filter
                this.setSpecies(null);
                this.setFilterMode(true);
              } else {
                this.starterIconsCursorIndex--;
                this.moveStarterIconsCursor(this.starterIconsCursorIndex);
              }
              success = true;
            }
            break;
          case Button.DOWN:
            if (0) {
              if (currentRow < numOfRows - 1) { // not last row
                if (currentRow - this.scrollCursor === 8) { // last row of visible starters
                  this.scrollCursor++;
                }
                success = this.setCursor(this.cursor + 9);
                this.updateScroll();
              } else if (numOfRows > 1) {
                // DOWN from last row of Pokemon > Wrap around to first row
                this.scrollCursor = 0;
                this.updateScroll();
                success = this.setCursor(this.cursor % 9);
              } else {
                // DOWN from single row of Pokemon > Go to filters
                this.setFilterMode(true);
                success = true;
              }
            } else {
              if (this.starterIconsCursorIndex <= this.starterSpecies.length - 2) {
                this.starterIconsCursorIndex++;
                this.moveStarterIconsCursor(this.starterIconsCursorIndex);
              } else {
                this.setSpecies(null);
              }
              success = true;
            }
            break;
          case Button.LEFT:
            if (0) {
              if (this.cursor % 9 !== 0) {
                success = this.setCursor(this.cursor - 1);
              } else {
                // LEFT from filtered Pokemon, on the left edge

                if (this.starterSpecies.length === 0) {
                  // no starter in team > wrap around to the last column
                  success = this.setCursor(this.cursor + Math.min(8, numberOfStarters - this.cursor));

                } else if (onScreenCurrentRow < 7) {
                  // at least one pokemon in team > for the first 7 rows, go to closest starter

                } else {
                  // at least one pokemon in team > from the bottom 2 rows, go to start run button
                  this.setSpecies(null);
                }
                success = true;
              }
            } else if (numberOfStarters > 0) {
              // LEFT from team > Go to closest filtered Pokemon
              const closestRowIndex = findClosestStarterRow(this.starterIconsCursorIndex, onScreenNumberOfRows);
              this.setCursor(Math.min(onScreenFirstIndex + closestRowIndex * 9 + 8, onScreenLastIndex));
              success = true;
            } else {
              // LEFT from team and no Pokemon in filter > do nothing
              success = false;
            }
            break;
          case Button.RIGHT:
            if (0) {
              // is not right edge
              if (this.cursor % 9 < (currentRow < numOfRows - 1 ? 8 : (numberOfStarters - 1) % 9)) {
                success = this.setCursor(this.cursor + 1);
              } else {
                // RIGHT from filtered Pokemon, on the right edge
                if (this.starterSpecies.length === 0) {
                  // no selected starter in team > wrap around to the first column
                  success = this.setCursor(this.cursor - Math.min(8, this.cursor % 9));

                } else if (onScreenCurrentRow < 7) {
                  // at least one pokemon in team > for the first 7 rows, go to closest starter
                  this.moveStarterIconsCursor(this.starterIconsCursorIndex);

                } else {
                  // at least one pokemon in team > from the bottom 2 rows, go to start run button
                  this.setSpecies(null);
                }
                success = true;
              }
            } else if (numberOfStarters > 0) {
              // RIGHT from team > Go to closest filtered Pokemon
              const closestRowIndex = findClosestStarterRow(this.starterIconsCursorIndex, onScreenNumberOfRows);
              this.setCursor(Math.min(onScreenFirstIndex + closestRowIndex * 9, onScreenLastIndex - (onScreenLastIndex % 9)));
              success = true;
            } else {
              // RIGHT from team and no Pokemon in filter > do nothing
              success = false;
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

  isInParty(species: PokemonSpecies): [boolean, number] {
    let removeIndex = 0;
    let isDupe = false;
    for (let s = 0; s < this.starterSpecies.length; s++) {
      if (this.starterSpecies[s] === species) {
        isDupe = true;
        removeIndex = s;
        break;
      }
    }
    return [isDupe, removeIndex];
  }

  addToParty(species: PokemonSpecies, dexAttr: bigint, abilityIndex: integer, nature: Nature, moveset: StarterMoveset) {
    if (this.starterSpecies.some(s => s.speciesId === species.speciesId)) return;

    const props = this.scene.gameData.getSpeciesDexAttrProps(species, dexAttr);

    this.dom.findObject(".selected-list .poke" + this.starterSpecies.length).setText(species.name).setColor(
      ShinyColor["Variant" + (props.shiny ? props.variant + 1 : 0)]
    );
    this.starterSpecies.push(species);

    this.starterAttr.push(dexAttr);
    this.starterAbilityIndexes.push(abilityIndex);
    this.starterNatures.push(nature);
    this.starterMovesets.push(moveset);
    if (this.speciesLoaded.get(species.speciesId)) {
      getPokemonSpeciesForm(species.speciesId, props.formIndex).cry(this.scene);
    }
    this.updateInstructions();
  }

  updatePartyIcon(species: PokemonSpecies, index: number) {
    const props = this.scene.gameData.getSpeciesDexAttrProps(species, this.getCurrentDexProps(species.speciesId));
  }

  switchMoveHandler(i: number, newMove: Moves, move: Moves) {
    const speciesId = this.lastSpecies.speciesId;
    const existingMoveIndex = this.starterMoveset?.indexOf(newMove)!; // TODO: is this bang correct?
    this.starterMoveset![i] = newMove; // TODO: is this bang correct?
    if (existingMoveIndex > -1) {
      this.starterMoveset![existingMoveIndex] = move; // TODO: is this bang correct?
    }
    const props: DexAttrProps = this.scene.gameData.getSpeciesDexAttrProps(this.lastSpecies, this.dexAttrCursor);
    // species has different forms
    if (pokemonFormLevelMoves.hasOwnProperty(speciesId)) {
      // starterMoveData doesn't have base form moves or is using the single form format
      if (!this.scene.gameData.starterData[speciesId].moveset || Array.isArray(this.scene.gameData.starterData[speciesId].moveset)) {
        this.scene.gameData.starterData[speciesId].moveset = { [props.formIndex]: this.starterMoveset?.slice(0) as StarterMoveset };
      }
      const starterMoveData = this.scene.gameData.starterData[speciesId].moveset;

      // starterMoveData doesn't have active form moves
      if (!starterMoveData.hasOwnProperty(props.formIndex)) {
        this.scene.gameData.starterData[speciesId].moveset[props.formIndex] = this.starterMoveset?.slice(0) as StarterMoveset;
      }

      // does the species' starter move data have its form's starter moves and has it been updated
      if (starterMoveData.hasOwnProperty(props.formIndex)) {
        // active form move hasn't been updated
        if (starterMoveData[props.formIndex][existingMoveIndex] !== newMove) {
          this.scene.gameData.starterData[speciesId].moveset[props.formIndex] = this.starterMoveset?.slice(0) as StarterMoveset;
        }
      }
    } else {
      this.scene.gameData.starterData[speciesId].moveset = this.starterMoveset?.slice(0) as StarterMoveset;
    }
    this.setSpeciesDetails(this.lastSpecies, undefined, undefined, undefined, undefined, undefined, undefined, false);

    // switch moves of starter if exists
    if (this.starterMovesets.length) {
      Array.from({ length: this.starterSpecies.length }, (_, i) => {
        const starterSpecies = this.starterSpecies[i];
        if (starterSpecies.speciesId === speciesId) {
          this.starterMovesets[i] = this.starterMoveset!; // TODO: is this bang correct?
        }
      });
    }
  }

  updateButtonIcon(iconSetting, gamepadType, iconElement, controlLabel): void {
    let iconPath;
    // touch controls cannot be rebound as is, and are just emulating a keyboard event.
    // Additionally, since keyboard controls can be rebound (and will be displayed when they are), we need to have special handling for the touch controls
    if (gamepadType === "touch") {
      gamepadType = "keyboard";
      switch (iconSetting) {
        case SettingKeyboard.Button_Cycle_Shiny:
          iconPath = "R.png";
          break;
        case SettingKeyboard.Button_Cycle_Form:
          iconPath = "F.png";
          break;
        case SettingKeyboard.Button_Cycle_Gender:
          iconPath = "G.png";
          break;
        case SettingKeyboard.Button_Cycle_Ability:
          iconPath = "E.png";
          break;
        case SettingKeyboard.Button_Cycle_Nature:
          iconPath = "N.png";
          break;
        case SettingKeyboard.Button_Cycle_Variant:
          iconPath = "V.png";
          break;
        case SettingKeyboard.Button_Stats:
          iconPath = "C.png";
          break;
        default:
          break;
      }
    } else {
      iconPath = this.scene.inputController?.getIconForLatestInputRecorded(iconSetting);
    }
    iconElement.setTexture(gamepadType, iconPath);
    iconElement.setPosition(this.instructionRowX, this.instructionRowY);
    controlLabel.setPosition(this.instructionRowX + this.instructionRowTextOffset, this.instructionRowY);
    iconElement.setVisible(true);
    controlLabel.setVisible(true);
    this.instructionRowY += 8;
    if (this.instructionRowY >= 24) {
      this.instructionRowY = 0;
      this.instructionRowX += 50;
    }
  }

  updateFilterButtonIcon(iconSetting, gamepadType, iconElement: any, controlLabel): void {
    let iconPath;
    // touch controls cannot be rebound as is, and are just emulating a keyboard event.
    // Additionally, since keyboard controls can be rebound (and will be displayed when they are), we need to have special handling for the touch controls
    if (gamepadType === "touch") {
      gamepadType = "keyboard";
      iconPath = "C.png";
    } else {
      iconPath = this.scene.inputController?.getIconForLatestInputRecorded(iconSetting);
    }
    controlLabel.setPosition(this.filterInstructionRowX + this.instructionRowTextOffset, this.filterInstructionRowY);
    controlLabel.setVisible(true);
    this.filterInstructionRowY += 8;
    if (this.filterInstructionRowY >= 24) {
      this.filterInstructionRowY = 0;
      this.filterInstructionRowX += 50;
    }
  }
  updateInstructions(): void {
    this.instructionRowX = 0;
    this.instructionRowY = 0;
    this.filterInstructionRowX = 0;
    this.filterInstructionRowY = 0;
    this.hideInstructions();
    let gamepadType;
    if (this.scene.inputMethod === "gamepad") {
      gamepadType = this.scene.inputController.getConfig(this.scene.inputController.selectedDevice[Device.GAMEPAD]).padType;
    } else {
      gamepadType = this.scene.inputMethod;
    }

    if (!gamepadType) {
      return;
    }

    if (this.speciesStarterDexEntry?.caughtAttr) {
      if (this.canCycleShiny) {
        this.updateButtonIcon(SettingKeyboard.Button_Cycle_Shiny, gamepadType, null, this.shinyLabel);
      }
      if (this.canCycleForm) {
        this.updateButtonIcon(SettingKeyboard.Button_Cycle_Form, gamepadType, null, this.formLabel);
      }
      if (this.canCycleGender) {
        this.updateButtonIcon(SettingKeyboard.Button_Cycle_Gender, gamepadType, null, this.genderLabel);
      }
      if (this.canCycleAbility) {
        this.updateButtonIcon(SettingKeyboard.Button_Cycle_Ability, gamepadType, null, this.abilityLabel);
      }
      if (this.canCycleNature) {
        this.updateButtonIcon(SettingKeyboard.Button_Cycle_Nature, gamepadType, null, this.natureLabel);
      }
      if (this.canCycleVariant) {
        this.updateButtonIcon(SettingKeyboard.Button_Cycle_Variant, gamepadType, null, this.variantLabel);
      }
    }

    // if filter mode is inactivated and gamepadType is not undefined, update the button icons
    if (!this.filterMode) {
      this.updateFilterButtonIcon(SettingKeyboard.Button_Stats, gamepadType, null, this.goFilterLabel);
    }

  }

  getValueLimit(): integer {
    const valueLimit = new Utils.IntegerHolder(0);
    switch (this.scene.gameMode.modeId) {
      case GameModes.ENDLESS:
      case GameModes.SPLICED_ENDLESS:
        valueLimit.value = 15;
        break;
      default:
        valueLimit.value = 10;
    }

    Challenge.applyChallenges(this.scene.gameMode, Challenge.ChallengeType.STARTER_POINTS, valueLimit);

    return valueLimit.value;
  }

  updateStarters = (name: string | Event) => {
    if (name instanceof Event) name = "";

    this.scrollCursor = 0;
    this.filteredStarterContainers = [];
    this.validStarterContainers = [];

    // pre filter for challenges
    if (this.scene.gameMode.modeId === GameModes.CHALLENGE) {
      this.starterContainers.forEach(container => {
        const species = container.species;
        let allFormsValid = false;
        if (species.forms?.length > 0) {
          for (let i = 0; i < species.forms.length; i++) {
            /* Here we are making a fake form index dex props for challenges
              * Since some pokemon rely on forms to be valid (i.e. blaze tauros for fire challenges), we make a fake form and dex props to use in the challenge
              */
            const tempFormProps = BigInt(Math.pow(2, i)) * DexAttr.DEFAULT_FORM;
            const isValidForChallenge = new Utils.BooleanHolder(true);
            Challenge.applyChallenges(this.scene.gameMode, Challenge.ChallengeType.STARTER_CHOICE, container.species, isValidForChallenge, this.scene.gameData.getSpeciesDexAttrProps(species, tempFormProps), true);
            allFormsValid = allFormsValid || isValidForChallenge.value;
          }
        } else {
          const isValidForChallenge = new Utils.BooleanHolder(true);
          Challenge.applyChallenges(this.scene.gameMode, Challenge.ChallengeType.STARTER_CHOICE, container.species, isValidForChallenge, this.scene.gameData.getSpeciesDexAttrProps(species, this.scene.gameData.getSpeciesDefaultDexAttr(container.species, false, true)), true);
          allFormsValid = isValidForChallenge.value;
        }
        if (allFormsValid) {
          this.validStarterContainers.push(container);
        } else {
          // container.setVisible(false);
        }
      });
    } else {
      this.validStarterContainers = this.starterContainers;
    }

    // this updates icons for previously saved pokemon
    for (let i = 0; i < this.validStarterContainers.length; i++) {
      const currentFilteredContainer = this.validStarterContainers[i];
      const starterSprite = currentFilteredContainer.icon;

      const currentDexAttr = this.getCurrentDexProps(currentFilteredContainer.species.speciesId);
      const props = this.scene.gameData.getSpeciesDexAttrProps(currentFilteredContainer.species, currentDexAttr);

      //starterSprite.setTexture(currentFilteredContainer.species.getIconAtlasKey(props.formIndex, props.shiny, props.variant), currentFilteredContainer.species.getIconId(props.female!, props.formIndex, props.shiny, props.variant));
      // currentFilteredContainer.checkIconId(props.female, props.formIndex, props.shiny, props.variant);
    }

    const getValues = (selector) => {
      const hobject = this.dom.findObject(selector);
      if (hobject.getDOM().tagName === "SELECT") {
        const values: string[] = [];
        const selectedOptions = hobject.getDOM() as HTMLSelectElement;
        Array.from(selectedOptions.selectedOptions).map(option => {
          values.push(option.value);
        })
        if (values[0] === "ALL") return Array.from(selectedOptions.options).map(option => option.value);
        return values;
      }

      const allChildren = hobject.getAll();
      if (!allChildren.some(e => e.getDOM().tagName !== "SELECT")) {
        const values: string[] = [];
        allChildren.map(e => {
          Array.from((e.getDOM() as HTMLSelectElement).selectedOptions).map(option => {
            values.push(option.value);
          })
        });
        return values;
      }
      return [hobject.getDOM().textContent];
    }
    // filter
    this.validStarterContainers.forEach(container => {
      // container.setVisible(false);

      container.setCost(this.scene.gameData.getSpeciesStarterValue(container.species.speciesId));

      // First, ensure you have the caught attributes for the species else default to bigint 0
      const isCaught = this.scene.gameData.dexData[container.species.speciesId]?.caughtAttr || BigInt(0);

      // Define the variables based on whether their respective variants have been caught
      const isVariant3Caught = !!(isCaught & DexAttr.VARIANT_3);
      const isVariant2Caught = !!(isCaught & DexAttr.VARIANT_2);
      const isVariantCaught = !!(isCaught & DexAttr.SHINY);
      const isUncaught = !isCaught && !isVariantCaught && !isVariant2Caught && !isVariant3Caught;
      const isPassiveUnlocked = this.scene.gameData.starterData[container.species.speciesId].passiveAttr > 0;

      if (isVariant3Caught) {
        container.setColor(ShinyColor.Variant3);
      } else if (isVariant2Caught) {
        container.setColor(ShinyColor.Variant2);
      } else if (isVariantCaught) {
        container.setColor(ShinyColor.Variant1);
      }

      if (isUncaught) {
        container.enable(false);
      }

      const isPassiveUnlockable = this.isPassiveAvailable(container.species.speciesId) && !isPassiveUnlocked;
      const isCostReduced = this.scene.gameData.starterData[container.species.speciesId].valueReduction > 0;
      const isCostReductionUnlockable = this.isValueReductionAvailable(container.species.speciesId);
      const isFavorite = this.starterPreferences[container.species.speciesId]?.favorite ?? false;



      const isWin = this.scene.gameData.starterData[container.species.speciesId].classicWinCount > 0;
      const isNotWin = this.scene.gameData.starterData[container.species.speciesId].classicWinCount === 0;
      const isUndefined = this.scene.gameData.starterData[container.species.speciesId].classicWinCount === undefined;
      const isHA = this.scene.gameData.starterData[container.species.speciesId].abilityAttr & AbilityAttr.ABILITY_HIDDEN;
      const isEggPurchasable = this.isSameSpeciesEggAvailable(container.species.speciesId);

      const fitsGen = getValues(".gen").includes(container.species.generation + "");

      const fitsType = getValues(".type").some((type: string) => container.species.isOfType((+type) - 1));

      const fitsCaught = getValues(".captured").some(caught => {
        if (caught === "0") {
          return isVariant3Caught;
        } else if (caught === "1") {
          return isVariant2Caught && !isVariant3Caught;
        } else if (caught === "2") {
          return isVariantCaught && !isVariant2Caught && !isVariant3Caught;
        } else if (caught === "3") {
          return isCaught && !isVariantCaught && !isVariant2Caught && !isVariant3Caught;
        } else if (caught === "4") {
          return isUncaught;
        }
      });

      const fitsPassive = getValues(".passive").some(unlocks => {
        if (unlocks == "2") {
          return isPassiveUnlocked;
        } else if (unlocks == "1") {
          return !isPassiveUnlocked;
        } else if (unlocks == "3") {
          return isPassiveUnlockable;
        }
      });

      const fitsCostReduction = getValues(".cost").some(cost => {
        if (cost == "1") {
          return isCostReduced;
        } else if (cost == "3") {
          return !isCostReduced;
        } else if (cost == "2") {
          return isCostReductionUnlockable;
        }
      });

      const fitsFavorite = getValues(".FAVORITE").some(misc => {
        if (misc == "0") {
          return isFavorite;
        }
        if (misc == "1") {
          return !isFavorite;
        }
      });

      const fitsWin = getValues(".WIN").some(misc => {
        if (misc == "0") {
          return isWin;
        }
        if (misc == "1") {
          return isNotWin || isUndefined;
        }
      });

      const fitsHA = getValues(".HIDDEN_ABILITY").some(misc => {
        if (misc == "0") {
          return isHA;
        }
        if (misc == "1") {
          return !isHA;
        }
      });

      const fitsEgg = getValues(".EGG").some(misc => {
        if (misc == "0") {
          return isEggPurchasable;
        }
        return true;
      });

      const fitsPokerus = getValues(".POKERUS").some(misc => {
        if (misc == "0") {
          return this.pokerusSpecies.includes(container.species);
        }
        return true;
      });

      const isSearchResult = name ? container.species.name.toLowerCase().includes(name.toLowerCase()) : true;

      if (fitsGen && fitsType && fitsCaught && fitsPassive
        && fitsCostReduction && fitsFavorite && fitsWin && fitsHA && fitsEgg && fitsPokerus
        && isSearchResult) {
        this.filteredStarterContainers.push(container);
        container.setVisible(true);
      } else {
        container.setVisible(false)
      }
    });

    const sortInfo = {
      0: { dir: -1, val: 0 },
      1: { dir: 1, val: 0 },
      2: { dir: -1, val: 1 },
      3: { dir: 1, val: 1 },
      4: { dir: -1, val: 2 },
      5: { dir: 1, val: 2 },
      6: { dir: -1, val: 3 },
      7: { dir: 1, val: 3 },
      8: { dir: -1, val: 4 },
      9: { dir: 1, val: 4 },
    }
    // sort
    const sort = sortInfo[getValues(".sort")[0] as string];
    this.filteredStarterContainers.sort((a, b) => {
      switch (sort.val) {
        default:
          break;
        case 0:
          return (a.species.speciesId - b.species.speciesId) * -sort.dir;
        case 1:
          return (a.cost - b.cost) * -sort.dir;
        case 2:
          const candyCountA = this.scene.gameData.starterData[a.species.speciesId].candyCount;
          const candyCountB = this.scene.gameData.starterData[b.species.speciesId].candyCount;
          return (candyCountA - candyCountB) * -sort.dir;
        case 3:
          const avgIVsA = this.scene.gameData.dexData[a.species.speciesId].ivs.reduce((a, b) => a + b, 0) / this.scene.gameData.dexData[a.species.speciesId].ivs.length;
          const avgIVsB = this.scene.gameData.dexData[b.species.speciesId].ivs.reduce((a, b) => a + b, 0) / this.scene.gameData.dexData[b.species.speciesId].ivs.length;
          return (avgIVsA - avgIVsB) * -sort.dir;
        case 4:
          return a.species.name.localeCompare(b.species.name) * -sort.dir;
      }
      return 0;
    });

    this.dom.findObject(".poke-list").removeAll().add(this.filteredStarterContainers)
  };

  updateScroll = () => {
    const maxColumns = 9;
    const maxRows = 9;
    const onScreenFirstIndex = this.scrollCursor * maxColumns;
    const onScreenLastIndex = Math.min(this.filteredStarterContainers.length - 1, onScreenFirstIndex + maxRows * maxColumns - 1);


    let pokerusCursorIndex = 0;
    this.filteredStarterContainers.forEach((container, i) => {
      const pos = calcStarterPosition(i, this.scrollCursor);
      container.setPosition(pos.x, pos.y);
      if (i < onScreenFirstIndex || i > onScreenLastIndex) {
        container.setVisible(false);

        if (this.pokerusSpecies.includes(container.species)) {
          pokerusCursorIndex++;
        }

        if (this.starterSpecies.includes(container.species)) {
        }
        return;
      } else {
        container.setVisible(true);

        if (this.pokerusSpecies.includes(container.species)) {
          pokerusCursorIndex++;
        }

        if (this.starterSpecies.includes(container.species)) {
        }

        const speciesId = container.species.speciesId;
        this.updateStarterValueLabel(container);

        const speciesVariants = speciesId && this.scene.gameData.dexData[speciesId].caughtAttr & DexAttr.SHINY
          ? [DexAttr.DEFAULT_VARIANT, DexAttr.VARIANT_2, DexAttr.VARIANT_3].filter(v => !!(this.scene.gameData.dexData[speciesId].caughtAttr & v))
          : [];
        for (let v = 0; v < 3; v++) {
          const hasVariant = speciesVariants.length > v;
          if (hasVariant) {
          }
        }

        // 'Candy Icon' mode
        if (this.scene.candyUpgradeDisplay === 0) {

          // Set the candy colors

          this.setUpgradeIcon(container);
        } else if (this.scene.candyUpgradeDisplay === 1) {
        }
      }
    });
  };

  setCursor(cursor: integer): boolean {
    let changed = false;

    if (this.filterMode) {
      changed = this.filterBarCursor !== cursor;
      this.filterBarCursor = cursor;

    } else {
      cursor = Math.max(Math.min(this.filteredStarterContainers.length - 1, cursor), 0);
      changed = false;

      const pos = calcStarterPosition(cursor, this.scrollCursor);

      const species = this.filteredStarterContainers[cursor]?.species;

      if (species) {
        const defaultDexAttr = this.getCurrentDexProps(species.speciesId);
        const defaultProps = this.scene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);
        const variant = this.starterPreferences[species.speciesId]?.variant ? this.starterPreferences[species.speciesId].variant as Variant : defaultProps.variant;
        const tint = getVariantTint(variant);
        this.setSpecies(species);
        this.updateInstructions();
      } else {
        console.warn("Species is undefined for cursor position", cursor);
        this.setFilterMode(true);
      }
    }

    return changed;
  }

  setFilterMode(filterMode: boolean): boolean {

    if (filterMode !== this.filterMode) {
      this.filterMode = filterMode;
      if (filterMode) {
        this.setSpecies(null);
        this.updateInstructions();
      }

      return true;
    }

    return false;
  }

  moveStarterIconsCursor(index: number): void {
    if (this.starterSpecies.length > 0) {
      this.setSpecies(this.starterSpecies[index]);
    } else {
      this.setSpecies(null);
    }
  }

  setSpecies(species: PokemonSpecies | null) {
    this.speciesStarterDexEntry = species ? this.scene.gameData.dexData[species.speciesId] : null;
    this.dexAttrCursor = species ? this.getCurrentDexProps(species.speciesId) : 0n;
    this.abilityCursor = species ? this.scene.gameData.getStarterSpeciesDefaultAbilityIndex(species) : 0;
    this.natureCursor = species ? this.scene.gameData.getSpeciesDefaultNature(species) : 0;

    const starterAttributes: StarterAttributes | null = species ? { ...this.starterPreferences[species.speciesId] } : null;
    // validate starterAttributes
    if (starterAttributes) {
      // this may cause changes so we created a copy of the attributes before
      if (starterAttributes.variant && !isNaN(starterAttributes.variant)) {
        if (![
          this.speciesStarterDexEntry!.caughtAttr & DexAttr.NON_SHINY, // TODO: is that bang correct?
          this.speciesStarterDexEntry!.caughtAttr & DexAttr.DEFAULT_VARIANT, // TODO: is that bang correct?
          this.speciesStarterDexEntry!.caughtAttr & DexAttr.VARIANT_2, // TODO: is that bang correct?
          this.speciesStarterDexEntry!.caughtAttr & DexAttr.VARIANT_3 // TODO: is that bang correct?
        ][starterAttributes.variant + 1]) { // add 1 as -1 = non-shiny
          // requested variant wasn't unlocked, purging setting
          delete starterAttributes.variant;
        }
      }

      if (typeof starterAttributes.female !== "boolean" || !(starterAttributes.female ?
        this.speciesStarterDexEntry!.caughtAttr & DexAttr.FEMALE : // TODO: is this bang correct?
        this.speciesStarterDexEntry!.caughtAttr & DexAttr.MALE // TODO: is this bang correct?
      )) {
        // requested gender wasn't unlocked, purging setting
        delete starterAttributes.female;
      }

      const abilityAttr = this.scene.gameData.starterData[species!.speciesId].abilityAttr; // TODO: is this bang correct?
      if (![
        abilityAttr & AbilityAttr.ABILITY_1,
        species!.ability2 ? (abilityAttr & AbilityAttr.ABILITY_2) : abilityAttr & AbilityAttr.ABILITY_HIDDEN, // TODO: is this bang correct?
        species!.ability2 && abilityAttr & AbilityAttr.ABILITY_HIDDEN // TODO: is this bang correct?
      ][starterAttributes.ability!]) { // TODO: is this bang correct?
        // requested ability wasn't unlocked, purging setting
        delete starterAttributes.ability;
      }

      if (!(species?.forms[starterAttributes.form!]?.isStarterSelectable && this.speciesStarterDexEntry!.caughtAttr & this.scene.gameData.getFormAttr(starterAttributes.form!))) { // TODO: are those bangs correct?
        // requested form wasn't unlocked/isn't a starter form, purging setting
        delete starterAttributes.form;
      }

      if (this.scene.gameData.getNaturesForAttr(this.speciesStarterDexEntry?.natureAttr).indexOf(starterAttributes.nature as unknown as Nature) < 0) {
        // requested nature wasn't unlocked, purging setting
        delete starterAttributes.nature;
      }
    }

    if (starterAttributes?.nature) {
      // load default nature from stater save data, if set
      this.natureCursor = starterAttributes.nature;
    }
    if (starterAttributes?.ability && !isNaN(starterAttributes.ability)) {
      // load default nature from stater save data, if set
      this.abilityCursor = starterAttributes.ability;
    }

    if (this.statsMode) {
      if (this.speciesStarterDexEntry?.caughtAttr) {
        this.showStats();
      } else {
        //@ts-ignore
        this.statsContainer.updateIvs(null); // TODO: resolve ts-ignore. what. how? huh?
      }
    }

    this.lastSpecies = species!; // TODO: is this bang correct?

    if (species && (this.speciesStarterDexEntry?.seenAttr || this.speciesStarterDexEntry?.caughtAttr)) {
      this.pokemonNumberText.setText(Utils.padInt(species.speciesId, 4));
      if (starterAttributes?.nickname) {
        const name = decodeURIComponent(escape(atob(starterAttributes.nickname)));
        this.pokemonNameText.setText(name);
      } else {
        this.pokemonNameText.setText(species.name);
      }

      if (this.speciesStarterDexEntry?.caughtAttr) {
        const luck = this.scene.gameData.getDexAttrLuck(this.speciesStarterDexEntry.caughtAttr);
        this.pokemonLuckText.setVisible(!!luck);
        this.pokemonLuckText.setText(luck.toString());
        this.pokemonLuckText.setTint(getVariantTint(Math.min(luck - 1, 2) as Variant));
        this.pokemonLuckLabelText.setVisible(this.pokemonLuckText.visible);

        //Growth translate
        let growthReadable = Utils.toReadableString(GrowthRate[species.growthRate]);
        const growthAux = growthReadable.replace(" ", "_");
        if (i18next.exists("growth:" + growthAux)) {
          growthReadable = i18next.t("growth:" + growthAux as any);
        }
        this.pokemonGrowthRateText.setText(growthReadable);

        this.pokemonGrowthRateText.setColor(getGrowthRateColor(species.growthRate));
        this.pokemonGrowthRateText.setShadowColor(getGrowthRateColor(species.growthRate, true));
        this.pokemonGrowthRateLabelText.setVisible(true);
        this.pokemonUncaughtText.setVisible(false);
        this.pokemonAbilityLabelText.setVisible(true);
        this.pokemonPassiveLabelText.setVisible(true);
        this.pokemonNatureLabelText.setVisible(true);
        this.pokemonCaughtCountText.setText(`${this.speciesStarterDexEntry.caughtCount}`);
        if (species.speciesId === Species.MANAPHY || species.speciesId === Species.PHIONE) {
        } else {
        }
        this.pokemonHatchedCountText.setText(`${this.speciesStarterDexEntry.hatchedCount}`);
        const defaultDexAttr = this.getCurrentDexProps(species.speciesId);
        const defaultProps = this.scene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);
        const variant = defaultProps.variant;
        const tint = getVariantTint(variant);
        if (pokemonPrevolutions.hasOwnProperty(species.speciesId)) {

          this.pokemonFormText.setY(25);
        } else {
          this.pokemonCandyCountText.setText(`${this.scene.gameData.starterData[species.speciesId].candyCount}`);
          this.pokemonCandyCountText.setVisible(true);
          this.pokemonFormText.setVisible(true);
          this.pokemonFormText.setY(42);
          this.pokemonHatchedCountText.setVisible(true);

          let currentFriendship = this.scene.gameData.starterData[this.lastSpecies.speciesId].friendship;
          if (!currentFriendship || currentFriendship === undefined) {
            currentFriendship = 0;
          }

          const friendshipCap = getStarterValueFriendshipCap(speciesStarters[this.lastSpecies.speciesId]);
          const candyCropY = 16 - (16 * (currentFriendship / friendshipCap));

          // if (this.pokemonCandyDarknessOverlay.visible) {
          //   this.pokemonCandyDarknessOverlay.on("pointerover", () => (this.scene as BattleScene).ui.showTooltip("", `${currentFriendship}/${friendshipCap}`, true));
          //   this.pokemonCandyDarknessOverlay.on("pointerout", () => (this.scene as BattleScene).ui.hideTooltip());
          // }

          // this.pokemonCandyDarknessOverlay.setCrop(0,0,16, candyCropY);
        }


        // Pause the animation when the species is selected
        const speciesIndex = this.allSpecies.indexOf(species);
        const icon = this.starterContainers[speciesIndex].icon;

        if (this.isUpgradeAnimationEnabled()) {
          // Reset the position of the icon
        }

        const starterIndex = this.starterSpecies.indexOf(species);

        let props: DexAttrProps;

        if (starterIndex > -1) {
          props = this.scene.gameData.getSpeciesDexAttrProps(species, this.starterAttr[starterIndex]);
          this.setSpeciesDetails(species, props.shiny, props.formIndex, props.female, props.variant, this.starterAbilityIndexes[starterIndex], this.starterNatures[starterIndex]);
        } else {
          const defaultDexAttr = this.getCurrentDexProps(species.speciesId);
          const defaultAbilityIndex = starterAttributes?.ability ?? this.scene.gameData.getStarterSpeciesDefaultAbilityIndex(species);
          // load default nature from stater save data, if set
          const defaultNature = starterAttributes?.nature || this.scene.gameData.getSpeciesDefaultNature(species);
          props = this.scene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);
          if (starterAttributes?.variant && !isNaN(starterAttributes.variant)) {
            if (props.shiny) {
              props.variant = starterAttributes.variant as Variant;
            }
          }
          props.formIndex = starterAttributes?.form ?? props.formIndex;
          props.female = starterAttributes?.female ?? props.female;

          this.setSpeciesDetails(species, props.shiny, props.formIndex, props.female, props.variant, defaultAbilityIndex, defaultNature);
        }

        const speciesForm = getPokemonSpeciesForm(species.speciesId, props.formIndex);
        this.setTypeIcons(speciesForm.type1, speciesForm!.type2!); // TODO: are those bangs correct?

        if (this.pokerusSpecies.includes(species)) {
          handleTutorial(this.scene, Tutorial.Pokerus);
        }
      } else {
        this.pokemonGrowthRateText.setText("");
        this.pokemonGrowthRateLabelText.setVisible(false);
        this.pokemonLuckLabelText.setVisible(false);
        this.pokemonLuckText.setVisible(false);
        this.pokemonUncaughtText.setVisible(true);
        this.pokemonAbilityLabelText.setVisible(false);
        this.pokemonPassiveLabelText.setVisible(false);
        this.pokemonNatureLabelText.setVisible(false);
        this.pokemonCandyCountText.setVisible(false);
        this.pokemonFormText.setVisible(false);

        const defaultDexAttr = this.scene.gameData.getSpeciesDefaultDexAttr(species, true, true);
        const defaultAbilityIndex = this.scene.gameData.getStarterSpeciesDefaultAbilityIndex(species);
        const defaultNature = this.scene.gameData.getSpeciesDefaultNature(species);
        const props = this.scene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);

        this.setSpeciesDetails(species, props.shiny, props.formIndex, props.female, props.variant, defaultAbilityIndex, defaultNature, true);
      }
    } else {
      this.pokemonNumberText.setText(Utils.padInt(0, 4));
      this.pokemonNameText.setText(species ? "???" : "");
      this.pokemonGrowthRateText.setText("");
      this.pokemonGrowthRateLabelText.setVisible(false);
      this.pokemonLuckLabelText.setVisible(false);
      this.pokemonLuckText.setVisible(false);
      this.pokemonUncaughtText.setVisible(!!species);
      this.pokemonAbilityLabelText.setVisible(false);
      this.pokemonPassiveLabelText.setVisible(false);
      this.pokemonNatureLabelText.setVisible(false);
      this.pokemonCandyCountText.setVisible(false);
      this.pokemonFormText.setVisible(false);

      this.setSpeciesDetails(species!, false, 0, false, 0, 0, 0); // TODO: is this bang correct?
    }
  }


  showMoveInfo(move: Move | null) {
    const moveN = this.dom.findObject(".move-info");
    if (!move) {
      moveN.setVisible(false);
      return;
    }
    moveN.setVisible(true);

    moveN.findObject(".type").setText(i18next.t(`pokemonInfo:Type.${Type[move.type]}`))
    moveN.findObject(".name").setText(move.name);

    const maxPP = move.pp;
    moveN.findObject(".pp").setText(`${Utils.padInt(maxPP, 2, "  ")}`);

    const power = move.power;
    const accuracy = move.accuracy;
    const category = move.category;

    moveN.findObject("#description").setText(move.effect);

    const moveLabel = i18next.t("pokemonSummary:powerAccuracyCategory") as string;
    const moveLabelArray = moveLabel.split("\n");

    const details = moveN.findObject("#details");
    details.findObject("#power span:first-child").setText(moveLabelArray[0]);
    details.findObject("#power span:last-child").setText(power.toString());
    details.findObject("#accuracy span:first-child").setText(moveLabelArray[1]);
    details.findObject("#accuracy span:last-child").setText(accuracy.toString());
    details.findObject("#category span:first-child").setText(moveLabelArray[2]);
    details.findObject("#category span:last-child").setText(category);
  }
  setSpeciesDetails(species: PokemonSpecies, shiny?: boolean, formIndex?: integer, female?: boolean, variant?: Variant, abilityIndex?: integer, natureIndex?: integer, forSeen: boolean = false): void {
    this.dom.findObject(".move-info").setVisible(false);

    const oldProps = species ? this.scene.gameData.getSpeciesDexAttrProps(species, this.dexAttrCursor) : null;
    const oldAbilityIndex = this.abilityCursor > -1 ? this.abilityCursor : this.scene.gameData.getStarterSpeciesDefaultAbilityIndex(species);
    const oldNatureIndex = this.natureCursor > -1 ? this.natureCursor : this.scene.gameData.getSpeciesDefaultNature(species);
    this.dexAttrCursor = 0n;
    this.abilityCursor = -1;
    this.natureCursor = -1;

    if (species?.forms?.find(f => f.formKey === "female")) {
      if (female !== undefined) {
        formIndex = female ? 1 : 0;
      } else if (formIndex !== undefined) {
        female = formIndex === 1;
      }
    }

    if (species) {
      this.dexAttrCursor |= (shiny !== undefined ? !shiny : !(shiny = oldProps?.shiny)) ? DexAttr.NON_SHINY : DexAttr.SHINY;
      this.dexAttrCursor |= (female !== undefined ? !female : !(female = oldProps?.female)) ? DexAttr.MALE : DexAttr.FEMALE;
      this.dexAttrCursor |= (variant !== undefined ? !variant : !(variant = oldProps?.variant)) ? DexAttr.DEFAULT_VARIANT : variant === 1 ? DexAttr.VARIANT_2 : DexAttr.VARIANT_3;
      this.dexAttrCursor |= this.scene.gameData.getFormAttr(formIndex !== undefined ? formIndex : (formIndex = oldProps!.formIndex)); // TODO: is this bang correct?
      this.abilityCursor = abilityIndex !== undefined ? abilityIndex : (abilityIndex = oldAbilityIndex);
      this.natureCursor = natureIndex !== undefined ? natureIndex : (natureIndex = oldNatureIndex);
      const [isInParty, partyIndex]: [boolean, number] = this.isInParty(species); // we use this to firstly check if the pokemon is in the party, and if so, to get the party index in order to update the icon image
      if (isInParty) {
        this.updatePartyIcon(species, partyIndex);
      }
    }

    if (this.assetLoadCancelled) {
      this.assetLoadCancelled.value = true;
      this.assetLoadCancelled = null;
    }

    this.starterMoveset = null;
    this.speciesStarterMoves = [];

    if (species) {
      const dexEntry = this.scene.gameData.dexData[species.speciesId];
      const abilityAttr = this.scene.gameData.starterData[species.speciesId].abilityAttr;

      const isCaught = this.scene.gameData.dexData[species.speciesId]?.caughtAttr || BigInt(0);
      const isVariant3Caught = !!(isCaught & DexAttr.VARIANT_3);
      const isVariant2Caught = !!(isCaught & DexAttr.VARIANT_2);
      const isDefaultVariantCaught = !!(isCaught & DexAttr.DEFAULT_VARIANT);
      const isVariantCaught = !!(isCaught & DexAttr.SHINY);
      const isMaleCaught = !!(isCaught & DexAttr.MALE);
      const isFemaleCaught = !!(isCaught & DexAttr.FEMALE);

      const starterAttributes = this.starterPreferences[species.speciesId];

      const props = this.scene.gameData.getSpeciesDexAttrProps(species, this.getCurrentDexProps(species.speciesId));
      const defaultAbilityIndex = this.scene.gameData.getStarterSpeciesDefaultAbilityIndex(species);
      const defaultNature = this.scene.gameData.getSpeciesDefaultNature(species);

      if (!dexEntry.caughtAttr) {
        if (shiny === undefined || shiny !== props.shiny) {
          shiny = props.shiny;
        }
        if (formIndex === undefined || formIndex !== props.formIndex) {
          formIndex = props.formIndex;
        }
        if (female === undefined || female !== props.female) {
          female = props.female;
        }
        if (variant === undefined || variant !== props.variant) {
          variant = props.variant;
        }
        if (abilityIndex === undefined || abilityIndex !== defaultAbilityIndex) {
          abilityIndex = defaultAbilityIndex;
        }
        if (natureIndex === undefined || natureIndex !== defaultNature) {
          natureIndex = defaultNature;
        }
      } else {
        // compare current shiny, formIndex, female, variant, abilityIndex, natureIndex with the caught ones
        // if the current ones are not caught, we need to find the next caught ones
        if (shiny) {
          if (!(isVariantCaught || isVariant2Caught || isVariant3Caught)) {
            shiny = false;
            starterAttributes.shiny = false;
            variant = 0;
            starterAttributes.variant = 0;
          } else {
            shiny = true;
            starterAttributes.shiny = true;
            if (variant === 0 && !isDefaultVariantCaught) {
              if (isVariant2Caught) {
                variant = 1;
                starterAttributes.variant = 1;
              } else if (isVariant3Caught) {
                variant = 2;
                starterAttributes.variant = 2;
              } else {
                variant = 0;
                starterAttributes.variant = 0;
              }
            } else if (variant === 1 && !isVariant2Caught) {
              if (isVariantCaught) {
                variant = 0;
                starterAttributes.variant = 0;
              } else if (isVariant3Caught) {
                variant = 2;
                starterAttributes.variant = 2;
              } else {
                variant = 0;
                starterAttributes.variant = 0;
              }
            } else if (variant === 2 && !isVariant3Caught) {
              if (isVariantCaught) {
                variant = 0;
                starterAttributes.variant = 0;
              } else if (isVariant2Caught) {
                variant = 1;
                starterAttributes.variant = 1;
              } else {
                variant = 0;
                starterAttributes.variant = 0;
              }
            }
          }
        }

        this.pokemonNameText.setColor(ShinyColor["Variant" + (shiny ? (variant || 0) + 1 : 0)]);

        let shinyOptions = `<option value=0>${i18next.t("filterBar:normal")}</option>`;
        if (isVariantCaught) {
          shinyOptions += `<option value=1>${i18next.t("SimpleTranslationEntries:commonShiny")}</option>`;
        }
        if (isVariant2Caught) {
          shinyOptions += `<option value=2>${i18next.t("SimpleTranslationEntries:rareShiny")}</option>`;
        }
        if (isVariant3Caught) {
          shinyOptions += `<option value=3>${i18next.t("SimpleTranslationEntries:epicShiny")}</option>`;
        }
        this.shinyLabel.setInnerHTML(shinyOptions).setValue(shiny ? ((variant || 0) + 1) as Variant : 0);

        if (female) {
          if (!isFemaleCaught) {
            female = false;
            starterAttributes.female = false;
          }
        } else {
          if (!isMaleCaught) {
            female = true;
            starterAttributes.female = true;
          }
        }

        if (species.forms) {
          const formCount = species.forms.length;
          let newFormIndex = formIndex ?? 0;
          if (species.forms[newFormIndex]) {
            const isValidForm = species.forms[newFormIndex].isStarterSelectable && dexEntry.caughtAttr & this.scene.gameData.getFormAttr(newFormIndex);
            if (!isValidForm) {
              do {
                newFormIndex = (newFormIndex + 1) % formCount;
                if (species.forms[newFormIndex].isStarterSelectable && dexEntry.caughtAttr & this.scene.gameData.getFormAttr(newFormIndex)) {
                  break;
                }
              } while (newFormIndex !== props.formIndex);
              formIndex = newFormIndex;
              starterAttributes.form = formIndex;
            }
          }
        }
      }

      this.pokemonNumberText.setColor(getTextColor(shiny ? TextStyle.SUMMARY_GOLD : TextStyle.SUMMARY, false));
      this.pokemonNumberText.setShadowColor(getTextColor(shiny ? TextStyle.SUMMARY_GOLD : TextStyle.SUMMARY, true));

      if (forSeen ? this.speciesStarterDexEntry?.seenAttr : this.speciesStarterDexEntry?.caughtAttr) {
        const starterIndex = this.starterSpecies.indexOf(species);

        if (starterIndex > -1) {
          this.starterAttr[starterIndex] = this.dexAttrCursor;
          this.starterAbilityIndexes[starterIndex] = this.abilityCursor;
          this.starterNatures[starterIndex] = this.natureCursor;
        }

        const assetLoadCancelled = new Utils.BooleanHolder(false);
        this.assetLoadCancelled = assetLoadCancelled;

        const isValidForChallenge = new Utils.BooleanHolder(true);
        Challenge.applyChallenges(this.scene.gameMode, Challenge.ChallengeType.STARTER_CHOICE, species, isValidForChallenge, this.scene.gameData.getSpeciesDexAttrProps(species, this.dexAttrCursor), !!this.starterSpecies.length);
        const currentFilteredContainer = this.filteredStarterContainers.find(p => p.species.speciesId === species.speciesId);
        if (currentFilteredContainer) {
        }

        this.canCycleShiny = isVariantCaught || isVariant2Caught || isVariant3Caught;
        this.canCycleGender = isMaleCaught && isFemaleCaught;
        this.canCycleAbility = [abilityAttr & AbilityAttr.ABILITY_1, (abilityAttr & AbilityAttr.ABILITY_2) && species.ability2, abilityAttr & AbilityAttr.ABILITY_HIDDEN].filter(a => a).length > 1;
        this.canCycleForm = species.forms.filter(f => f.isStarterSelectable || !pokemonFormChanges[species.speciesId]?.find(fc => fc.formKey))
          .map((_, f) => dexEntry.caughtAttr & this.scene.gameData.getFormAttr(f)).filter(f => f).length > 1;
        this.canCycleNature = this.scene.gameData.getNaturesForAttr(dexEntry.natureAttr).length > 1;
        this.canCycleVariant = !!shiny && [dexEntry.caughtAttr & DexAttr.DEFAULT_VARIANT, dexEntry.caughtAttr & DexAttr.VARIANT_2, dexEntry.caughtAttr & DexAttr.VARIANT_3].filter(v => v).length > 1;
      }

      if (dexEntry.caughtAttr && species.malePercent !== null) {
        const gender = !female ? Gender.MALE : Gender.FEMALE;
        this.pokemonGenderText.setText(getGenderSymbol(gender));
        this.pokemonGenderText.setColor(getGenderColor(gender));
        this.pokemonGenderText.setShadowColor(getGenderColor(gender, true));
      } else {
        this.pokemonGenderText.setText("");
      }

      if (dexEntry.caughtAttr) {
        const ability = this.lastSpecies.getAbility(abilityIndex!); // TODO: is this bang correct?
        this.pokemonAbilityText.setText(allAbilities[ability].name);
        this.dom.findObject(".poke-ability-desc").setText(allAbilities[ability].description);

        const isHidden = abilityIndex === (this.lastSpecies.ability2 ? 2 : 1);
        this.pokemonAbilityText.setColor(getTextColor(!isHidden ? TextStyle.SUMMARY_ALT : TextStyle.SUMMARY_GOLD));
        this.pokemonAbilityText.setShadowColor(getTextColor(!isHidden ? TextStyle.SUMMARY_ALT : TextStyle.SUMMARY_GOLD, true));

        const passiveAttr = this.scene.gameData.starterData[species.speciesId].passiveAttr;

        const passive = allAbilities[starterPassiveAbilities[this.lastSpecies.speciesId]] || {};

        let passiveText = passive.name;
        if (!(passiveAttr & PassiveAttr.UNLOCKED)) {
          passiveText += " " + i18next.t("starterSelectUiHandler:locked")
        } else if (!(passiveAttr & PassiveAttr.ENABLED)) {
          passiveText += " " + i18next.t("starterSelectUiHandler:disabled");
        }
        this.pokemonPassiveText.setText(passive ? passiveText : i18next.t("modifierType:EvolutionItem:NONE"));

        this.pokemonPassiveText.setColor(getTextColor(passiveAttr === (PassiveAttr.UNLOCKED | PassiveAttr.ENABLED) ? TextStyle.SUMMARY_ALT : TextStyle.SUMMARY_GRAY));

        this.pokemonPassiveText.setShadowColor(getTextColor(passiveAttr === (PassiveAttr.UNLOCKED | PassiveAttr.ENABLED) ? TextStyle.SUMMARY_ALT : TextStyle.SUMMARY_GRAY, true));

        this.dom.findObject(".poke-passive-desc").setText(passive ? passive.description : i18next.t("modifierType:EvolutionItem:NONE"));


        const natures = this.scene.gameData.getNaturesForAttr(this.speciesStarterDexEntry?.natureAttr);
        const ops = natures.map((n: Nature, i: number) => {
          const option = new DropDownLabel(getNatureName(n, true, true, true, this.scene.uiTheme), i, 0)
          if (i == natureIndex)
            option.select()
          return option
        })

        this.pokemonNatureText.removeAll().add(
          ops
        );

        let levelMoves: LevelMoves;
        if (pokemonFormLevelMoves.hasOwnProperty(species.speciesId) && formIndex && pokemonFormLevelMoves[species.speciesId].hasOwnProperty(formIndex)) {
          levelMoves = pokemonFormLevelMoves[species.speciesId][formIndex];
        } else {
          levelMoves = pokemonSpeciesLevelMoves[species.speciesId];
        }
        this.speciesStarterMoves.push(...levelMoves.filter(lm => lm[0] > 0 && lm[0] <= 5).map(lm => lm[1]));
        if (speciesEggMoves.hasOwnProperty(species.speciesId)) {
          for (let em = 0; em < 4; em++) {
            if (this.scene.gameData.starterData[species.speciesId].eggMoves & (1 << em)) {
              this.speciesStarterMoves.push(speciesEggMoves[species.speciesId][em]);
            }
          }
        }

        const speciesMoveData = this.scene.gameData.starterData[species.speciesId].moveset;
        const moveData: StarterMoveset | null = speciesMoveData
          ? Array.isArray(speciesMoveData)
            ? speciesMoveData
            : speciesMoveData[formIndex!] // TODO: is this bang correct?
          : null;
        const availableStarterMoves = this.speciesStarterMoves.concat(speciesEggMoves.hasOwnProperty(species.speciesId) ? speciesEggMoves[species.speciesId].filter((_, em: integer) => this.scene.gameData.starterData[species.speciesId].eggMoves & (1 << em)) : []);
        this.starterMoveset = (moveData || (this.speciesStarterMoves.slice(0, 4) as StarterMoveset)).filter(m => availableStarterMoves.find(sm => sm === m)) as StarterMoveset;
        // Consolidate move data if it contains an incompatible move
        if (this.starterMoveset.length < 4 && this.starterMoveset.length < availableStarterMoves.length) {
          this.starterMoveset.push(...availableStarterMoves.filter(sm => this.starterMoveset?.indexOf(sm) === -1).slice(0, 4 - this.starterMoveset.length));
        }

        // Remove duplicate moves
        this.starterMoveset = this.starterMoveset.filter(
          (move, i) => {
            return this.starterMoveset?.indexOf(move) === i;
          }) as StarterMoveset;

        const speciesForm = getPokemonSpeciesForm(species.speciesId, formIndex!); // TODO: is the bang correct?
        const formText = Utils.capitalizeString(species?.forms[formIndex!]?.formKey, "-", false, false); // TODO: is the bang correct?

        const speciesName = Utils.capitalizeString(Species[species.speciesId], "_", true, false);

        if (species.speciesId === Species.ARCEUS) {
          this.pokemonFormText.setText(i18next.t(`pokemonInfo:Type.${formText?.toUpperCase()}`));
        } else {
          this.pokemonFormText.setText(formText ? i18next.t(`pokemonForm:${speciesName}${formText}`) : "");
        }

        this.setTypeIcons(speciesForm.type1, speciesForm.type2!); // TODO: is this bang correct?
      } else {
        this.pokemonAbilityText.setText("");
        this.pokemonPassiveText.setText("");
        this.pokemonNatureText.setText("");
        // @ts-ignore
        this.setTypeIcons(null, null); // TODO: resolve ts-ignore.. huh!?
      }
    } else {
      this.pokemonNumberText.setColor(getTextColor(TextStyle.SUMMARY));
      this.pokemonNumberText.setShadowColor(getTextColor(TextStyle.SUMMARY, true));
      this.pokemonGenderText.setText("");
      this.pokemonAbilityText.setText("");
      this.pokemonPassiveText.setText("");
      this.pokemonNatureText.setText("");
      // @ts-ignore
      this.setTypeIcons(null, null); // TODO: resolve ts-ignore.. huh!?
    }


    const allMoveLength = this.speciesStarterMoves.length;
    const movesContainer = this.dom.findObject(".poke-moves").removeAll();
    for (let m = 0; m < allMoveLength; m++) {
      const move = allMoves[this.speciesStarterMoves[m]];

      const ui = new MoveContainer(this.scene, move, this.starterMoveset!.indexOf(move.id));
      movesContainer.add(ui);

      ui.on('click', () => {
        this.showMoveInfo(move)
      }).on('change', (type, htmlObject: HTMLObject, move: Move) => {
        if (type == SelectedEvent.Unselected) {
          if (this.missMove.length > 0) return;

          const index = this.starterMoveset!.indexOf(move.id);
          this.missMove.push({
            oldMove: move.id,
            index: index,
            newMove: undefined
          })
          htmlObject.setText("");
        }
        if (type == SelectedEvent.Selected) {

          const index = this.missMove.findIndex(swapMove => swapMove.newMove === undefined);
          const swapMove = this.missMove[index];
          if (swapMove) {
            htmlObject.setText((+swapMove.index) + 1);
            swapMove.newMove = move.id;

            this.switchMoveHandler(+swapMove.index, swapMove.newMove, swapMove.oldMove);
            this.missMove.splice(index, 1);
          }
          else
            htmlObject.setText("");
        }
      })
    }

    const hasEggMoves = species && speciesEggMoves.hasOwnProperty(species.speciesId);
    const eggMovesContainer = this.dom.findObject(".poke-egg-moves").removeAll();
    for (let em = 0; em < 4; em++) {
      const eggMove = hasEggMoves ? allMoves[speciesEggMoves[species.speciesId][em]] : null;
      const eggMoveUnlocked = eggMove && this.scene.gameData.starterData[species.speciesId].eggMoves & (1 << em);

      const move = new EggMoveContainer(this.scene, eggMove, !!eggMoveUnlocked);
      eggMovesContainer.add(
        move
      );
      move.on('click', (e) => {
        this.showMoveInfo(eggMove)
      })
    }

    // this.pokemonAdditionalMoveCountLabel.setText(`(+${Math.max(this.speciesStarterMoves.length - 4, 0)})`);
    // this.pokemonAdditionalMoveCountLabel.setVisible(this.speciesStarterMoves.length > 4);

    this.tryUpdateValue();

    this.updateInstructions();

    this.dom.findObject(".ivs")
      .setInnerHTML(
        species?this.scene.gameData.dexData[species.speciesId].ivs.map((iv, i) => {
          return `<span class="iv${i}">${IVKey[i]
            }: ${iv}</span>`;
        }).join(" "):""
      );

    let dom = this.dom.find(".type-container .type1");
    dom.className = "type1 iconfont icon-pt-" + species.type1;
    dom.style.color = "#" + getPokeTypeColor(species.type1).toString(16);
    dom = this.dom.find(".type-container .type2");
    if (species.type2 && species.type2 != species.type1) {
      dom.style.display = "block";
      dom.className = "type2 iconfont icon-pt-" + species.type2;
      dom.style.color = "#" + getPokeTypeColor(species.type2).toString(16);
    } else {
      dom.style.display = "none";
    }

    this.updateStarter();
  }

  setTypeIcons(type1: Type, type2: Type): void {
    if (type1 !== null) {
    } else {
    }
    if (type2 !== null) {
    } else {
    }
  }

  updateStarter() {
    let emptyStart = -1;
    this.starterSpecies.map((species, spi) => {
      const props = this.scene.gameData.getSpeciesDexAttrProps(species, this.starterAttr[spi]);

      this.dom.findObject(".selected-list .poke" + spi)
        .setText(species.name)
        .setColor(
          ShinyColor["Variant" + (props.shiny ? props.variant + 1 : 0)]
        )
      emptyStart = spi;
    })
    for (let i = emptyStart + 1; i < 6; i++) {
      this.dom.findObject(".selected-list .poke" + i).setText("");
    }
  }
  popStarter(index: number): void {
    this.starterSpecies.splice(index, 1);
    this.starterAttr.splice(index, 1);
    this.starterAbilityIndexes.splice(index, 1);
    this.starterNatures.splice(index, 1);
    this.starterMovesets.splice(index, 1);

    this.updateStarter();

    this.tryUpdateValue();
  }

  updateStarterValueLabel(starter: StarterContainer): void {
    const speciesId = starter.species.speciesId;
    const baseStarterValue = speciesStarters[speciesId];
    const starterValue = this.scene.gameData.getSpeciesStarterValue(speciesId);
    starter.setCost(starterValue);
    let valueStr = starterValue.toString();
    if (valueStr.startsWith("0.")) {
      valueStr = valueStr.slice(1);
    }
    let textStyle: TextStyle;
    switch (baseStarterValue - starterValue) {
      case 0:
        textStyle = TextStyle.WINDOW;
        break;
      case 1:
      case 0.5:
        textStyle = TextStyle.SUMMARY_BLUE;
        break;
      default:
        textStyle = TextStyle.SUMMARY_GOLD;
        break;
    }
    if (baseStarterValue - starterValue > 0) {
    }
  }

  tryUpdateValue(add?: integer, addingToParty?: boolean): boolean {
    const value = this.starterSpecies.map(s => s.generation).reduce((total: integer, gen: integer, i: integer) => total += this.scene.gameData.getSpeciesStarterValue(this.starterSpecies[i].speciesId), 0);

    const newValue = value + (add || 0);
    const valueLimit = this.getValueLimit();
    const overLimit = newValue > valueLimit;
    let newValueStr = newValue.toString();
    if (newValueStr.startsWith("0.")) {
      newValueStr = newValueStr.slice(1);
    }
    // this.scene.time.delayedCall(Utils.fixedInt(500), () => this.tryUpdateValue());
    if (overLimit) {
      return false;
    }
    let isPartyValid: boolean = this.isPartyValid(); // this checks to see if the party is valid
    if (addingToParty) { // this does a check to see if the pokemon being added is valid; if so, it will update the isPartyValid boolean
      const isNewPokemonValid = new Utils.BooleanHolder(true);
      const species = this.lastSpecies;
      Challenge.applyChallenges(this.scene.gameMode, Challenge.ChallengeType.STARTER_CHOICE, species, isNewPokemonValid, this.scene.gameData.getSpeciesDexAttrProps(species, this.getCurrentDexProps(species.speciesId)), false);
      isPartyValid = isPartyValid || isNewPokemonValid.value;
    }

    /**
     * this loop is used to set the Sprite's alpha value and check if the user can select other pokemon more.
     */
    this.canAddParty = false;
    const remainValue = valueLimit - newValue;
    for (let s = 0; s < this.allSpecies.length; s++) {
      /** Cost of pokemon species */
      const speciesStarterValue = this.scene.gameData.getSpeciesStarterValue(this.allSpecies[s].speciesId);
      /** Used to detect if this pokemon is registered in starter */
      const speciesStarterDexEntry = this.scene.gameData.dexData[this.allSpecies[s].speciesId];
      /** {@linkcode Phaser.GameObjects.Sprite} object of Pokémon for setting the alpha value */

      /**
       * If remainValue greater than or equal pokemon species and the pokemon is legal for this challenge, the user can select.
       * so that the alpha value of pokemon sprite set 1.
       *
       * However, if isPartyValid is false, that means none of the party members are valid for the run. In this case, we should
       * check the challenge to make sure evolutions and forms aren't being checked for mono type runs.
       * This will let us set the sprite's alpha to show it can't be selected
       *
       * If speciesStarterDexEntry?.caughtAttr is true, this species registered in stater.
       * we change to can AddParty value to true since the user has enough cost to choose this pokemon and this pokemon registered too.
       */
      const isValidForChallenge = new Utils.BooleanHolder(true);
      Challenge.applyChallenges(this.scene.gameMode, Challenge.ChallengeType.STARTER_CHOICE, this.allSpecies[s], isValidForChallenge, this.scene.gameData.getSpeciesDexAttrProps(this.allSpecies[s], this.getCurrentDexProps(this.allSpecies[s].speciesId)), isPartyValid);

      const canBeChosen = remainValue >= speciesStarterValue && isValidForChallenge.value;

      const isPokemonInParty = this.isInParty(this.allSpecies[s])[0]; // this will get the valud of isDupe from isInParty. This will let us see if the pokemon in question is in our party already so we don't grey out the sprites if they're invalid

      /* This code does a check to tell whether or not a sprite should be lit up or greyed out. There are 3 ways a pokemon's sprite should be lit up:
        * 1) If it's in your party, it's a valid pokemon (i.e. for challenge) and you have enough points to have it
        * 2) If it's in your party, it's not valid (i.e. for challenges), and you have enough points to have it
        * 3) If it's not in your party, but it's a valid pokemon and you have enough points for it
        * Any other time, the sprite should be greyed out.
        * For example, if it's in your party, valid, but costs too much, or if it's not in your party and not valid, regardless of cost
      */
      if (canBeChosen || (isPokemonInParty && remainValue >= speciesStarterValue)) {
        if (speciesStarterDexEntry?.caughtAttr) {
          this.canAddParty = true;
        }
      } else {
        /**
         * If it can't be chosen, the user can't select.
         * so that the alpha value of pokemon sprite set 0.375.
         */
      }
    }

    this.valueLimitLabel.setText(`${newValueStr}/${valueLimit}`);
    this.valueLimitLabel.setColor(getTextColor(!overLimit ? TextStyle.TOOLTIP_CONTENT : TextStyle.SUMMARY_PINK));
    this.valueLimitLabel.setShadowColor(getTextColor(!overLimit ? TextStyle.TOOLTIP_CONTENT : TextStyle.SUMMARY_PINK, true));

    this.value = newValue;
    return true;
  }

  tryExit(): boolean {
    this.blockInput = true;
    const ui = this.getUi();

    const backToMenu = () => {
      ui.setMode(Mode.STARTER_SELECT);
      this.scene.clearPhaseQueue();
      if (this.scene.gameMode.isChallenge) {
        this.scene.pushPhase(new SelectChallengePhase(this.scene));
      } else {
        this.scene.pushPhase(new TitlePhase(this.scene));
      }
      this.clearText();
      this.scene.getCurrentPhase()?.end();
      return true;
    }
    const cancel = () => {
      ui.setMode(Mode.STARTER_SELECT);
      this.clearText();
      return this.blockInput = false;
    };

    if (!this.starterSpecies.length) return backToMenu();

    new ConfirmDialog(i18next.t("starterSelectUiHandler:confirmExit"),
      backToMenu, cancel
    )
    return true;
  }

  tryStart(manualTrigger: boolean = false): boolean {
    if (!this.starterSpecies.length) {
      return false;
    }

    const ui = this.getUi();

    const cancel = () => {
      ui.setMode(Mode.STARTER_SELECT);
      if (!manualTrigger) {
        this.popStarter(this.starterSpecies.length - 1);
      }
      this.clearText();
    };

    const canStart = this.isPartyValid();

    if (canStart) {
      new ConfirmDialog(i18next.t("starterSelectUiHandler:confirmStartTeam"),
        () => {
          const startRun = () => {
            this.scene.money = this.scene.gameMode.getStartingMoney();
            ui.setMode(Mode.STARTER_SELECT);
            const thisObj = this;
            const originalStarterSelectCallback = this.starterSelectCallback;
            this.starterSelectCallback = null;
            originalStarterSelectCallback && originalStarterSelectCallback(new Array(this.starterSpecies.length).fill(0).map(function (_, i) {
              const starterSpecies = thisObj.starterSpecies[i];
              return {
                species: starterSpecies,
                dexAttr: thisObj.starterAttr[i],
                abilityIndex: thisObj.starterAbilityIndexes[i],
                passive: !(thisObj.scene.gameData.starterData[starterSpecies.speciesId].passiveAttr ^ (PassiveAttr.ENABLED | PassiveAttr.UNLOCKED)),
                nature: thisObj.starterNatures[i] as Nature,
                moveset: thisObj.starterMovesets[i],
                pokerus: thisObj.pokerusSpecies.includes(starterSpecies),
                nickname: thisObj.starterPreferences[starterSpecies.speciesId]?.nickname,
              };
            }));
          };
          startRun();
        }, cancel
      )
    } else {
      //const handler = this.scene.ui.getHandler();
      //handler.tutorialActive = true;
      this.scene.ui.showText(i18next.t("starterSelectUiHandler:invalidParty"), null, () => this.scene.ui.showText("", 0, () => { }), null, true);
    }
    return true;
  }

  /* This block checks to see if your party is valid
   * It checks each pokemon against the challenge - noting that due to monotype challenges it needs to check the pokemon while ignoring their evolutions/form change items
  */
  isPartyValid(): boolean {
    let canStart = false;
    for (let s = 0; s < this.starterSpecies.length; s++) {
      const isValidForChallenge = new Utils.BooleanHolder(true);
      const species = this.starterSpecies[s];
      Challenge.applyChallenges(this.scene.gameMode, Challenge.ChallengeType.STARTER_CHOICE, species, isValidForChallenge, this.scene.gameData.getSpeciesDexAttrProps(species, this.getCurrentDexProps(species.speciesId)), false);
      canStart = canStart || isValidForChallenge.value;
    }
    return canStart;
  }

  /* this creates a temporary dex attr props that we use to check whether a pokemon is valid for a challenge.
  * when checking for certain challenges (i.e. mono type), we need to check for form changes AND evolutions
  * However, since some pokemon can evolve based on their intial gender/form, we need a way to look for that
  * This temporary dex attr will therefore ONLY look at gender and form, since there's no cases of shinies/variants
  * having different evolutions to their non shiny/variant part, and so those can be ignored
  * Since the current form and gender is stored in the starter preferences, this is where we get the values from
  */
  getCurrentDexProps(speciesId: number): bigint {
    let props = 0n;

    if (this.starterPreferences[speciesId]?.female) { // this checks the gender of the pokemon
      props += DexAttr.FEMALE;
    } else {
      props += DexAttr.MALE;
    }
    if (this.starterPreferences[speciesId]?.shiny) {
      props += DexAttr.SHINY;
      if (this.starterPreferences[speciesId]?.variant) {
        props += BigInt(Math.pow(2, this.starterPreferences[speciesId]?.variant)) * DexAttr.DEFAULT_VARIANT;
      } else {
        props += DexAttr.DEFAULT_VARIANT;
      }
    } else {
      props += DexAttr.NON_SHINY;
      if (this.starterPreferences[speciesId]?.variant) {
        delete this.starterPreferences[speciesId].variant;
      }
      props += DexAttr.DEFAULT_VARIANT; // we add the default variant here because non shiny versions are listed as default variant
    }
    if (this.starterPreferences[speciesId]?.form) { // this checks for the form of the pokemon
      props += BigInt(Math.pow(2, this.starterPreferences[speciesId]?.form)) * DexAttr.DEFAULT_FORM;
    } else {
      props += DexAttr.DEFAULT_FORM;
    }

    return props;
  }

  showStats(): void {
    if (!this.speciesStarterDexEntry) {
      return;
    }
  }

  clearText() {
  }

  hideInstructions(): void {

  }

  clear(): void {
    StarterPrefs.save(this.starterPreferences);

    this.cursor = -1;
    this.hideInstructions();
    this.blockInput = false;

    while (this.starterSpecies.length) {
      this.popStarter(this.starterSpecies.length - 1);
    }

    this.dom.destroy(false);
  }

  checkIconId(icon: Phaser.GameObjects.Sprite, species: PokemonSpecies, female: boolean, formIndex: number, shiny: boolean, variant: number) {
    if (icon.frame.name !== species.getIconId(female, formIndex, shiny, variant)) {
      console.log(`${species.name}'s icon ${icon.frame.name} does not match getIconId with female: ${female}, formIndex: ${formIndex}, shiny: ${shiny}, variant: ${variant}`);
      icon.setTexture(species.getIconAtlasKey(formIndex, false, variant));
      icon.setFrame(species.getIconId(female, formIndex, false, variant));
    }
  }
  showOptions = (e: PointerEvent, rect: DOMRect): void => {
    const ui = this.getUi();
    let options: any[] = []; // TODO: add proper type

    if (!rect) {
      rect = (e.target as HTMLElement).getBoundingClientRect();
    }

    const cancelOption = {
      label: i18next.t("menu:cancel"),
      handler: () => {
        this.contextMenu.setVisible(false);
        return true;
      }
    }

    let starterContainer;
    const starterData = this.scene.gameData.starterData[this.lastSpecies.speciesId];
    // prepare persistent starter data to store changes
    let starterAttributes = this.starterPreferences[this.lastSpecies.speciesId];

    // this gets the correct pokemon cursor depending on whether you're in the starter screen or the party icons
    // if (1) {
    //   starterContainer = this.filteredStarterContainers[this.cursor];
    // } else {
      // if species is in filtered starters, get the starter container from the filtered starters, it can be undefined if the species is not in the filtered starters
      starterContainer = this.filteredStarterContainers[this.filteredStarterContainers.findIndex(container => container.species === this.lastSpecies)];
    // }

    const [isDupe, removeIndex]: [boolean, number] = this.isInParty(this.lastSpecies); // checks to see if the pokemon is a duplicate; if it is, returns the index that will be removed

    const isPartyValid = this.isPartyValid();
    const isValidForChallenge = new Utils.BooleanHolder(true);

    Challenge.applyChallenges(this.scene.gameMode, Challenge.ChallengeType.STARTER_CHOICE, this.lastSpecies, isValidForChallenge, this.scene.gameData.getSpeciesDexAttrProps(this.lastSpecies, this.getCurrentDexProps(this.lastSpecies.speciesId)), isPartyValid);

    const currentPartyValue = this.starterSpecies.map(s => s.generation).reduce((total: number, gen: number, i: number) => total += this.scene.gameData.getSpeciesStarterValue(this.starterSpecies[i].speciesId), 0);
    const newCost = this.scene.gameData.getSpeciesStarterValue(this.lastSpecies.speciesId);
    if (!isDupe && isValidForChallenge.value && currentPartyValue + newCost <= this.getValueLimit() && this.starterSpecies.length < 6) { // this checks to make sure the pokemon doesn't exist in your party, it's valid for the challenge and that it won't go over the cost limit; if it meets all these criteria it will add it to your party
      options = [
        {
          label: i18next.t("starterSelectUiHandler:addToParty"),
          handler: () => {
            ui.setMode(Mode.STARTER_SELECT);
            const isOverValueLimit = this.tryUpdateValue(this.scene.gameData.getSpeciesStarterValue(this.lastSpecies.speciesId), true);
            if (!isDupe && isValidForChallenge.value && isOverValueLimit) {
              this.addToParty(this.lastSpecies, this.dexAttrCursor, this.abilityCursor, this.natureCursor as unknown as Nature, this.starterMoveset?.slice(0) as StarterMoveset);
            } else {
              //ui.playError(); // this should be redundant as there is now a trigger for when a pokemon can't be added to party
            }
            return true;
          },
          overrideSound: true
        }];
    } else if (isDupe) { // if it already exists in your party, it will give you the option to remove from your party
      options = [{
        label: i18next.t("starterSelectUiHandler:removeFromParty"),
        handler: () => {
          this.popStarter(removeIndex);
          ui.setMode(Mode.STARTER_SELECT);
          return true;
        }
      }];
    }

    if (this.canCycleNature) {

    }
    const candyCount = starterData.candyCount;
    const passiveAttr = starterData.passiveAttr;
    if (passiveAttr & PassiveAttr.UNLOCKED) { // this is for enabling and disabling the passive
      if (!(passiveAttr & PassiveAttr.ENABLED)) {
        options.push({
          label: i18next.t("starterSelectUiHandler:enablePassive"),
          handler: () => {
            starterData.passiveAttr |= PassiveAttr.ENABLED;
            ui.setMode(Mode.STARTER_SELECT);
            this.setSpeciesDetails(this.lastSpecies, undefined, undefined, undefined, undefined, undefined, undefined);
            return true;
          }
        });
      } else {
        options.push({
          label: i18next.t("starterSelectUiHandler:disablePassive"),
          handler: () => {
            starterData.passiveAttr ^= PassiveAttr.ENABLED;
            ui.setMode(Mode.STARTER_SELECT);
            this.setSpeciesDetails(this.lastSpecies, undefined, undefined, undefined, undefined, undefined, undefined);
            return true;
          }
        });
      }
    }
    // if container.favorite is false, show the favorite option
    const isFavorite = starterAttributes?.favorite ?? false;
    if (!isFavorite) {
      options.push({
        label: i18next.t("starterSelectUiHandler:addToFavorites"),
        handler: () => {
          starterAttributes.favorite = true;
          // if the starter container not exists, it means the species is not in the filtered starters
          if (starterContainer) {
            starterContainer.favoriteIcon.setVisible(starterAttributes.favorite);
          }
          ui.setMode(Mode.STARTER_SELECT);
          return true;
        }
      });
    } else {
      options.push({
        label: i18next.t("starterSelectUiHandler:removeFromFavorites"),
        handler: () => {
          starterAttributes.favorite = false;
          // if the starter container not exists, it means the species is not in the filtered starters
          if (starterContainer) {
            starterContainer.favoriteIcon.setVisible(starterAttributes.favorite);
          }
          ui.setMode(Mode.STARTER_SELECT);
          return true;
        }
      });
    }
    options.push({
      label: i18next.t("menu:rename"),
      handler: () => {
        ui.playSelect();
        let nickname = starterAttributes.nickname ? String(starterAttributes.nickname) : "";
        nickname = decodeURIComponent(escape(atob(nickname)));

        const sanitizedName = prompt(i18next.t("menu:renamePokemon"), nickname)
        if (sanitizedName) {
          starterAttributes.nickname = sanitizedName;
          const name = decodeURIComponent(escape(atob(starterAttributes.nickname)));
          if (name.length > 0) {
            this.pokemonNameText.setText(name);
          } else {
            this.pokemonNameText.setText(this.lastSpecies.name);
          }
        }

        return true;
      }
    });
    const showUseCandies = () => { // this lets you use your candies
      const options: any[] = []; // TODO: add proper type
      if (!(passiveAttr & PassiveAttr.UNLOCKED)) {
        const passiveCost = getPassiveCandyCount(speciesStarters[this.lastSpecies.speciesId]);
        options.push({
          label: `x${passiveCost} ${i18next.t("starterSelectUiHandler:unlockPassive")} (${allAbilities[starterPassiveAbilities[this.lastSpecies.speciesId]].name})`,
          disabled: candyCount < passiveCost,
          handler: () => {
            if (Overrides.FREE_CANDY_UPGRADE_OVERRIDE || candyCount >= passiveCost) {
              starterData.passiveAttr |= PassiveAttr.UNLOCKED | PassiveAttr.ENABLED;
              if (!Overrides.FREE_CANDY_UPGRADE_OVERRIDE) {
                starterData.candyCount -= passiveCost;
              }
              this.pokemonCandyCountText.setText(`x${starterData.candyCount}`);
              this.scene.gameData.saveSystem().then(success => {
                if (!success) {
                  return this.scene.reset(true);
                }
              });
              ui.setMode(Mode.STARTER_SELECT);
              this.setSpeciesDetails(this.lastSpecies, undefined, undefined, undefined, undefined, undefined, undefined);

              // if starterContainer exists, update the passive background
              if (starterContainer) {
                // Update the candy upgrade display
                if (this.isUpgradeIconEnabled()) {
                  this.setUpgradeIcon(starterContainer);
                }
                if (this.isUpgradeAnimationEnabled()) {
                  this.setUpgradeAnimation(starterContainer.icon, this.lastSpecies, true);
                }

                starterContainer.starterPassiveBgs.setVisible(!!this.scene.gameData.starterData[this.lastSpecies.speciesId].passiveAttr);
              }
              return true;
            }
            return false;
          },
          item: "candy",
        });
      }
      const valueReduction = starterData.valueReduction;
      if (valueReduction < 2) {
        const reductionCost = getValueReductionCandyCounts(speciesStarters[this.lastSpecies.speciesId])[valueReduction];
        options.push({
          label: `x${reductionCost} ${i18next.t("starterSelectUiHandler:reduceCost")}`,
          disabled: candyCount < reductionCost,
          handler: () => {
            if (Overrides.FREE_CANDY_UPGRADE_OVERRIDE || candyCount >= reductionCost) {
              starterData.valueReduction++;
              if (!Overrides.FREE_CANDY_UPGRADE_OVERRIDE) {
                starterData.candyCount -= reductionCost;
              }
              this.pokemonCandyCountText.setText(`x${starterData.candyCount}`);
              this.scene.gameData.saveSystem().then(success => {
                if (!success) {
                  return this.scene.reset(true);
                }
              });
              this.tryUpdateValue(0);
              ui.setMode(Mode.STARTER_SELECT);
              this.scene.playSound("buy");

              // if starterContainer exists, update the value reduction background
              if (starterContainer) {
                this.updateStarterValueLabel(starterContainer);

                // If the notification setting is set to 'On', update the candy upgrade display
                if (this.scene.candyUpgradeNotification === 2) {
                  if (this.isUpgradeIconEnabled()) {
                    this.setUpgradeIcon(starterContainer);
                  }
                  if (this.isUpgradeAnimationEnabled()) {
                    this.setUpgradeAnimation(starterContainer.icon, this.lastSpecies, true);
                  }
                }
              }
              return true;
            }
            return false;
          },
          item: "candy",
        });
      }

      // Same species egg menu option.
      const sameSpeciesEggCost = getSameSpeciesEggCandyCounts(speciesStarters[this.lastSpecies.speciesId]);
      options.push({
        disabled: candyCount < sameSpeciesEggCost,
        label: `x${sameSpeciesEggCost} ${i18next.t("starterSelectUiHandler:sameSpeciesEgg")}`,
        handler: () => {
          if (this.scene.gameData.eggs.length < 99 && (Overrides.FREE_CANDY_UPGRADE_OVERRIDE || candyCount >= sameSpeciesEggCost)) {
            if (!Overrides.FREE_CANDY_UPGRADE_OVERRIDE) {
              starterData.candyCount -= sameSpeciesEggCost;
            }
            this.pokemonCandyCountText.setText(`x${starterData.candyCount}`);

            const egg = new Egg({ scene: this.scene, species: this.lastSpecies.speciesId, sourceType: EggSourceType.SAME_SPECIES_EGG });
            egg.addEggToGameData(this.scene);

            this.scene.gameData.saveSystem().then(success => {
              if (!success) {
                return this.scene.reset(true);
              }
            });
            ui.setMode(Mode.STARTER_SELECT);
            this.scene.playSound("buy");

            return true;
          }
          return false;
        },
        item: "candy",
      });
      options.push(cancelOption);

      this.showContextMenu(e, options, rect)
    };
    if (!pokemonPrevolutions.hasOwnProperty(this.lastSpecies.speciesId)) {
      options.push({
        label: i18next.t("starterSelectUiHandler:useCandies"),
        handler: () => {
          ui.setMode(Mode.STARTER_SELECT).then(() => showUseCandies());
          return true;
        }
      });
    }
    options.push(cancelOption);

    this.showContextMenu(e, options, rect)
  }
  showContextMenu(e: PointerEvent, options: { disabled: boolean, label: string, handler: () => boolean }[], domRect: DOMRect): void {
    let context = this.contextMenu;
    if (!context) {
      context = this.contextMenu = new HTMLContainer().addClass("context-menu");

      const dom = context.getDOM();
      document.body.appendChild(dom);

      document.addEventListener('mouseup', () => context.hide());
    }
    context.setVisible(true);
    context.removeAll();

    options.map((option, index) => {
      const button = new HTMLContainer().setText(option.label)
        .disableEvent(option.disabled)
        .on('click', () => {
          option.handler();
          context.hide();
        })
      context.add(button)
    });

    context.setX(domRect.right);
    context.setY(domRect.top);
  }
}
