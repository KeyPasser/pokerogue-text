import { pokemon } from './../locales/pt_BR/pokemon';
import { PokemonHeldItemModifier } from "#app/modifier/modifier.js";
import TextBattleScene from "#app/text-battle-scene.js";
import HUiHandler from "./PhaseUI/HUiHandler";
import { HTMLDialog } from "./Root";
import "./transfer-ui.scss"
import i18next from 'i18next';

type ModifierCounts = { [key: string]: { items: Array<PokemonHeldItemModifier|null>, counts: number[][] } };

export default class TransferUI extends HUiHandler {
    private dom: HTMLDialog;
    modifierInfo: ModifierCounts;
    selectedIndex:number = -1;

    constructor(scene: TextBattleScene) {
        super(scene);//, Mode.PARTY
    }

    init() {
        if (this.dom) return;

        this.dom = new HTMLDialog(() => {
            this.dom.hide();
        }).setTitle(i18next.t("modifierSelectUiHandler:transfer")).setName("transfer-ui").setInnerHTML(`
            <div class="transfer-body">
                <div class="pokemon-list">
                    <div class="pokemon">
                    </div>
                    ${this.scene.getParty().map(pokemon => {
                            return `
                                <div class="pokemon">
                                    ${pokemon.getNameToRender()}
                                </div>
                            `
                     }).join('')
                    }
                    <div class="pokemon">
                    </div>
                </div>

                <div class="modifiers">
                </div>
            </div>
                <div class="msg">
                </div>
            `)
            ;

    }
    show() {
        const modifierInfo: ModifierCounts = this.modifierInfo = {};
        this.scene.findModifiers(m => {
            if (m instanceof PokemonHeldItemModifier && m.isTransferable) {
                const pokeItem: PokemonHeldItemModifier = m;
                const id = pokeItem.type.iconImage;

                const maxCount = m.getMaxStackCount(this.scene,false);
                const stackCount = m.stackCount;

                modifierInfo[id] = modifierInfo[id] || {
                    items: [null,null,null,null,null,null],
                    counts: [[0,0], [0,0], [0,0], [0,0], [0,0], [0,0]]
                };

                const party = this.scene.getParty();
                for (let i = 0; i < party.length; i++) {
                    const pokemon = party[i];

                    if (pokemon.id == m.pokemonId) {
                        modifierInfo[id].items[i] = pokeItem;
                        modifierInfo[id].counts[i] = [stackCount, maxCount];
                        break;
                    }
                }
            }
            return true;
        }) as PokemonHeldItemModifier[];

        this.init();

        let html = '';
        Object.keys(modifierInfo).forEach(key => {
            const info = modifierInfo[key];
            const item = info.items.filter(i => i)[0]!;

            html += `
                <div class="modifier">
                    <div class="name">
                        ${item.type.name}
                    </div>
                    ${info.counts.map(([count,max], i) => {
                            return `
                                <div class="count">
                                    <label><span class="count">${count}</span>/<span>${max}</span></label>
                                </div>
                            `
                        }).join('')
                    }
                    <div class="buttons"><button class="reassign">\u21c4</button></div>
                </div>
                `
        });
        this.dom.findObject(".modifiers").setInnerHTML(html).findAll(".modifier .name").forEach((el, i) => {
            el.addEventListener("click", () => {
                const item = Object.values(this.modifierInfo)[i].items.filter(i => i)[0]!;
                this.dom.findObject(".msg").setInnerHTML(item.type.getDescription(this.scene));
            });
        })
        this.dom.findAll(".modifier .buttons button.reassign").forEach((el, modifierIndex) => {
            el.addEventListener("click", (e) => {
                this.selectedIndex = modifierIndex;
                const info = Object.values(this.modifierInfo)[modifierIndex];
                
                const item = info.items.filter(i => i)[0]!;
                const maxCount = item.getMaxStackCount(this.scene,false);

                const total =  info.counts.reduce((sum,v)=>{
                    return sum += v[0];
                },0);

                const dialog = new HTMLDialog(() => {
                    dialog.hide();
                }).setInnerHTML(`
                    <div class="reassign">
                            ${this.scene.getParty().map((pokemon,i) => {
                                return `
                                <div class="pokemon" data-index=i>
                                    <div class="pokemon">
                                        ${pokemon.getNameToRender()}
                                    </div>
                                    <input value="${info.counts[i][0]}"/>
                                    /${maxCount}
                                </div>
                                `
                                }).join('')
                            }
                            <div class="footer">
                                <label class="remain">remain:${total}</label>
                                <button class="clear">clear</button>
                                <button class="ok">ok</button>
                            </div>
                    </div>
                `).show();
                dialog.findAll(".reassign .pokemon input").forEach((el) => {
                    el.addEventListener("blur", () => {
                        dialog.findObject(".remain").setText(`remain:${this.getRemain(modifierIndex,dialog)}`);
                    });
                });
                dialog.findObject(".footer .clear").on("click", async () => {
                    dialog.findAll(".reassign .pokemon input").forEach((el) => {
                        (el as HTMLInputElement).value = "0";
                    });
                });
                dialog.findObject(".footer .ok").on("click", async () => {
                    const remain = this.getRemain(modifierIndex,dialog);
                    if(remain > 0 || remain < 0){
                        alert("remain error");
                        return;
                    }
                    const counts = Array.from(dialog.findAll(".reassign .pokemon input")).map((el) => {
                        return parseInt((el as HTMLInputElement).value);
                    });


                    if(counts.some(v=>v > maxCount)){
                        alert("beyond max count: "+maxCount);
                        return;
                    }

                    const cloneItem = item.clone() as PokemonHeldItemModifier;

                    info.items.map(modifier=>{
                        this.scene.removeModifier(modifier!)
                    })

                    const party = this.scene.getParty();
                    for (let i = 0; i < party.length; i++) {
                        const pokemon = party[i];
                        if(counts[i] > 0){
                            const newItem = cloneItem.clone() as PokemonHeldItemModifier;

                            newItem.pokemonId = pokemon.id;
                            newItem.stackCount = counts[i];

                            await this.scene.addModifier(newItem, false,false);

                            info.items[i] = newItem;
                            info.counts[i] = [counts[i], maxCount];
                        }else{
                            info.items[i] = null;
                            info.counts[i] = [0, 0];
                        }
                    }

                    dialog.hide();
                    this.dom.findObject(`.modifiers .modifier:nth-child(${modifierIndex+1})`).setInnerHTML(`
                        <div class="modifier">
                        <div class="name">
                            ${cloneItem.type.name}
                        </div>
                            ${info.counts.map(([count,max], i) => {
                                    return `
                                        <div class="count">
                                            <label><span class="count">${count}</span>/<span>${max}</span></label>
                                        </div>
                                    `
                                }).join('')
                            }
                            <div class="buttons"><button class="reassign">\u21c4</button></div>
                        </div>
                        `)
                });
            });
        })

        this.dom.show()
    }

    getRemain(i,dialog){
        const total =  Object.values(this.modifierInfo)[i].counts.reduce((sum,v)=>{
            return sum += v[0];
        },0);

        let remain = total;
        dialog.findAll(".reassign .pokemon input").forEach((el) => {
            remain -= parseInt((el as HTMLInputElement).value);
        }, 0);

        return remain;
    }
}