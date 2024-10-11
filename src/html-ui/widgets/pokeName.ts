import { Gender } from "#app/data/gender.js";
import { Stat } from "#app/enums/stat.js";
import type Pokemon from "#app/field/pokemon.js";
import type TextBattleScene from "#app/html-ui/text-battle-scene";
import { isMobile } from "#app/touch-controls.js";
import { ShinyColor } from "../Constants";
import { HTMLContainer } from "../Root";
import type HSummaryUiHandler from "../summary-ui-handler";
import "./poke-sprite.scss"

let phaserLoader;

const showSummary = (scene: TextBattleScene, pokemon:Pokemon) => {
    const summary = scene.ui.handlers[9] as any as HSummaryUiHandler;
    summary.onClose = () => {
        summary.clear();
        summary.onClose = null;
    }
    summary.show([pokemon]);

    summary.hideSelectors();
}

export const showSprite = async (pokemon:Pokemon,event)=>{
  const clientRect = event.target.getBoundingClientRect();

  let dom = document.getElementById('poke-sprite') as HTMLIFrameElement;
  if(!dom){
    dom = document.createElement('iframe');
    dom.id = 'poke-sprite';

    document.body.append(dom);

    if(import.meta.env.VITE_DEPLOY === "github"){
      dom.src ="/pokerogue-text/dist/src/html-ui/sprite.html";
    }else
      dom.src ="/src/html-ui/sprite.html";
    phaserLoader = new Promise((resolve)=>{
      dom.onload = ()=>{
        resolve(1);
      }
    })
  }

  await phaserLoader;

  dom.style.display = 'block';
  setTimeout(() => {
    dom.style.display = 'none';
  }, 15000);
  
  if(isMobile()){
    dom.style.right = '0';
    dom.style.top = '30%';
  }else{
    dom.style.left = (clientRect.right+50) + 'px';
    dom.style.top = clientRect.top + 'px';
  }

  dom.contentWindow?.postMessage({
    spriteKey:pokemon.getSpriteKey(),
    speciesId:pokemon.species.getSpriteId(pokemon.getGender() == Gender.FEMALE, pokemon.formIndex, pokemon.isShiny(), pokemon.getVariant()),
    absolutePath:(pokemon.species).getSpriteAtlasPath(pokemon.getGender() == Gender.FEMALE, pokemon.formIndex, pokemon.isShiny(), pokemon.getVariant())
  })
}

export const setPokemonNameComponent = (pokemon:Pokemon, dom:HTMLContainer, skipClick = false) => {
    dom.setText(pokemon.getNameToRender())

    const isFusion = pokemon.isFusion();

    const doubleShiny = isFusion && pokemon.shiny && pokemon.fusionShiny;
    const baseVariant = !doubleShiny ? pokemon.getVariant() : pokemon.variant;

    if (pokemon.isShiny()) {
      if(!doubleShiny && baseVariant+1){
        dom.setColor(ShinyColor['Variant'+(baseVariant+1)]);
      }
    }
    const onClick = showSummary.bind(null, pokemon.scene, pokemon, dom);
    dom.off('click', onClick);

    if(!pokemon.isPlayer()){
      dom.on('click', showSprite.bind(this,pokemon));
    }else{
      if(!skipClick){
        dom.on('click', onClick);
      }
    }
}

const NameMap = {
  [Stat.ATK]: "&#xe68b;",
  [Stat.DEF]: "&#xea22;",
  [Stat.SPATK]: "&#xe6c4;",
  [Stat.SPDEF]: "&#xe668;",
  [Stat.ACC]: "&#xe972;",
  [Stat.EVA]: "&#xe600;",
  [Stat.SPD]: "&#xe67c;",
  [Stat.HP]: "&#xe665;",
}

export function getIVsName(stat){
  return NameMap[stat]??"";
}