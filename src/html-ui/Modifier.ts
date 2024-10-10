import { BattleSceneEventType } from "#app/events/battle-scene.js";
import { modifierSortFunc, PersistentModifier, PokemonHeldItemModifier } from "#app/modifier/modifier.js";
import BattleScene from "#app/text-battle-scene.js";
import { getHTMLContainer, getRootContainer, HTMLContainer } from "./Root";

const iconOverflowIndex = 24;
const getHModifierIcon = (modifier: PersistentModifier, scene: BattleScene, forSummary?: boolean) => {
  const HModifier = getHTMLContainer('auto', '16') as any as HTMLContainer;
  HModifier.setText(modifier.type.name+" * " + modifier.stackCount.toString())

  return HModifier;
}


class HModifierBar extends HTMLContainer {
  scene: BattleScene
  player: boolean = false;
  private modifierCache: any[];
  constructor(scene: BattleScene, enemy: boolean = false) {
    super('100%', 'auto');

    const dom = this.dom;

    dom.classList.add('modifier-bar');
    dom.innerHTML = `<div class="modifier-bar"></div>`
    dom.style.display = 'none';

    this.scene = scene;

    this.player = !enemy;

    //getRootContainer(scene).find(enemy?"#enemies":"#player-pokes").append(dom);

    scene.eventTarget.addEventListener(BattleSceneEventType.TURN_INIT, () => {
        this.outputModifiers(this.player?scene.modifiers:scene.enemyModifiers)
    })
  }
  updateModifiers(modifiers: PersistentModifier[], hideHeldItems: boolean = false) {
    console.log('update')
    return;
  }
  outputModifiers(modifiers: PersistentModifier[], hideHeldItems: boolean = false) {
    this.removeAll(true);

    const visibleIconModifiers = modifiers.filter(m => m.isIconVisible(this.scene as BattleScene));
    const nonPokemonSpecificModifiers = visibleIconModifiers.filter(m => !(m as PokemonHeldItemModifier).pokemonId).sort(modifierSortFunc);
    const pokemonSpecificModifiers = visibleIconModifiers.filter(m => (m as PokemonHeldItemModifier).pokemonId).sort(modifierSortFunc);

    const sortedVisibleIconModifiers = hideHeldItems ? nonPokemonSpecificModifiers : nonPokemonSpecificModifiers.concat(pokemonSpecificModifiers);
    
    this.scene.textPlugin?.removeDom( '.poke-modifier')
    const dom = this.scene.textPlugin.createOptionDom("poke-modifier");

    let text = "";
    let globalModifiers = ""

    sortedVisibleIconModifiers.forEach((modifier: PersistentModifier, i: integer) => {
      const maxCount = modifier.getMaxStackCount(this.scene, false);

      if(!(modifier as PokemonHeldItemModifier).pokemonId){
        globalModifiers+=`<div class="modifier"><span title="${modifier.type.name+" * " + modifier.stackCount.toString()}" class="iconfont icon-${modifier.type.iconImage}"></span><span class=${maxCount == modifier.stackCount?"max":""}>*${modifier.stackCount}</span></div>`;
        return;
      }
      text+=`<div title="${modifier.type.name+" * " + modifier.stackCount.toString()}" class="iconfont icon-${modifier.type.iconImage}"></div>`;
    });

    dom.innerHTML = text;
    this.scene.textPlugin?.showOptionDom(dom);

    getRootContainer().findObject(this.player?"#player-modifiers":"#enemy-global-modifiers").setInnerHTML(globalModifiers);

    this.modifierCache = modifiers;
  }
  updateModifierOverflowVisibility(ignoreLimit: boolean) {
    const modifierIcons = this.getAll().reverse();
    for (const modifier of modifierIcons.map(m => m).slice(iconOverflowIndex)) {
      modifier.getDOM().style.display = ignoreLimit ? 'block' : 'none';
    }
  }

  setModifierIconPosition(icon, modifierCount: integer) {
    const rowIcons: integer = 12 + 6 * Math.max((Math.ceil(Math.min(modifierCount, 24) / 12) - 2), 0);

    const x = (this.getIndex(icon) % rowIcons) * 26 / (rowIcons / 12);
    const y = Math.floor(this.getIndex(icon) / rowIcons) * 20;

    icon.setPosition(this.player ? x : -x, y);
  }
  removeAll(destroy = false){
    getRootContainer().findObject(this.player?"#player-modifiers":"#enemy-global-modifiers").setInnerHTML("");
    return super.removeAll(destroy);
  }
}

export {
  HModifierBar
}