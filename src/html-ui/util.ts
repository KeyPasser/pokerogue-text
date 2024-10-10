import { Type } from "#app/data/type.js";
import { pokemon } from "#app/locales/pt_BR/pokemon.js";

export function getPokeTypeColor(type: integer): integer {
    switch (type) {
        default:
        case Type.NORMAL:
          return 0xa8a878;
        case Type.FIGHTING:
            return 0xc03028;
        case Type.FLYING:
            return 0xa890f0;
        case Type.POISON:
            return 0xa040a0;
        case Type.GROUND:
            return 0xe0c068;
        case Type.ROCK:
            return 0xb8a038;
        case Type.BUG:
            return 0xa8b820;
        case Type.GHOST:
            return 0x705898;
        case Type.STEEL:
            return 0xb8b8d0;
        case Type.FIRE:
            return 0xf08030;
        case Type.WATER:
            return 0x6890f0;
        case Type.GRASS:
            return 0x78c850;
        case Type.ELECTRIC:
            return 0xf8d030;
        case Type.PSYCHIC:
            return 0xf85888;
        case Type.ICE:
            return 0x98d8d8;
        case Type.DRAGON:
            return 0x7038f8;
        case Type.DARK:
            return 0x705848;
        case Type.FAIRY:
            return 0xee99ac;
        case Type.UNKNOWN:
            return 0x68a090;
    }
}

export const checkPokemonMissing = (pokemon)=>{
    const dexEntry = pokemon.scene.gameData.dexData[pokemon.species.speciesId];
    const opponentPokemonDexAttr = pokemon.getDexAttr();
     // Check if Player owns all genders and forms of the Pokemon
     const missingDexAttrs = ((dexEntry.caughtAttr & opponentPokemonDexAttr) < opponentPokemonDexAttr);

     const ownedAbilityAttrs = pokemon.scene.gameData.starterData[pokemon.species.getRootSpeciesId()].abilityAttr;

     // Check if the player owns ability for the root form
     const playerOwnsThisAbility = pokemon.checkIfPlayerHasAbilityOfStarter(ownedAbilityAttrs);
     return !dexEntry.caughtAttr || missingDexAttrs || !playerOwnsThisAbility
}