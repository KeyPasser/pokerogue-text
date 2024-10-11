import { VariantSet } from '#app/data/variant.js';
import Phaser from 'rphaser'

const expSpriteKeys: string[] = [];
const variantData: any = {};


let gSpriteKey = "";
let gAbsolutePath = "";

const initVariantData = async function loadVD(): Promise<void> {
    Object.keys(variantData).forEach(key => delete variantData[key]);
    await fetch("https://raw.githubusercontent.com/pagefaultgames/pokerogue/refs/heads/main/public/images/pokemon/variant/_masterlist.json").then(res => res.json())
      .then(v => {
        Object.keys(v).forEach(k => variantData[k] = v[k]);
        if (1) {
          const expVariantData = variantData["exp"];
          const traverseVariantData = (keys: string[]) => {
            let variantTree = variantData;
            let expTree = expVariantData;
            keys.map((k: string, i: integer) => {
              if (i < keys.length - 1) {
                variantTree = variantTree[k];
                expTree = expTree[k];
              } else if (variantTree.hasOwnProperty(k) && expTree.hasOwnProperty(k)) {
                if ([ "back", "female" ].includes(k)) {
                  traverseVariantData(keys.concat(k));
                } else {
                  variantTree[k] = expTree[k];
                }
              }
            });
          };
          Object.keys(expVariantData).forEach(ek => traverseVariantData([ ek ]));
        }
        Promise.resolve();
      });
  }

class PokeSprite extends Phaser.Scene {
    experimentalSprites: boolean = true;
    currentSprite: any = "";
    constructor() {
        super();
    }
    hasExpSprite(key: string): boolean {
        const keyMatch = /^pkmn__?(back__)?(shiny__)?(female__)?(\d+)(\-.*?)?(?:_[1-3])?$/g.exec(key);
        if (!keyMatch) {
            return false;
        }

        let k = keyMatch[4]!;
        if (keyMatch[2]) {
            k += "s";
        }
        if (keyMatch[1]) {
            k += "b";
        }
        if (keyMatch[3]) {
            k += "f";
        }
        if (keyMatch[5]) {
            k += keyMatch[5];
        }
        if (!expSpriteKeys.includes(k)) {
            return false;
        }
        return true;
    }

    preload() {
        //"https://github.com/pagefaultgames/pokerogue/raw/refs/heads/main/public/"
        this.load.setBaseURL(`https://raw.githubusercontent.com/pagefaultgames/pokerogue/refs/heads/main/public/`);
        // this.load.setBaseURL(`https://gitee.com/myrant/pokerogue/raw/main/public/`);
        this.loadPokemonAtlas();
    }
    loadPokemonAtlas(key: string = gSpriteKey, atlasPath: string = gAbsolutePath, experimental: boolean=true) {

        const variant = atlasPath.includes("variant/") || /_[0-3]$/.test(atlasPath);
        if (experimental) {
            experimental = this.hasExpSprite(key);
        }
        if (variant) {
            atlasPath = atlasPath.replace("variant/", "");
        }
        this.load.atlas(key, `images/pokemon/${variant ? "variant/" : ""}${experimental ? "exp/" : ""}${atlasPath}.png`, `images/pokemon/${variant ? "variant/" : ""}${experimental ? "exp/" : ""}${atlasPath}.json`,{
            headers:{
                "Accept": "application/vnd.github.v3+json"
            }
        });
    }
    showSprite() {
        const key = gSpriteKey;

        const sprite = this.currentSprite = this.add.sprite(40, 40, key);
        sprite.setSize(60, 60);
        sprite.setScale(0.8)
        
        const animConfig = {
            key: key+'walk',
            frames: key,
            repeat: -1
        };

        if (!(this.anims.exists(key+'walk')))
            this.anims.create(animConfig);

        sprite.play(key+'walk');
    }
    create() {
        this.showSprite();
    }
}

let loading,game;

const showPokeSprite = async (pokemon)=>{
    gSpriteKey = pokemon.spriteKey;
    gAbsolutePath = pokemon.absolutePath;

    const e = document.querySelector("#app") as HTMLElement;
    e.style.display = "block";

    const config = {
        type: Phaser.AUTO,
        parent: "app",
        width: 80,
        height: 80,
        backgroundColor: '#304858',
        scene: PokeSprite
    };

    if(!loading){
        loading = initVariantData()
    }
    await loading;
    
    if(!game){
        game = new Phaser.Game(config);
    }else{
        const scene = game.scene.scenes[0];

        scene.currentSprite.destroy();

        scene.loadPokemonAtlas();
        
        scene.load.start();

        await new Promise(resolve=>{
            scene.load.once(Phaser.Loader.Events.COMPLETE, () => resolve(1));
        })

        scene.showSprite();
    }

    setTimeout(() => {
        const scene = game.scene.scenes[0];
        scene.currentSprite.destroy();
        e.style.display = "none";
    }, 6000);
}

window.onmessage = (event)=>{
    const pokemon = event.data;
    showPokeSprite(pokemon);
}

