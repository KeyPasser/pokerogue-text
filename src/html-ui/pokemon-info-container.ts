import { getVariantTint } from "#app/data/variant";
import BattleScene from "../battle-scene";
import { Gender, getGenderColor, getGenderSymbol } from "../data/gender";
import { getNatureName } from "../data/nature";
import Pokemon from "../field/pokemon";
import i18next from "i18next";
import { DexAttr } from "../system/game-data";
import * as Utils from "../utils";
import { HTMLContainer } from "./Root";
import { getTextColor, TextStyle } from "#app/ui/text.js";
import ConfirmUiHandler from "#app/ui/confirm-ui-handler.js";
import { bbcodeToHtml } from "./TextPlugin";
import './pokemon-info-container.css'
import TextBattleScene from "#app/html-ui/text-battle-scene";
import { ShinyColor } from "./Constants";
import { setPokemonNameComponent } from "./widgets/pokeName";

interface LanguageSetting {
  infoContainerTextSize: string;
  infoContainerLabelXPos?: integer;
  infoContainerTextXPos?: integer;
}

const languageSettings: { [key: string]: LanguageSetting } = {
  "en": {
    infoContainerTextSize: "64px"
  },
  "de": {
    infoContainerTextSize: "64px"
  },
  "es": {
    infoContainerTextSize: "64px"
  },
  "fr": {
    infoContainerTextSize: "64px"
  },
  "it": {
    infoContainerTextSize: "64px"
  },
  "zh": {
    infoContainerTextSize: "64px"
  },
  "pt": {
    infoContainerTextSize: "60px",
    infoContainerLabelXPos: -15,
    infoContainerTextXPos: -12,
  },
};

export default class HPokemonInfoContainer extends HTMLContainer {
  private readonly infoWindowWidth = 104;

  // private pokemonFormLabelText: Phaser.GameObjects.Text;
  // private pokemonFormText: Phaser.GameObjects.Text;
  // private pokemonGenderText: Phaser.GameObjects.Text;
  // private pokemonGenderNewText: Phaser.GameObjects.Text;
  // private pokemonAbilityLabelText: Phaser.GameObjects.Text;
  // private pokemonAbilityText: Phaser.GameObjects.Text;
  // private pokemonNatureLabelText: Phaser.GameObjects.Text;
  // private pokemonNatureText: BBCodeText;
  // private pokemonShinyIcon: Phaser.GameObjects.Image;
  // private pokemonShinyNewIcon: Phaser.GameObjects.Text;
  // private pokemonFusionShinyIcon: Phaser.GameObjects.Image;
  // private pokemonMovesContainer: Phaser.GameObjects.Container;
  // private pokemonMovesContainers: Phaser.GameObjects.Container[];
  // private pokemonMoveBgs: Phaser.GameObjects.NineSlice[];
  // private pokemonMoveLabels: Phaser.GameObjects.Text[];

  private numCharsBeforeCutoff = 16;

  private initialX: number;

  public shown: boolean;
  scene:TextBattleScene

  constructor(scene: TextBattleScene, x: number = 372, y: number = 66) {
    super();
    this.initialX = x;
    this.scene = scene;
  }

  setup(): void {
    this.setName("pkmn-info");
    const currentLanguage = i18next.resolvedLanguage!; // TODO: is this bang correct?
    const langSettingKey = Object.keys(languageSettings).find(lang => currentLanguage?.includes(lang))!; // TODO: is this bang correct?
    const textSettings = languageSettings[langSettingKey];

    i18next.t("pokemonInfoContainer:moveset")

    this.setName("poke-info-container");

  }
  
  show(pokemon: Pokemon, showMoves: boolean = false, speedMultiplier: number = 1): Promise<void> {
    return new Promise<void>(resolve => {
      const caughtAttr = BigInt(pokemon.scene.gameData.dexData[pokemon.species.speciesId].caughtAttr);

      const lineOne = new HTMLContainer(document.createElement('div'), 0);
      lineOne.setName("poke-info-line1");

      const nameComponent = new HTMLContainer(document.createElement('div')).setText(pokemon.species.name);
      setPokemonNameComponent(pokemon,nameComponent);
      
      lineOne.add(nameComponent);

      if (pokemon.gender > Gender.GENDERLESS) {
        let dom = new HTMLContainer(document.createElement('div'), 0);
        lineOne.add(dom);

        dom.setText(getGenderSymbol(pokemon.gender));
        dom.setColor(getGenderColor(pokemon.gender));
        dom.setShadowColor(getGenderColor(pokemon.gender, true));
        dom.setVisible(true);

        const newGender = BigInt(1 << pokemon.gender) * DexAttr.MALE;

        dom = new HTMLContainer(document.createElement('div'), 0);
        lineOne.add(dom);
        
        dom.setText("(+)");
        dom.setColor(getTextColor(TextStyle.SUMMARY_BLUE, false, this.scene.uiTheme));
        dom.setShadowColor(getTextColor(TextStyle.SUMMARY_BLUE, true, this.scene.uiTheme));
        dom.setVisible((newGender & caughtAttr) === BigInt(0));
      } else {
      }

      let pokemonFormLabelText = new HTMLContainer(document.createElement('div'), 0);
      let pokemonFormText = new HTMLContainer(document.createElement('div'), 0);

      if (pokemon.species.forms?.[pokemon.formIndex]?.formName) {
        pokemonFormLabelText.setVisible(true);
        pokemonFormText.setVisible(true);

        const newForm = BigInt(1 << pokemon.formIndex) * DexAttr.DEFAULT_FORM;

        if ((newForm & caughtAttr) === BigInt(0)) {
          pokemonFormLabelText.setColor(getTextColor(TextStyle.SUMMARY_BLUE, false, this.scene.uiTheme));
          pokemonFormLabelText.setShadowColor(getTextColor(TextStyle.SUMMARY_BLUE, true, this.scene.uiTheme));
        } else {
          pokemonFormLabelText.setColor(getTextColor(TextStyle.WINDOW, false, this.scene.uiTheme));
          pokemonFormLabelText.setShadowColor(getTextColor(TextStyle.WINDOW, true, this.scene.uiTheme));
        }

        const formName = pokemon.species.forms?.[pokemon.formIndex]?.formName;
        pokemonFormText.setText(formName.length > this.numCharsBeforeCutoff ? formName.substring(0, this.numCharsBeforeCutoff - 3) + "..." : formName);
        if (formName.length > this.numCharsBeforeCutoff) {

          pokemonFormText.on("pointerover", () => (this.scene as BattleScene).ui.showTooltip("", pokemon.species.forms?.[pokemon.formIndex]?.formName, true));
          pokemonFormText.on("pointerout", () => (this.scene as BattleScene).ui.hideTooltip());
        } else {
        }
      } else {
        pokemonFormLabelText.setVisible(false);
        pokemonFormText.setVisible(false);
      }

      lineOne.add(pokemonFormLabelText);
      lineOne.add(pokemonFormText);

      let pokemonAbilityText = new HTMLContainer(document.createElement('div'), 0);
      lineOne.add(pokemonAbilityText);

      const abilityTextStyle = pokemon.abilityIndex === (pokemon.species.ability2 ? 2 : 1) ? TextStyle.MONEY : TextStyle.WINDOW;
      pokemonAbilityText.setText(pokemon.getAbility(true).name);
      pokemonAbilityText.setColor(getTextColor(abilityTextStyle, false, this.scene.uiTheme));
      pokemonAbilityText.setShadowColor(getTextColor(abilityTextStyle, true, this.scene.uiTheme));

      /**
       * If the opposing Pokemon only has 1 normal ability and is using the hidden ability it should have the same behavior
       * if it had 2 normal abilities. This code checks if that is the case and uses the correct opponent Pokemon abilityIndex (2)
       * for calculations so it aligns with where the hidden ability is stored in the starter data's abilityAttr (4)
       */
      const opponentPokemonOneNormalAbility = (pokemon.species.getAbilityCount() === 2);
      const opponentPokemonAbilityIndex = (opponentPokemonOneNormalAbility && pokemon.abilityIndex === 1) ? 2 : pokemon.abilityIndex;
      const opponentPokemonAbilityAttr = 1 << opponentPokemonAbilityIndex;

      const rootFormHasHiddenAbility = pokemon.scene.gameData.starterData[pokemon.species.getRootSpeciesId()].abilityAttr & opponentPokemonAbilityAttr;

      let pokemonAbilityLabelText = new HTMLContainer(document.createElement('div'), 0);
      lineOne.add(pokemonAbilityLabelText);

      if (!rootFormHasHiddenAbility) {
        pokemonAbilityLabelText.setColor(getTextColor(TextStyle.SUMMARY_BLUE, false, this.scene.uiTheme));
        pokemonAbilityLabelText.setShadowColor(getTextColor(TextStyle.SUMMARY_BLUE, true, this.scene.uiTheme));
      } else {
        pokemonAbilityLabelText.setColor(getTextColor(TextStyle.WINDOW, false, this.scene.uiTheme));
        pokemonAbilityLabelText.setShadowColor(getTextColor(TextStyle.WINDOW, true, this.scene.uiTheme));
      }

      let pokemonNatureText = new HTMLContainer(document.createElement('div'), 0);
      lineOne.add(pokemonNatureText);

      pokemonNatureText.setText(
        getNatureName(pokemon.getNature(), true, false, true, this.scene.uiTheme));

      const dexNatures = pokemon.scene.gameData.dexData[pokemon.species.speciesId].natureAttr;
      const newNature = 1 << (pokemon.nature + 1);

      let pokemonNatureLabelText = new HTMLContainer(document.createElement('div'), 0);
      lineOne.add(pokemonNatureLabelText);

      if (!(dexNatures & newNature)) {
        pokemonNatureLabelText.setColor(getTextColor(TextStyle.SUMMARY_BLUE, false, this.scene.uiTheme));
        pokemonNatureLabelText.setShadowColor(getTextColor(TextStyle.SUMMARY_BLUE, true, this.scene.uiTheme));
      } else {
        pokemonNatureLabelText.setColor(getTextColor(TextStyle.WINDOW, false, this.scene.uiTheme));
        pokemonNatureLabelText.setShadowColor(getTextColor(TextStyle.WINDOW, true, this.scene.uiTheme));
      }

      const isFusion = pokemon.isFusion();
      const doubleShiny = isFusion && pokemon.shiny && pokemon.fusionShiny;
      const baseVariant = !doubleShiny ? pokemon.getVariant() : pokemon.variant;

      let pokemonShinyIcon = new HTMLContainer(document.createElement('div'), 0);
      lineOne.add(pokemonShinyIcon);

      let pokemonShinyNewIcon = new HTMLContainer(document.createElement('div'), 0);
      lineOne.add(pokemonShinyNewIcon);

      pokemonShinyIcon.setText(`S`);
      pokemonShinyIcon.setVisible(pokemon.isShiny());
      pokemonShinyIcon.setTint(getVariantTint(baseVariant));

      if (pokemonShinyIcon.visible) {
        const shinyDescriptor = doubleShiny || baseVariant ?
          `${baseVariant === 2 ? i18next.t("common:epicShiny") : baseVariant === 1 ? i18next.t("common:rareShiny") : i18next.t("common:commonShiny")}${doubleShiny ? `/${pokemon.fusionVariant === 2 ? i18next.t("common:epicShiny") : pokemon.fusionVariant === 1 ? i18next.t("common:rareShiny") : i18next.t("common:commonShiny")}` : ""}`
          : "";

          pokemonShinyIcon.setColor(ShinyColor["Variant"+(baseVariant+1)]);
          pokemonShinyIcon.getDOM().title = `${i18next.t("common:shinyOnHover")}${shinyDescriptor ? ` (${shinyDescriptor})` : ""}`;

        const newShiny = BigInt(1 << (pokemon.shiny ? 1 : 0));
        const newVariant = BigInt(1 << (pokemon.variant + 4));

        pokemonShinyNewIcon.setText("(+)");
        pokemonShinyNewIcon.setColor(getTextColor(TextStyle.SUMMARY_BLUE, false, this.scene.uiTheme));
        pokemonShinyNewIcon.setShadowColor(getTextColor(TextStyle.SUMMARY_BLUE, true, this.scene.uiTheme));
        const newShinyOrVariant = ((newShiny & caughtAttr) === BigInt(0)) || ((newVariant & caughtAttr) === BigInt(0));
        pokemonShinyNewIcon.setVisible(!!newShinyOrVariant);
      } else {
        pokemonShinyNewIcon.setVisible(false);
      }

      let pokemonFusionShinyIcon = new HTMLContainer(document.createElement('div'), 0);
      lineOne.add(pokemonFusionShinyIcon);

      pokemonFusionShinyIcon.setText(`FS`);
      pokemonFusionShinyIcon.setPosition(pokemonShinyIcon.x, pokemonShinyIcon.y);
      pokemonFusionShinyIcon.setVisible(doubleShiny);
      if (isFusion) {
        pokemonFusionShinyIcon.setTint(getVariantTint(pokemon.fusionVariant));
      }

      const starterSpeciesId = pokemon.species.getRootSpeciesId();
      const originalIvs: integer[] | null = this.scene.gameData.dexData[starterSpeciesId].caughtAttr
        ? this.scene.gameData.dexData[starterSpeciesId].ivs
        : null;

      this.scene.tweens.add({
        targets: this,
        duration: Utils.fixedInt(Math.floor(750 / speedMultiplier)),
        ease: "Cubic.easeInOut",
        x: this.initialX - this.infoWindowWidth,
        onComplete: () => {
          resolve();
        }
      });

      if (showMoves) {
        resolve()
      }

      const line2 = new HTMLContainer(document.createElement('div'), 0);
      line2.setName("poke-info-line2")

      let pokemonMoveLabels = new Array(4).fill(0).map(v=>new HTMLContainer(document.createElement('div'), 0));
      line2.add(pokemonMoveLabels);

      for (let m = 0; m < 4; m++) {
        const move = m < pokemon.moveset.length && pokemon.moveset[m] ? pokemon.moveset[m]!.getMove() : null;
        pokemonMoveLabels[m].setText(move ? move.name : "-");
      }
      const keys = [
        "HP",
        "ATK",
        "DEF",
        "SPATK",
        "SPDEF",
        "SPD",
      ]
      const line3 = new HTMLContainer(document.createElement('div'), 0);
      line3.setName("poke-info-line3")
      pokemon.ivs.map((iv, i) => {
          const max = Math.max(originalIvs![i],iv);
          const isUp = iv > originalIvs![i];
          const diff = Math.max(0, iv - originalIvs![i]);
          
          const dom = new HTMLContainer(document.createElement('div'), 0);
          dom.getDOM().innerHTML = bbcodeToHtml(`${isUp?"[color=#333]":""} ${i18next.t(`pokemonInfo:Stat.${keys[i]}`)}: ${max} +${diff} ${isUp?"[/color]":""}`)
          line3.add(dom);
      })
setTimeout(() => {
  this.removeAll();
  
  this.add([lineOne,line2,line3]);
  
  this.scene.textPlugin.showOptionDom(this.getDOM());
}, 500);

      this.setVisible(true);
      this.shown = true;
      this.scene.hideEnemyModifierBar();
    });
  }

  makeRoomForConfirmUi(speedMultiplier: number = 1, fromCatch: boolean = false): Promise<void> {
    const xPosition = fromCatch ? this.initialX - this.infoWindowWidth - 65 : this.initialX - this.infoWindowWidth - ConfirmUiHandler.windowWidth;
    return new Promise<void>(resolve => {
      this.scene.tweens.add({
        targets: this,
        duration: Utils.fixedInt(Math.floor(150 / speedMultiplier)),
        ease: "Cubic.easeInOut",
        x: xPosition,
        onComplete: () => {
          resolve();
        }
      });
    });
  }

  hide(speedMultiplier: number = 1): Promise<void> {
    return new Promise(resolve => {
      if (!this.shown) {
        this.scene.showEnemyModifierBar();
        return resolve();
      }


      this.setVisible(false);
      (this.scene as BattleScene).ui.hideTooltip();
      this.scene.showEnemyModifierBar();

      this.shown = false;
    });
  }
}

export default interface HPokemonInfoContainer {
  scene: TextBattleScene
}
