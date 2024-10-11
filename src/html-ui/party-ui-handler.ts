import { CommandPhase } from '#app/phases/command-phase';
import BattleScene from "../battle-scene";
import Pokemon, { MoveResult, PlayerPokemon, PokemonMove } from "../field/pokemon";
import * as Utils from "../utils";
import { BaseStatModifier, PokemonFormChangeItemModifier, PokemonHeldItemModifier, SwitchEffectTransferModifier } from "../modifier/modifier";
import { allMoves, ForceSwitchOutAttr } from "../data/move";
import { getGenderColor, getGenderSymbol } from "../data/gender";
import { StatusEffect } from "../data/status-effect";
import { pokemonEvolutions } from "../data/pokemon-evolutions";
import { SpeciesFormChangeItemTrigger, FormChangeItem } from "../data/pokemon-forms";
import { getVariantTint } from "#app/data/variant";
import { Button } from "#enums/buttons";
import { applyChallenges, ChallengeType } from "#app/data/challenge.js";
import i18next from "i18next";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { getPokemonNameWithAffix } from "#app/messages.js";
import HUiHandler from "./PhaseUI/HUiHandler";
import PartyUiHandler, { PartyModifierSpliceSelectCallback, PartyModifierTransferSelectCallback, PartyOption, PartySelectCallback, PartyUiMode, PokemonModifierTransferSelectFilter, PokemonMoveSelectFilter, PokemonSelectFilter } from "#app/ui/party-ui-handler.js";
import MoveInfoOverlay from "#app/ui/move-info-overlay.js";
import TextBattleScene from "#app/html-ui/text-battle-scene";
import { getTextColor, TextStyle } from "#app/ui/text.js";
import { Command } from "./PhaseUI/command-ui";
import { Mode } from "./UI";
import { HTMLContainer, HTMLDialog } from "./Root";
import "./party-ui-handler.scss"
import { setPokemonNameComponent, showSprite } from "./widgets/pokeName";
import { SelectModifierPhase } from '#app/phases/select-modifier-phase.js';
import { Type } from '#app/data/type.js';
import { getPokeTypeColor } from './util';

const defaultMessage = i18next.t("partyUiHandler:choosePokemon");

export default class HPartyUiHandler extends HUiHandler {
  private partyUiMode: PartyUiMode;
  private fieldIndex: integer;

  private partySlots: PartySlot[];

  private optionsMode: boolean;
  private optionsScroll: boolean;
  private optionsCursor: integer = 0;
  private optionsScrollCursor: integer = 0;
  private optionsScrollTotal: integer = 0;
  private options: integer[];

  private transferMode: boolean;
  private transferOptionCursor: integer;
  private transferCursor: integer;
  /** Current quantity selection for every item held by the pokemon selected for the transfer */
  private transferQuantities: integer[];
  /** Stack size of every item that the selected pokemon is holding */
  private transferQuantitiesMax: integer[];
  /** Whether to transfer all items */
  private transferAll: boolean;

  private lastCursor: integer = 0;
  private selectCallback: PartySelectCallback | PartyModifierTransferSelectCallback | null;
  private selectFilter: PokemonSelectFilter | PokemonModifierTransferSelectFilter;
  private moveSelectFilter: PokemonMoveSelectFilter;
  private tmMoveId: Moves;
  private showMovePp: boolean;

  private active: boolean = false;
  private dom: HTMLDialog;

  private static FilterAll = (_pokemon: PlayerPokemon) => null;

  public static FilterNonFainted = (pokemon: PlayerPokemon) => {
    if (pokemon.isFainted()) {
      return i18next.t("partyUiHandler:noEnergy", { pokemonName: getPokemonNameWithAffix(pokemon) });
    }
    return null;
  };

  public static FilterFainted = (pokemon: PlayerPokemon) => {
    if (!pokemon.isFainted()) {
      return i18next.t("partyUiHandler:hasEnergy", { pokemonName: getPokemonNameWithAffix(pokemon) });
    }
    return null;
  };

  /**
   * For consistency reasons, this looks like the above filters. However this is used only internally and is always enforced for switching.
   * @param pokemon The pokemon to check.
   * @returns
   */
  private FilterChallengeLegal = (pokemon: PlayerPokemon) => {
    const challengeAllowed = new Utils.BooleanHolder(true);
    applyChallenges(this.scene.gameMode, ChallengeType.POKEMON_IN_BATTLE, pokemon, challengeAllowed);
    if (!challengeAllowed.value) {
      return i18next.t("partyUiHandler:cantBeUsed", { pokemonName: getPokemonNameWithAffix(pokemon) });
    }
    return null;
  };

  private static FilterAllMoves = (_pokemonMove: PokemonMove) => null;

  public static FilterItemMaxStacks = (pokemon: PlayerPokemon, modifier: PokemonHeldItemModifier) => {
    const matchingModifier = pokemon.scene.findModifier(m => m instanceof PokemonHeldItemModifier && m.pokemonId === pokemon.id && m.matchType(modifier)) as PokemonHeldItemModifier;
    if (matchingModifier && matchingModifier.stackCount === matchingModifier.getMaxStackCount(pokemon.scene)) {
      return i18next.t("partyUiHandler:tooManyItems", { pokemonName: getPokemonNameWithAffix(pokemon) });
    }
    return null;
  };

  public static NoEffectMessage = i18next.t("partyUiHandler:anyEffect");

  private localizedOptions = [PartyOption.SEND_OUT, PartyOption.SUMMARY, PartyOption.CANCEL, PartyOption.APPLY, PartyOption.RELEASE, PartyOption.TEACH, PartyOption.SPLICE, PartyOption.UNSPLICE, PartyOption.REVIVE, PartyOption.TRANSFER, PartyOption.UNPAUSE_EVOLUTION, PartyOption.PASS_BATON, PartyOption.RENAME];

  constructor(scene: TextBattleScene) {
    super(scene);//, Mode.PARTY
  }

  setup() {
    this.options = [];
    this.partySlots = [];
    this.dom = new HTMLDialog(() => {
      this.active = false;
      if(this.optionsMode)
        this.processInput(Button.CANCEL);
      this.processInput(Button.CANCEL);
    },this.scene.textPlugin.container);
    this.dom.setName("party-ui").setTitle(
      i18next.t("arenaTag:yourTeam")
    )
  }

  show(args: any[]): boolean {
    if (!args.length || this.active) {
      return false;
    }
    this.active = true;

    this.partyUiMode = args[0] as PartyUiMode;

    this.fieldIndex = args.length > 1 ? args[1] as integer : -1;

    this.selectCallback = args.length > 2 && args[2] instanceof Function ? args[2] : undefined;
    this.selectFilter = args.length > 3 && args[3] instanceof Function
      ? args[3] as PokemonSelectFilter
      : HPartyUiHandler.FilterAll;
    this.moveSelectFilter = args.length > 4 && args[4] instanceof Function
      ? args[4] as PokemonMoveSelectFilter
      : HPartyUiHandler.FilterAllMoves;
    this.tmMoveId = args.length > 5 && args[5] ? args[5] : Moves.NONE;
    this.showMovePp = args.length > 6 && args[6];

    this.populatePartySlots();

    this.dom.show();

    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    if (this.optionsMode) {
      const option = this.options[this.optionsCursor];
      if (button === Button.ACTION) {
        const pokemon = this.scene.getParty()[this.cursor];
        if (this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER && !this.transferMode && option !== PartyOption.CANCEL) {
          this.startTransfer();

          let ableToTransfer: string;
          for (let p = 0; p < this.scene.getParty().length; p++) { // this fore look goes through each of the party pokemon
            const newPokemon = this.scene.getParty()[p];
            // this next line gets all of the transferable items from pokemon [p]; it does this by getting all the held modifiers that are transferable and checking to see if they belong to pokemon [p]
            const getTransferrableItemsFromPokemon = (newPokemon: PlayerPokemon) =>
              this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier && (m as PokemonHeldItemModifier).isTransferable && (m as PokemonHeldItemModifier).pokemonId === newPokemon.id) as PokemonHeldItemModifier[];
            // this next bit checks to see if the the selected item from the original transfer pokemon exists on the new pokemon [p]; this returns undefined if the new pokemon doesn't have the item at all, otherwise it returns the pokemonHeldItemModifier for that item
            const matchingModifier = newPokemon.scene.findModifier(m => m instanceof PokemonHeldItemModifier && m.pokemonId === newPokemon.id && m.matchType(getTransferrableItemsFromPokemon(pokemon)[this.transferOptionCursor])) as PokemonHeldItemModifier;
            const partySlot = this.partySlots.filter(m => m.getPokemon() === newPokemon)[0]; // this gets pokemon [p] for us
            if (p !== this.transferCursor) { // this skips adding the able/not able labels on the pokemon doing the transfer
              if (matchingModifier) { // if matchingModifier exists then the item exists on the new pokemon
                if (matchingModifier.getMaxStackCount(this.scene) === matchingModifier.stackCount) { // checks to see if the stack of items is at max stack; if so, set the description label to "Not able"
                  ableToTransfer = "Not able";
                } else { // if the pokemon isn't at max stack, make the label "Able"
                  ableToTransfer = "Able";
                }
              } else { // if matchingModifier doesn't exist, that means the pokemon doesn't have any of the item, and we need to show "Able"
                ableToTransfer = "Able";
              }
            } else { // this else relates to the transfer pokemon. We set the text to be blank so there's no "Able"/"Not able" text
              ableToTransfer = "";
            }
            partySlot.slotHpBar.setVisible(false);
            partySlot.slotHpOverlay.setVisible(false);
            partySlot.slotHpText.setVisible(false);
            partySlot.slotDescriptionLabel.setText(ableToTransfer);
            partySlot.slotDescriptionLabel.setVisible(true);
          }

          this.clearOptions();
          ui.playSelect();
          return true;
        } else if (this.partyUiMode === PartyUiMode.REMEMBER_MOVE_MODIFIER && option !== PartyOption.CANCEL) {
          // clear overlay on cancel
          const filterResult = (this.selectFilter as PokemonSelectFilter)(pokemon);
          if (filterResult === null) {
            this.selectCallback?.(this.cursor, option);
            this.clearOptions();
          } else {
            this.clearOptions();
            this.showText(filterResult as string, undefined, () => this.showText("", 0), undefined, true);
          }
          ui.playSelect();
          return true;
        } else if ((option !== PartyOption.SUMMARY && option !== PartyOption.UNPAUSE_EVOLUTION && option !== PartyOption.UNSPLICE && option !== PartyOption.RELEASE && option !== PartyOption.CANCEL && option !== PartyOption.RENAME)
          || (option === PartyOption.RELEASE && this.partyUiMode === PartyUiMode.RELEASE)) {
          let filterResult: string | null;
          const getTransferrableItemsFromPokemon = (pokemon: PlayerPokemon) =>
            this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier && m.isTransferable && m.pokemonId === pokemon.id) as PokemonHeldItemModifier[];
          if (option !== PartyOption.TRANSFER && option !== PartyOption.SPLICE) {
            filterResult = (this.selectFilter as PokemonSelectFilter)(pokemon);
            if (filterResult === null && (option === PartyOption.SEND_OUT || option === PartyOption.PASS_BATON)) {
              filterResult = this.FilterChallengeLegal(pokemon);
            }
            if (filterResult === null && this.partyUiMode === PartyUiMode.MOVE_MODIFIER) {
              filterResult = this.moveSelectFilter(pokemon.moveset[this.optionsCursor]!); // TODO: is this bang correct?
            }
          } else {
            filterResult = (this.selectFilter as PokemonModifierTransferSelectFilter)(pokemon, getTransferrableItemsFromPokemon(this.scene.getParty()[this.transferCursor])[this.transferOptionCursor]);
          }
          if (filterResult === null) {
            if (this.partyUiMode !== PartyUiMode.SPLICE) {
              this.clearOptions();
            }
            if (this.selectCallback && this.partyUiMode !== PartyUiMode.CHECK) {
              if (option === PartyOption.TRANSFER) {
                if (this.transferCursor !== this.cursor) {
                  if (this.transferAll) {
                    getTransferrableItemsFromPokemon(this.scene.getParty()[this.transferCursor]).forEach((_, i) => (this.selectCallback as PartyModifierTransferSelectCallback)(this.transferCursor, i, this.transferQuantitiesMax[i], this.cursor));
                  } else {
                    (this.selectCallback as PartyModifierTransferSelectCallback)(this.transferCursor, this.transferOptionCursor, this.transferQuantities[this.transferOptionCursor], this.cursor);
                  }
                }
                this.clearTransfer();
              } else if (this.partyUiMode === PartyUiMode.SPLICE) {
                if (option === PartyOption.SPLICE) {
                  (this.selectCallback as PartyModifierSpliceSelectCallback)(this.transferCursor, this.cursor);
                  this.clearTransfer();
                } else {
                  this.startTransfer();
                }
                this.clearOptions();
              } else if (option === PartyOption.RELEASE) {
                this.doRelease(this.cursor);
              } else {
                const selectCallback = this.selectCallback;
                this.selectCallback = null;
                selectCallback(this.cursor, option);
              }
            } else {
              if (option >= PartyOption.FORM_CHANGE_ITEM && this.scene.getCurrentPhase() instanceof SelectModifierPhase) {
                if (this.partyUiMode === PartyUiMode.CHECK) {
                  const formChangeItemModifiers = this.getFormChangeItemsModifiers(pokemon);
                  const modifier = formChangeItemModifiers[option - PartyOption.FORM_CHANGE_ITEM];
                  modifier.active = !modifier.active;
                  this.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeItemTrigger, false, true);
                }
              } else if (this.cursor) {
                (this.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.POKEMON, this.cursor, option === PartyOption.PASS_BATON);
              }
            }
            if (this.partyUiMode !== PartyUiMode.MODIFIER && this.partyUiMode !== PartyUiMode.TM_MODIFIER && this.partyUiMode !== PartyUiMode.MOVE_MODIFIER) {
              ui.playSelect();
            }
            return true;
          } else {
            this.clearOptions();
            this.showText(filterResult as string, undefined, () => this.showText("", 0), undefined, true);
          }
        } else if (option === PartyOption.SUMMARY) {
          ui.playSelect();
          ui.setModeWithoutClear(Mode.SUMMARY, pokemon).then(() => this.clearOptions());
          return true;
        } else if (option === PartyOption.UNPAUSE_EVOLUTION) {
          this.clearOptions();
          ui.playSelect();
          pokemon.pauseEvolutions = false;
          this.showText(i18next.t("partyUiHandler:unpausedEvolutions", { pokemonName: getPokemonNameWithAffix(pokemon) }), undefined, () => this.showText("", 0), null, true);
        } else if (option === PartyOption.UNSPLICE) {
          this.clearOptions();
          ui.playSelect();
          this.showText(i18next.t("partyUiHandler:unspliceConfirmation", { fusionName: pokemon.fusionSpecies?.name, pokemonName: pokemon.name }), null, () => {
            ui.setModeWithoutClear(Mode.CONFIRM, () => {
              const fusionName = pokemon.name;
              pokemon.unfuse().then(() => {
                this.clearPartySlots();
                this.populatePartySlots();
                ui.setMode(Mode.PARTY);
                this.showText(i18next.t("partyUiHandler:wasReverted", { fusionName: fusionName, pokemonName: pokemon.name }), undefined, () => {
                  ui.setMode(Mode.PARTY);
                  this.showText("", 0);
                }, null, true);
              });
            }, () => {
              ui.setMode(Mode.PARTY);
              this.showText("", 0);
            });
          });
        } else if (option === PartyOption.RELEASE) {
          this.clearOptions();
          ui.playSelect();
          if (this.cursor >= this.scene.currentBattle.getBattlerCount() || !pokemon.isAllowedInBattle()) {
            this.showText(i18next.t("partyUiHandler:releaseConfirmation", { pokemonName: getPokemonNameWithAffix(pokemon) }), null, () => {
              ui.setModeWithoutClear(Mode.CONFIRM, () => {
                ui.setMode(Mode.PARTY);
                this.doRelease(this.cursor);
              }, () => {
                ui.setMode(Mode.PARTY);
                this.showText("", 0);
              });
            });
          } else {
            this.showText(i18next.t("partyUiHandler:releaseInBattle"), null, () => this.showText("", 0), null, true);
          }
          return true;
        } else if (option === PartyOption.RENAME) {
          this.clearOptions();

          let nickname = prompt(i18next.t("menu:renamePokemon"), pokemon.nickname);

          if(nickname){
              ui.playSelect();
                pokemon.nickname = btoa(unescape(encodeURIComponent(nickname)));
                pokemon.updateInfo();
                this.clearPartySlots();
                this.populatePartySlots();
                ui.setMode(Mode.PARTY);
          }else{
            ui.setMode(Mode.PARTY);
          }

          return true;
        } else if (option === PartyOption.CANCEL) {
          return this.processInput(Button.CANCEL);
        }
      } else if (button === Button.CANCEL) {
        this.clearOptions();
        ui.playSelect();
        return true;
      } else {
        switch (button) {
          case Button.LEFT:
            /** Decrease quantity for the current item and update UI */
            if (this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER) {
              this.transferQuantities[option] = this.transferQuantities[option] === 1 ? this.transferQuantitiesMax[option] : this.transferQuantities[option] - 1;
              this.updateOptions();
              success = this.setCursor(this.optionsCursor); /** Place again the cursor at the same position. Necessary, otherwise the cursor disappears */
            }
            break;
          case Button.RIGHT:
            /** Increase quantity for the current item and update UI */
            if (this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER) {
              this.transferQuantities[option] = this.transferQuantities[option] === this.transferQuantitiesMax[option] ? 1 : this.transferQuantities[option] + 1;
              this.updateOptions();
              success = this.setCursor(this.optionsCursor); /** Place again the cursor at the same position. Necessary, otherwise the cursor disappears */
            }
            break;
          case Button.UP:
            /** If currently selecting items to transfer, reset quantity selection */
            if (this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER) {
              if (option !== PartyOption.ALL) {
                this.transferQuantities[option] = this.transferQuantitiesMax[option];
              }
              this.updateOptions();
            }
            success = this.setCursor(this.optionsCursor ? this.optionsCursor - 1 : this.options.length - 1); /** Move cursor */
            break;
          case Button.DOWN:
            /** If currently selecting items to transfer, reset quantity selection */
            if (this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER) {
              if (option !== PartyOption.ALL) {
                this.transferQuantities[option] = this.transferQuantitiesMax[option];
              }
              this.updateOptions();
            }
            success = this.setCursor(this.optionsCursor < this.options.length - 1 ? this.optionsCursor + 1 : 0); /** Move cursor */
            break;
        }

        // show move description
        if (this.partyUiMode === PartyUiMode.REMEMBER_MOVE_MODIFIER) {
          const option = this.options[this.optionsCursor];
          const pokemon = this.scene.getParty()[this.cursor];
          const move = allMoves[pokemon.getLearnableLevelMoves()[option]];
          // if (move) {
          //   this.moveInfoOverlay.show(move);
          // } else {
          //   // or hide the overlay, in case it's the cancel button
          //   this.moveInfoOverlay.clear();
          // }
        }
      }
    } else {
      if (button === Button.ACTION) {
        if (this.cursor < 6) {
          this.showOptions();
          ui.playSelect();
        } else if (this.partyUiMode === PartyUiMode.FAINT_SWITCH || this.partyUiMode === PartyUiMode.REVIVAL_BLESSING) {
          ui.playError();
        } else {
          return this.processInput(Button.CANCEL);
        }
        return true;
      } else if (button === Button.CANCEL) {
         if (this.partyUiMode !== PartyUiMode.FAINT_SWITCH && this.partyUiMode !== PartyUiMode.REVIVAL_BLESSING) {
          if (this.selectCallback) {
            const selectCallback = this.selectCallback;
            this.selectCallback = null;
            selectCallback(6, PartyOption.CANCEL);
            ui.playSelect();
          } else {
            ui.setMode(Mode.COMMAND, this.fieldIndex);
            ui.playSelect();
          }
        }

        return true;
      }

      const slotCount = this.partySlots.length;
      const battlerCount = this.scene.currentBattle.getBattlerCount();
    }

    const cursor = button as integer;
    if(cursor > 99){
      this.setCursor(cursor - 100);
      if(cursor == 99){
        if(this.optionsMode)
          this.processInput(Button.CANCEL);
        return this.processInput(Button.CANCEL);
      }
      this.processInput(Button.ACTION);
    }

    return success;
  }

  populatePartySlots() {
    const party = this.scene.getParty();

    this.dom.removeAll(true);

    if (this.cursor < 6 && this.cursor >= party.length) {
      this.cursor = party.length - 1;
    } else if (this.cursor === 6) {
    }

    const indexedParty = party.map((v,i)=>{
      return [i,v] as [integer,PlayerPokemon];
    }).sort((a,b)=>{
      return a[1].species.speciesId - b[1].species.speciesId;
    });
    for (const p in indexedParty) {
      const index = indexedParty[p][0];

      const partySlot = new PartySlot(this.scene, index, indexedParty[p][1], (index) => {
        if(this.optionsMode)
          this.processInput(Button.CANCEL);

        this.setCursor(index);

        this.showOptions();
      }, this.partyUiMode, this.tmMoveId);

      this.partySlots[index] = partySlot;

      this.dom.add(partySlot)
      if (this.cursor === index) {
        partySlot.select();
      }
    }

    const msgAndOptions = new HTMLContainer(document.createElement("div"));
    msgAndOptions.addClass("interactive");
    msgAndOptions.getDOM().innerHTML = `<div class="msg"></div><div class="options"></div>`;
    this.dom.add(msgAndOptions);

    msgAndOptions.findObject(".options").on('click',e=>{
      const dom = e.target as HTMLElement;
      const parent = dom.parentElement as HTMLElement;

      const index = Array.from(parent.children).indexOf(dom);
      this.setCursor(index);
      if(["↑","↓"].indexOf(dom.textContent as string)!=-1)return;
      this.processInput(Button.ACTION);

    });
  }
  getCursor() {
    return this.cursor;
  }
  setCursor(cursor: integer): boolean {
    let changed: boolean;

    if (this.optionsMode) {
      changed = this.optionsCursor !== cursor;
      let isScroll = false;
      if (changed && this.optionsScroll) {
        if (Math.abs(cursor - this.optionsCursor) === this.options.length - 1) {
          this.optionsScrollCursor = cursor ? this.optionsScrollTotal - 8 : 0;
          this.updateOptions();
        } else {
          const isDown = cursor && cursor > this.optionsCursor;
          if (isDown) {
            if (this.options[cursor] === PartyOption.SCROLL_DOWN) {
              isScroll = true;
              this.optionsScrollCursor++;
            }
          } else {
            if (!cursor && this.optionsScrollCursor) {
              isScroll = true;
              this.optionsScrollCursor--;
            }
          }
          if (isScroll && this.optionsScrollCursor === 1) {
            this.optionsScrollCursor += isDown ? 1 : -1;
          }
        }
      }
      if (isScroll) {
        this.updateOptions();
      } else {
        this.optionsCursor = cursor;
      }
    } else {
      changed = this.cursor !== cursor;
      if (changed) {
        this.lastCursor = this.cursor;
        this.cursor = cursor;
        if (this.lastCursor < 6) {
          this.partySlots[this.lastCursor].deselect();
        } else if (this.lastCursor === 6) {
        }
        if (cursor < 6) {
          this.partySlots[cursor].select();
        } else if (cursor === 6) {
          // this.partyCancelButton.select();
        }
      }
    }

    return changed;
  }

  showText(text: string, delay?: integer | null, callback?: Function | null, callbackDelay?: integer | null, prompt?: boolean | null, promptDelay?: integer | null) {
    if (text.length === 0) {
      this.dom.findObject(".msg").add(
        new HTMLContainer().setText(defaultMessage)
      );      
    }else{
      this.dom.findObject(".msg").removeAll().setText(text);
    }

    setTimeout(() => {
      callback?.();
    }, callbackDelay||300);
  }

  showOptions() {
    if (this.cursor === 6) {
      return;
    }

    this.optionsMode = true;

    let optionsMessage = i18next.t("partyUiHandler:doWhatWithThisPokemon");

    switch (this.partyUiMode) {
      case PartyUiMode.MOVE_MODIFIER:
        optionsMessage = i18next.t("partyUiHandler:selectAMove");
        break;
      case PartyUiMode.MODIFIER_TRANSFER:
        if (!this.transferMode) {
          optionsMessage = i18next.t("partyUiHandler:changeQuantity");
        }
        break;
      case PartyUiMode.SPLICE:
        if (!this.transferMode) {
          optionsMessage = i18next.t("partyUiHandler:selectAnotherPokemonToSplice");
        }
        break;
    }

    this.showText(optionsMessage, 0);

    this.updateOptions();

    this.setCursor(0);
  }

  updateOptions(): void {
    const pokemon = this.scene.getParty()[this.cursor];

    const learnableLevelMoves = this.partyUiMode === PartyUiMode.REMEMBER_MOVE_MODIFIER
      ? pokemon.getLearnableLevelMoves()
      : [];

    // if (this.partyUiMode === PartyUiMode.REMEMBER_MOVE_MODIFIER && learnableLevelMoves?.length) {
    //   // show the move overlay with info for the first move
    //   this.moveInfoOverlay.show(allMoves[learnableLevelMoves[0]]);
    // }

    const itemModifiers = this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER
      ? this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier
        && m.isTransferable && m.pokemonId === pokemon.id) as PokemonHeldItemModifier[]
      : [];

    if (this.options.length) {
      this.options.splice(0, this.options.length);
    }

    let formChangeItemModifiers: PokemonFormChangeItemModifier[] | undefined;

    if (this.partyUiMode !== PartyUiMode.MOVE_MODIFIER && this.partyUiMode !== PartyUiMode.REMEMBER_MOVE_MODIFIER && (this.transferMode || this.partyUiMode !== PartyUiMode.MODIFIER_TRANSFER)) {
      switch (this.partyUiMode) {
        case PartyUiMode.SWITCH:
        case PartyUiMode.FAINT_SWITCH:
        case PartyUiMode.POST_BATTLE_SWITCH:
          if (this.cursor >= this.scene.currentBattle.getBattlerCount()) {
            const allowBatonModifierSwitch =
              this.partyUiMode !== PartyUiMode.FAINT_SWITCH
              && this.scene.findModifier(m => m instanceof SwitchEffectTransferModifier
                && (m as SwitchEffectTransferModifier).pokemonId === this.scene.getPlayerField()[this.fieldIndex].id);

            const moveHistory = this.scene.getPlayerField()[this.fieldIndex].getMoveHistory();
            const isBatonPassMove = this.partyUiMode === PartyUiMode.FAINT_SWITCH && moveHistory.length && allMoves[moveHistory[moveHistory.length - 1].move].getAttrs(ForceSwitchOutAttr)[0]?.isBatonPass() && moveHistory[moveHistory.length - 1].result === MoveResult.SUCCESS;

            // isBatonPassMove and allowBatonModifierSwitch shouldn't ever be true
            // at the same time, because they both explicitly check for a mutually
            // exclusive partyUiMode. But better safe than sorry.
            this.options.push(isBatonPassMove && !allowBatonModifierSwitch ? PartyOption.PASS_BATON : PartyOption.SEND_OUT);
            if (allowBatonModifierSwitch && !isBatonPassMove) {
              // the BATON modifier gives an extra switch option for
              // pokemon-command switches, allowing buffs to be optionally passed
              this.options.push(PartyOption.PASS_BATON);
            }
          }
          break;
        case PartyUiMode.REVIVAL_BLESSING:
          this.options.push(PartyOption.REVIVE);
          break;
        case PartyUiMode.MODIFIER:
          this.options.push(PartyOption.APPLY);
          break;
        case PartyUiMode.TM_MODIFIER:
          this.options.push(PartyOption.TEACH);
          break;
        case PartyUiMode.MODIFIER_TRANSFER:
          this.options.push(PartyOption.TRANSFER);
          break;
        case PartyUiMode.SPLICE:
          if (this.transferMode) {
            if (this.cursor !== this.transferCursor) {
              this.options.push(PartyOption.SPLICE);
            }
          } else {
            this.options.push(PartyOption.APPLY);
          }
          break;
        case PartyUiMode.RELEASE:
          this.options.push(PartyOption.RELEASE);
          break;
        case PartyUiMode.CHECK:
          if (this.scene.getCurrentPhase() instanceof SelectModifierPhase) {
            formChangeItemModifiers = this.getFormChangeItemsModifiers(pokemon);
            for (let i = 0; i < formChangeItemModifiers.length; i++) {
              this.options.push(PartyOption.FORM_CHANGE_ITEM + i);
            }
          }
          break;
          case PartyUiMode.SELECT:
            this.options.push(PartyOption.SELECT);
            break;
      }

      this.options.push(PartyOption.SUMMARY);
      this.options.push(PartyOption.RENAME);

      if (pokemon.pauseEvolutions && pokemonEvolutions.hasOwnProperty(pokemon.species.speciesId)) {
        this.options.push(PartyOption.UNPAUSE_EVOLUTION);
      }

      if (this.partyUiMode === PartyUiMode.SWITCH) {
        if (pokemon.isFusion()) {
          this.options.push(PartyOption.UNSPLICE);
        }
        this.options.push(PartyOption.RELEASE);
      } else if (this.partyUiMode === PartyUiMode.SPLICE && pokemon.isFusion()) {
        this.options.push(PartyOption.UNSPLICE);
      }
    } else if (this.partyUiMode === PartyUiMode.MOVE_MODIFIER) {
      for (let m = 0; m < pokemon.moveset.length; m++) {
        this.options.push(PartyOption.MOVE_1 + m);
      }
    } else if (this.partyUiMode === PartyUiMode.REMEMBER_MOVE_MODIFIER) {
      const learnableMoves = pokemon.getLearnableLevelMoves();
      for (let m = 0; m < learnableMoves.length; m++) {
        this.options.push(m);
      }
    } else {
      for (let im = 0; im < itemModifiers.length; im++) {
        this.options.push(im);
      }
      if (itemModifiers.length > 1) {
        this.options.push(PartyOption.ALL);
      }
    }

    this.optionsScrollTotal = this.options.length;
    let optionStartIndex = this.optionsScrollCursor;
    let optionEndIndex = Math.min(this.optionsScrollTotal, optionStartIndex + (!optionStartIndex || this.optionsScrollCursor + 8 >= this.optionsScrollTotal ? 8 : 7));

    this.optionsScroll = this.optionsScrollTotal > 999;

    if (this.optionsScroll) {
      this.options.splice(optionEndIndex, this.optionsScrollTotal);
      this.options.splice(0, optionStartIndex);
      if (optionStartIndex) {
        this.options.unshift(PartyOption.SCROLL_UP);
      }
      if (optionEndIndex < this.optionsScrollTotal) {
        this.options.push(PartyOption.SCROLL_DOWN);
      }
    }

    this.options.push(PartyOption.CANCEL);

    optionStartIndex = 0;
    optionEndIndex = this.options.length;
    const container = this.dom.findObject(".options");
    container.removeAll(true);

    for (let o = optionStartIndex; o < optionEndIndex; o++) {
      const option = this.options[this.options.length - (o + 1)];
      let altText = false;
      let optionName: string;
      if (option === PartyOption.SCROLL_UP) {
        optionName = "↑";
      } else if (option === PartyOption.SCROLL_DOWN) {
        optionName = "↓";
      } else if ((this.partyUiMode !== PartyUiMode.REMEMBER_MOVE_MODIFIER && (this.partyUiMode !== PartyUiMode.MODIFIER_TRANSFER || this.transferMode)) || option === PartyOption.CANCEL) {
        switch (option) {
          case PartyOption.MOVE_1:
          case PartyOption.MOVE_2:
          case PartyOption.MOVE_3:
          case PartyOption.MOVE_4:
            const move = pokemon.moveset[option - PartyOption.MOVE_1]!; // TODO: is the bang correct?
            if (this.showMovePp) {
              const maxPP = move.getMovePp();
              const currPP = maxPP - move.ppUsed;
              optionName = `${move.getName()} ${currPP}/${maxPP}`;
            } else {
              optionName = move.getName();
            }
            break;
          default:
            if (formChangeItemModifiers && option >= PartyOption.FORM_CHANGE_ITEM) {
              const modifier = formChangeItemModifiers[option - PartyOption.FORM_CHANGE_ITEM];
              optionName = `${modifier.active ? i18next.t("partyUiHandler:DEACTIVATE") : i18next.t("partyUiHandler:ACTIVATE")} ${modifier.type.name}`;
            } else if (option === PartyOption.UNPAUSE_EVOLUTION) {
              optionName = `${pokemon.pauseEvolutions ? i18next.t("partyUiHandler:UNPAUSE_EVOLUTION") : i18next.t("partyUiHandler:PAUSE_EVOLUTION")}`;
            } else {
              if (this.localizedOptions.includes(option)) {
                optionName = i18next.t(`partyUiHandler:${PartyOption[option]}`);
              } else {
                optionName = Utils.toReadableString(PartyOption[option]);
              }
            }
            break;
        }
      } else if (this.partyUiMode === PartyUiMode.REMEMBER_MOVE_MODIFIER) {
        const move = learnableLevelMoves[option];
        optionName = allMoves[move].name;
        altText = !pokemon.getSpeciesForm().getLevelMoves().find(plm => plm[1] === move);
      } else if (option === PartyOption.ALL) {
        optionName = i18next.t("partyUiHandler:ALL");
      } else {
        const itemModifier = itemModifiers[option];
        optionName = itemModifier.type.name;
      }

      const optionText = new HTMLContainer();
      optionText.setText(optionName);

      if (altText) {
        optionText.setColor("#40c8f8");
        optionText.setShadowColor("#006090");
      }
      /** For every item that has stack bigger than 1, display the current quantity selection */
      if (this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER && this.transferQuantitiesMax[option] > 1) {
        const itemModifier = itemModifiers[option];

        /** Not sure why getMaxHeldItemCount had an error, but it only checks the Pokemon parameter if the modifier is PokemonBaseStatModifier */
        if (itemModifier === undefined || itemModifier instanceof BaseStatModifier) {
          continue;
        }

        let amountText = `${this.transferQuantities[option]}`;

        /** If the amount held is the maximum, display the count in red */
        if (this.transferQuantitiesMax[option] === itemModifier.getMaxHeldItemCount(undefined)) {
          amountText = `<input style="width:12px;color:${getTextColor(TextStyle.SUMMARY_RED)}" value=${amountText}></input>`;
        }else{
          amountText = `<input style="width:12px;" value=${amountText}></input>`;
        }

        optionText.setInnerHTML(optionName + amountText)
        .findObject("input").on('input',e=>{
          this.transferQuantities[option] = parseInt((e.target as HTMLInputElement).value);
        }).on('click',e=>{
          e.stopPropagation();
        })
      }

      container.unshift(optionText);
    }
  }

  startTransfer(): void {
    this.transferMode = true;
    this.transferCursor = this.cursor;
    this.transferOptionCursor = this.getOptionsCursorWithScroll();
    this.transferAll = this.options[this.optionsCursor] === PartyOption.ALL;

    this.partySlots[this.transferCursor].setTransfer(true);
  }

  clearTransfer(): void {
    this.transferMode = false;
    this.transferAll = false;
    this.partySlots[this.transferCursor].setTransfer(false);
    for (let i = 0; i < this.partySlots.length; i++) {
      this.partySlots[i].slotDescriptionLabel.setVisible(false);
      this.partySlots[i].slotHpBar.setVisible(true);
      this.partySlots[i].slotHpOverlay.setVisible(true);
      this.partySlots[i].slotHpText.setVisible(true);
    }
  }

  doRelease(slotIndex: integer): void {
    this.showText(this.getReleaseMessage(getPokemonNameWithAffix(this.scene.getParty()[slotIndex])), null, () => {
      this.clearPartySlots();
      this.scene.removePartyMemberModifiers(slotIndex);
      const releasedPokemon = this.scene.getParty().splice(slotIndex, 1)[0];
      releasedPokemon.destroy();
      this.populatePartySlots();
      if (this.cursor >= this.scene.getParty().length) {
        this.setCursor(this.cursor - 1);
      }
      if (this.partyUiMode === PartyUiMode.RELEASE) {
        const selectCallback = this.selectCallback;
        this.selectCallback = null;
        selectCallback && selectCallback(this.cursor, PartyOption.RELEASE);
      }
      this.showText("", 0);
    }, null, true);
  }

  getReleaseMessage(pokemonName: string): string {
    const rand = Utils.randInt(128);
    if (rand < 20) {
      return i18next.t("partyUiHandler:goodbye", { pokemonName: pokemonName });
    } else if (rand < 40) {
      return i18next.t("partyUiHandler:byebye", { pokemonName: pokemonName });
    } else if (rand < 60) {
      return i18next.t("partyUiHandler:farewell", { pokemonName: pokemonName });
    } else if (rand < 80) {
      return i18next.t("partyUiHandler:soLong", { pokemonName: pokemonName });
    } else if (rand < 100) {
      return i18next.t("partyUiHandler:thisIsWhereWePart", { pokemonName: pokemonName });
    } else if (rand < 108) {
      return i18next.t("partyUiHandler:illMissYou", { pokemonName: pokemonName });
    } else if (rand < 116) {
      return i18next.t("partyUiHandler:illNeverForgetYou", { pokemonName: pokemonName });
    } else if (rand < 124) {
      return i18next.t("partyUiHandler:untilWeMeetAgain", { pokemonName: pokemonName });
    } else if (rand < 127) {
      return i18next.t("partyUiHandler:sayonara", { pokemonName: pokemonName });
    } else {
      return i18next.t("partyUiHandler:smellYaLater", { pokemonName: pokemonName });
    }
  }

  getFormChangeItemsModifiers(pokemon: Pokemon) {
    let formChangeItemModifiers = this.scene.findModifiers(m => m instanceof PokemonFormChangeItemModifier && m.pokemonId === pokemon.id) as PokemonFormChangeItemModifier[];
    const ultraNecrozmaModifiers = formChangeItemModifiers.filter(m => m.active && m.formChangeItem === FormChangeItem.ULTRANECROZIUM_Z);
    if (ultraNecrozmaModifiers.length > 0) {
      // ULTRANECROZIUM_Z is active and deactivating it should be the only option
      return ultraNecrozmaModifiers;
    }
    if (formChangeItemModifiers.find(m => m.active)) {
      // a form is currently active. the user has to disable the form or activate ULTRANECROZIUM_Z
      formChangeItemModifiers = formChangeItemModifiers.filter(m => m.active || m.formChangeItem === FormChangeItem.ULTRANECROZIUM_Z);
    } else if (pokemon.species.speciesId === Species.NECROZMA) {
      // no form is currently active. the user has to activate some form, except ULTRANECROZIUM_Z
      formChangeItemModifiers = formChangeItemModifiers.filter(m => m.formChangeItem !== FormChangeItem.ULTRANECROZIUM_Z);
    }
    return formChangeItemModifiers;
  }

  getOptionsCursorWithScroll(): integer {
    return this.optionsCursor + this.optionsScrollCursor + (this.options && this.options[0] === PartyOption.SCROLL_UP ? -1 : 0);
  }

  clearOptions() {
    this.optionsMode = false;
    this.optionsScroll = false;
    this.optionsScrollCursor = 0;
    this.optionsScrollTotal = 0;
    this.options.splice(0, this.options.length);

    this.dom.findObject(".options").removeAll(true);

    this.eraseOptionsCursor();
    this.showText("", 0);
  }

  eraseOptionsCursor() {
  }

  clear() {
    this.clearPartySlots();

    this.active = false;
    this.dom.hide();
  }

  clearPartySlots() {
    this.dom.removeAll(true);
  }
}

class PartySlot extends HTMLContainer {
  private selected: boolean;
  private transfer: boolean;
  private slotIndex: integer;
  private pokemon: PlayerPokemon;

  public slotName: HTMLContainer;
  public slotHpBar: HTMLContainer;
  public slotHpOverlay: HTMLContainer;
  public slotHpText: HTMLContainer;
  public slotDescriptionLabel: HTMLContainer; // this is used to show text instead of the HP bar i.e. for showing "Able"/"Not Able" for TMs when you try to learn them
  public selectHandler: (index: integer) => void;

  constructor(scene: TextBattleScene, slotIndex: integer, pokemon: PlayerPokemon, selectHandler: any, partyUiMode: PartyUiMode, tmMoveId: Moves) {
    super();

    this.scene = scene;

    this.slotIndex = slotIndex;
    this.pokemon = pokemon;
    this.selectHandler = selectHandler;

    this.setup(partyUiMode, tmMoveId);
  }

  getPokemon(): PlayerPokemon {
    return this.pokemon;
  }

  setup(partyUiMode: PartyUiMode, tmMoveId: Moves) {
    const battlerCount = (this.scene as BattleScene).currentBattle.getBattlerCount();

    const { pokemon } = this;

    const dom = this.dom;

    dom.innerHTML = `
      <div class="poke ${battlerCount>this.slotIndex?'sent':""}">
        <div class="party-line1">
          <div class="name"></div>
          
          <div class="type-container">
            <div class="type1 iconfont"></div>
            <div class="type2 iconfont"></div>
            <div class="type3 iconfont"></div>
          </div>

          <div class="poke-tera iconfont icon-tera"></div>
          <div class="poke-fusion iconfont icon-jiyin"></div>
          <div class="iconfont icon-champion"></div>
          <div class="sprite">!</div>
        </div>
        <div class="hp-line1">
            <div class="hp-bar"><div class="cur"></div></div>
            <div class="party-hp-number">${pokemon.hp}/${pokemon.getMaxHp()}</div>
        </div>
        <div class="party-line2">
          <div>Lv.<span class="level">${pokemon.level}</span></div>
          <div class="flags">
            <div class="gender"></div>
            <div class="statuses"></div>
          </div>
          
        </div>
        <div class="handle"></div>
      </div>
    `

    dom.addEventListener("click", () => {
      this.selectHandler(this.slotIndex)
    });

    this.slotName = this.findObject(".name");
    setPokemonNameComponent(pokemon, this.slotName,true);
    //this.slotName.setColor(TextStyle.PARTY)

    const slotLevelText = this.findObject(".level");
    slotLevelText.setColor(this.pokemon.level < (this.scene as BattleScene).getMaxExpLevel() ? undefined : TextStyle.PARTY_RED);

    const genderSymbol = getGenderSymbol(this.pokemon.getGender(true));

    if (genderSymbol) {
      const slotGenderText = this.findObject(".gender");
      slotGenderText.setText(genderSymbol);
      slotGenderText.setColor(getGenderColor(this.pokemon.getGender(true)));
      slotGenderText.setShadowColor(getGenderColor(this.pokemon.getGender(true), true));
    }

    let lastStatus;
    if (lastStatus=pokemon.status) {
      let dom = this.findObject(".statuses").getDOM() as HTMLDivElement;

      if (lastStatus !== StatusEffect.NONE) {
        switch(lastStatus){
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

    //const doubleShiny = this.pokemon.isFusion() && this.pokemon.shiny && this.pokemon.fusionShiny;
    // const shinyStar = this.findObject(`.shiny_star_small${doubleShiny ? "_1" : ""}`);
    // const fusionShinyStar = this.findObject("shiny_star_small_2");
    // if (this.pokemon.isShiny()) {

    //   shinyStar.setVisible(true)

    //   fusionShinyStar.setVisible(doubleShiny)
    // } else {
    //   shinyStar.setVisible(false)
    //   fusionShinyStar.setVisible(false)
    // }
    const hpRatio = pokemon.getHpRatio();
    this.find(".cur").style.width = `${hpRatio * 100}%`;
    this.slotHpText = this.findObject(".hp-number")

    this.slotDescriptionLabel = this.findObject(".handle");
    this.slotHpBar = this.findObject(".handle");
    this.slotHpOverlay = this.findObject(".handle");


    if (partyUiMode !== PartyUiMode.TM_MODIFIER) {
      this.slotDescriptionLabel.setVisible(false);
      this.slotHpBar.setVisible(true);
      this.slotHpOverlay.setVisible(true);
      this.slotHpText.setVisible(true);
    } else {
      this.slotHpBar.setVisible(false);
      this.slotHpOverlay.setVisible(false);
      this.slotHpText.setVisible(false);
      let slotTmText: string;
      switch (true) {
        case (pokemon.compatibleTms.indexOf(tmMoveId) === -1):
          slotTmText = i18next.t("partyUiHandler:notAble");
          break;
        case (pokemon.getMoveset().filter(m => m?.moveId === tmMoveId).length > 0):
          slotTmText = i18next.t("partyUiHandler:learned");
          break;
        default:
          slotTmText = i18next.t("partyUiHandler:able");
          break;
      }

      this.slotDescriptionLabel.setText(slotTmText);
      this.slotDescriptionLabel.setVisible(true);
    }

    this.findObject('.sprite').on('click',(e)=>{
      showSprite(this.pokemon,e);
      e.stopPropagation();
    })

    let lastTeraType = pokemon.getTeraType();

    const tera = this.dom.querySelector(".poke-tera") as HTMLDivElement;
    tera.title = `${Utils.toReadableString(Type[lastTeraType])} Terastallized`;
    tera.style.display = (lastTeraType !== Type.UNKNOWN) ? "block" : "none";

    const isFusion = pokemon.isFusion();
    const fusion = this.dom.querySelector(".poke-fusion") as HTMLDivElement;
    fusion.title = `${pokemon.species.getName(pokemon.formIndex)}/${pokemon.fusionSpecies?.getName(pokemon.fusionFormIndex)}`
    fusion.style.display = (isFusion) ? "block" : "none";

    
    let chamDom = this.findObject(".icon-champion");
    if (pokemon.scene.gameMode.isClassic) {
      if (pokemon.scene.gameData.starterData[pokemon.species.getRootSpeciesId()].classicWinCount > 0 && pokemon.scene.gameData.starterData[pokemon.species.getRootSpeciesId(true)].classicWinCount > 0) {
        chamDom.setVisible(true);
      } else{
        chamDom.setVisible(false);
      }
    }else{
      chamDom.setVisible(false);
    }

    const types = pokemon.getTypes(true);

    let typeDom = this.dom.querySelector(".type1") as HTMLDivElement;
    typeDom.className="type1 iconfont icon-pt-"+types[0];
    typeDom.style.color = "#"+getPokeTypeColor(types[0]).toString(16);

    typeDom = this.dom.querySelector(".type2") as HTMLDivElement;
    if (types.length > 1) {
      typeDom.className="type2 iconfont icon-pt-"+types[1];
      typeDom.style.color = "#"+getPokeTypeColor(types[1]).toString(16);
    } else {
      typeDom.style.display = "none";
    }

    typeDom = this.dom.querySelector(".type3") as HTMLDivElement;
    if (types.length > 2) {
      typeDom.className="type3 iconfont icon-pt-"+types[2];
      typeDom.style.color = "#"+getPokeTypeColor(types[2]).toString(16);
    }
    else {
      typeDom.style.display = "none";
    }
  }

  select(): void {
    if (this.selected) {
      return;
    }

    this.selected = true;
    this.addClass("selected");
  }

  deselect(): void {
    if (!this.selected) {
      return;
    }

    this.selected = false;

    this.removeClass("selected");
  }

  setTransfer(transfer: boolean): void {
    if (this.transfer === transfer) {
      return;
    }

    this.transfer = transfer;
    this.updateSlotTexture();
  }

  private updateSlotTexture(): void {
  }
}