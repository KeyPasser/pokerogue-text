import BattleScene from "#app/battle-scene.js";
import { Egg, EGG_SEED } from "#app/data/egg.js";
import { PlayerPokemon } from "#app/field/pokemon.js";
import { Phase } from "#app/phase.js";
import EggHatchSceneHandler from "#app/ui/egg-hatch-scene-handler.js";
import i18next from "i18next";
import { Mode } from "../UI";
import * as Utils from "../../utils";
import { achvs } from "#app/system/achv.js";
import { EggCountChangedEvent, EggEventType } from "#app/events/egg.js";
import { getPokemonNameWithAffix } from "#app/messages.js";
import { PlayerGender } from "#app/enums/player-gender.js";
import { EggLapsePhase } from "#app/phases/egg-lapse-phase.js";

/**
 * Class that represents egg hatching
 */
export class HEggHatchPhase extends Phase {
  /** The egg that is hatching */
  private egg: Egg;

  /** The number of eggs that are hatching */
  private eggsToHatchCount: integer;
  /** The scene handler for egg hatching */
  private eggHatchHandler: EggHatchSceneHandler;


  /** The {@link PokemonInfoContainer} of the newly hatched Pokemon */
  // private infoContainer: PokemonInfoContainer;

  /** The newly hatched {@link PlayerPokemon} */
  private pokemon: PlayerPokemon;
  /** The index of which egg move is unlocked. 0-2 is common, 3 is rare */
  private eggMoveIndex: integer;
  /** Internal booleans representing if the egg is hatched, able to be skipped, or skipped */
  private hatched: boolean;
  private canSkip: boolean;
  private skipped: boolean;

  constructor(scene: BattleScene, lapsePhase: EggLapsePhase, egg: Egg, eggsToHatchCount: integer) {
    super(scene);

    this.egg = egg;
    this.eggsToHatchCount = eggsToHatchCount;
  }

  start() {
    super.start();


      if (!this.egg) {
        return this.end();
      }

      const eggIndex = this.scene.gameData.eggs.findIndex(e => e.id === this.egg.id);

      if (eggIndex === -1) {
        return this.end();
      }

      this.scene.gameData.eggs.splice(eggIndex, 1);

      this.eggHatchHandler = this.scene.ui.getHandler() as EggHatchSceneHandler;

      // this.infoContainer = new PokemonInfoContainer(this.scene);
      // this.infoContainer.setup();

      // The game will try to unfuse any Pokemon even though eggs should not generate fused Pokemon in the first place
      const pokemon = this.generatePokemon();
      if (pokemon.fusionSpecies) {
        pokemon.clearFusionSpecies();
      }

      this.pokemon = pokemon;
      
      (this.scene as any).textPlugin.showMsg(i18next.t(`gameStatsUiHandler:eggsHatched`) + ":" +this.eggsToHatchCount );

      if (!this.hatched) {
        return this.doHatch();
      }
  }

  end() {
    if (this.scene.findPhase((p) => p instanceof HEggHatchPhase)) {
      this.eggHatchHandler.clear();
    } else {
      this.scene.time.delayedCall(250, () => this.scene.setModifiersVisible(true));
    }
    this.pokemon.getBattleInfo().destroy();
  }

  /**
   * Function that animates egg shaking
   * @param intensity of horizontal shaking. Doubled on the first call (where count is 0)
   * @param repeatCount the number of times this function should be called (asynchronous recursion?!?)
   * @param count the current number of times this function has been called.
   * @returns nothing since it's a Promise<void>
   */
  doEggShake(intensity: number, repeatCount?: integer, count?: integer): Promise<void> {
    return new Promise(resolve => {
       resolve()
    });
  }

  /**
   * Tries to skip the hatching animation
   * @returns false if cannot be skipped or already skipped. True otherwise
   */
  trySkip(): boolean {
    if (!this.canSkip || this.skipped) {
      return false;
    }

    this.skipped = true;
    if (!this.hatched) {
      this.doHatch();
    } else {
      this.doReveal();
    }
    return true;
  }

  /**
   * Plays the animation of an egg hatch
   */
  doHatch(): Promise<number> {
    return this.doReveal();
  }

  /**
   * Function to do the logic and animation of completing a hatch and revealing the Pokemon
   */
  doReveal(): Promise<number> {
    const isShiny = this.pokemon.isShiny();
    if (this.pokemon.species.subLegendary) {
      this.scene.validateAchv(achvs.HATCH_SUB_LEGENDARY);
    }
    if (this.pokemon.species.legendary) {
      this.scene.validateAchv(achvs.HATCH_LEGENDARY);
    }
    if (this.pokemon.species.mythical) {
      this.scene.validateAchv(achvs.HATCH_MYTHICAL);
    }
    if (isShiny) {
      this.scene.validateAchv(achvs.HATCH_SHINY);
    }

    return new Promise(resolve => {
        this.eggsToHatchCount--;

        if (isShiny) {
          const genderIndex = this.scene.gameData.gender ?? PlayerGender.MALE;
          const genderStr = PlayerGender[genderIndex].toLowerCase();
          (this.scene as any).textPlugin.showMsg(i18next.t(`achv:HATCH_SHINY.description`, { context: genderStr }))
        }

        this.scene.ui.showText(i18next.t("egg:hatchFromTheEgg", { pokemonName: getPokemonNameWithAffix(this.pokemon) }), null, () => {
          this.scene.gameData.updateSpeciesDexIvs(this.pokemon.species.speciesId, this.pokemon.ivs);
          this.scene.gameData.setPokemonCaught(this.pokemon, true, true).then(() => {
            this.scene.gameData.setEggMoveUnlocked(this.pokemon.species, this.eggMoveIndex).then(() => {
              this.scene.ui.showText("", 0);
              this.end();
              resolve(1);
            });
          });
        }, null, true, 3000);
    });
  }

  /**
   * Helper function to generate sine. (Why is this not a Utils?!?)
   * @param index random number from 0-7 being passed in to scale pi/128
   * @param amplitude Scaling
   * @returns a number
   */
  sin(index: integer, amplitude: integer): number {
    return amplitude * Math.sin(index * (Math.PI / 128));
  }

  /**
   * Animates spraying
   * @param intensity number of times this is repeated (this is a badly named variable)
   * @param offsetY how much to offset the Y coordinates
   */
  doSpray(intensity: integer, offsetY?: number) {
    this.scene.tweens.addCounter({
      repeat: intensity,
      duration: Utils.getFrameMs(1),
      onRepeat: () => {
        this.doSprayParticle(Utils.randInt(8), offsetY || 0);
      }
    });
  }

  /**
   * Animates a particle used in the spray animation
   * @param trigIndex Used to modify the particle's vertical speed, is a random number from 0-7
   * @param offsetY how much to offset the Y coordinate
   */
  doSprayParticle(trigIndex: integer, offsetY: number) {
    let f = 0;
    let yOffset = 0;
    const speed = 3 - Utils.randInt(8);
    const amp = 24 + Utils.randInt(32);

    const particleTimer = this.scene.tweens.addCounter({
      repeat: -1,
      duration: Utils.getFrameMs(1),
      onRepeat: () => {
        updateParticle();
      }
    });

    const updateParticle = () => {
      const speedMultiplier = this.skipped ? 6 : 1;
      yOffset += speedMultiplier;
      if (trigIndex < 160) {
        trigIndex += 2 * speedMultiplier;
        f += speedMultiplier;
      } else {
        particleTimer.remove();
      }
    };

    updateParticle();
  }


  /**
   * Generates a Pokemon to be hatched by the egg
   * @returns the hatched PlayerPokemon
   */
  generatePokemon(): PlayerPokemon {
    let ret: PlayerPokemon;

    this.scene.executeWithSeedOffset(() => {
      ret = this.egg.generatePlayerPokemon(this.scene);
      this.eggMoveIndex = this.egg.eggMoveIndex;

    }, this.egg.id, EGG_SEED.toString());

    return ret!;
  }
}
