import "./style.scss"
import { bbcodeToHtml } from "./TextPlugin";
import type TextBattleScene from '#app/text-battle-scene.js';

import { addHTMLSprit } from "./PhaseInterface";
import { ModifierTier } from "#app/modifier/modifier-tier.js";
import { checkPokemonMissing } from "./util";
import { BattleSceneEventType } from "#app/events/battle-scene.js";
import type { EnemyPokemon } from "#app/field/pokemon.js";
import { setPokemonNameComponent } from "./widgets/pokeName";

enum TextStyle {
    MESSAGE,
    WINDOW,
    WINDOW_ALT,
    BATTLE_INFO,
    PARTY,
    PARTY_RED,
    SUMMARY,
    SUMMARY_ALT,
    SUMMARY_RED,
    SUMMARY_BLUE,
    SUMMARY_PINK,
    SUMMARY_GOLD,
    SUMMARY_GRAY,
    SUMMARY_GREEN,
    MONEY,
    STATS_LABEL,
    STATS_VALUE,
    SETTINGS_VALUE,
    SETTINGS_LABEL,
    SETTINGS_SELECTED,
    SETTINGS_LOCKED,
    TOOLTIP_TITLE,
    TOOLTIP_CONTENT,
    MOVE_INFO_CONTENT,
    MOVE_PP_FULL,
    MOVE_PP_HALF_FULL,
    MOVE_PP_NEAR_EMPTY,
    MOVE_PP_EMPTY,
    SMALLER_WINDOW_ALT,
    BGM_BAR,
    PERFECT_IV
}

class HTMLObject {
    name: string;
    protected dom: HTMLElement;
    scale: 1;
    y: 0;
    x: 0;
    displayWidth: 1;
    visible: boolean = true;
    setName(name) {
        this.name = name;
    }
    hide(): Promise<void> {
        this.dom.style.display = "none";
        return Promise.resolve();
    }
    show(): void {
        this.dom.style.display = "block";
    }
    setY(y) {
        this.dom.style.top = y + 'px';
    }
    setText(text) {
        this.dom.innerHTML = text
        return this;
    }
    getText() {
        return this.dom.textContent as string;
    }
    setBBCode(text) {
        const html = bbcodeToHtml(text);
        this.setText(html);
        return this;
    }
    setAlpha(alpha) {
        this.dom.style.opacity = alpha;
    }
    setVisible(visible) {
        this.visible = visible;
        if (!this.dom) debugger;
        this.dom.style.display = visible ? 'block' : "none"
        if (visible)
            this.dom.style.opacity = '1';
        return this;
    }
    setInteractive(rect: any, fn: any) {

    }
    on(trigger, fn) {
        this.dom.addEventListener(trigger, fn);
        return this;
    }
    off(trigger, fn) {
        this.dom.removeEventListener(trigger, fn);
        return this;
    }
    setPosition(x: number, y: number) {
        return this;
    }
    setOrigin(x: number, y: number) {
        return this;
    }
    getBounds() {
        return this.dom.getBoundingClientRect()
    }
    getBottomLeft() {
        const ret = this.dom.getBoundingClientRect()
        return {
            x: ret.left,
            y: ret.bottom
        }
    }
    getTopLeft() {
        const ret = this.dom.getBoundingClientRect()
        return {
            x: ret.left,
            y: ret.top
        }
    }
    setColor(c) {
        if (typeof c === 'number') {
            if (c < 100)
                c = getRootContainer().getTextColor(c);
            else c = "#" + c.toString(16);
        }
        this.dom.style.color = c;
        return this;
    }
    setAlign(a) {
        this.dom.style.textAlign = a;
        return this;
    }
    setLineSpacing(ls) {
        this.dom.style.lineHeight = ls
        return this;
    }
    setShadow(x, y, color) {
        this.setShadowColor(color)
        return this;
    }
    setShadowColor(color) {
        this.dom.style.textShadow = `1px 1px 1px ${color}`;
        return this;
    }
    setTint(...args) {
    }
    setX(x) {
        this.dom.style.left = x + 'px';
    }
    getDOM() {
        return this.dom;
    }
    setSize(x, y) {

    }
    once(event, fn) {

    }
    removeFromDisplayList() {

    }
    addedToScene() {

    }
    setRotation() {

    }
    moveTo() {

    }
    moveBelow() { }
    setPositionRelative() { }
    destroy() { }
    willRender() { return false }
    setAngle() { return false }
    pipelineData = {};
    addClass(clz) {
        this.dom.classList.add(clz)
        return this;
    }
    removeClass(clz) {
        this.dom.classList.remove(clz)
    }
    setToolTip(title, name) {
        this.dom.title = title + "\n" + name;
    }
    setStrokeStyle() {
        return this;
    }
    setLineWidth() {
        return this;

    }
    createGeometryMask() {
        return 0;
    }
    setMask() {
    }
    setLoop() {

    }
    bringToTop() {

    }
    getByName() {
        return new HTMLContainer();
    }
}

class HTMLContainer extends HTMLObject {
    public objects: HTMLObject[] = [];
    public list = [];
    scene: TextBattleScene;

    constructor(width: any = undefined, height: any = undefined, y: any = 0) {
        super();
        if (width instanceof HTMLElement) {
            this.dom = width;
            return
        }

        const div = document.createElement('div');
        this.dom = div;
        if (width && width.textPlugin) {
            this.scene = width;
            return;
        }

        if (typeof width === 'undefined') return;

        let finalWidth = width, finalHeight = height;
        if (typeof width === 'number') finalWidth += 'px';
        if (typeof height === 'number') finalHeight += 'px';

        div.style.width = finalWidth as string;
        div.style.height = finalHeight as string;

    }
    runWordWrap(text) {
        return text;
    }
    setTintFill() {

    }
    clearTint() {

    }
    play() {

    }
    stop() {
        return this
    }
    setTexture() {
        return this;
    }
    disableInteractive() {

    }
    getAt(i: number) {
        return addHTMLSprit({}) as any;
    }
    getSprite() {
        return this;
    }
    addAt(obj, index) {
        this.objects.splice(index, 0, obj)
    }
    setBiome() {

    }
    setWordWrapWidth() {

    }
    setText(text) {
        if (this.dom.children.length > 0) {
            this.add(
                new HTMLContainer().setText(text)
            )
        } else super.setText(text);
        return this;
    }
    disableEvent(disabled) {
        if (disabled) {
            this.setAlpha(0.5);
            this.dom.style.cursor = 'no-drop';
        } else {
            this.setAlpha(1);
            this.dom.style.cursor = 'pointer';
        }
        return this;
    }
    setInnerHTML(html) {
        this.dom.innerHTML = html;
        return this;
    }
    destroy(clear = true) {
        clear && (this.dom.innerHTML = '');
        this.dom.remove();
    }
    setName(name) {
        this.dom.id = name;
        return this;
    }
    setScale(s) {

    }
    setDepth() {

    }
    moveAbove(dom, dom2) {

    }
    sendToBack() {

    }
    unshift<T extends HTMLObject>(child: T | T[]) {
        if (!Array.isArray(child)) {
            child = [child]
        }
        child.map(c => this.dom.prepend((c.getDOM && c.getDOM() || c)))
    }
    add(child: any) {
        if(typeof child === 'string'){
            child = [new HTMLContainer().setInnerHTML(child)];
        }
        if (!Array.isArray(child)) {
            child = [child]
        }
        
        child.map(c => {
            this.objects.push(c);
            this.dom.append((c.getDOM && c.getDOM() || c))
        });
        return this;
    }
    remove(child?: HTMLObject) {
        if (!child) {
            this.dom.remove();
            return this;
        }

        if (!child.getDOM) return;

        Array.from(this.dom.children).some(c => {
            if (c == child.getDOM()) {
                child.getDOM().remove();
                return true;
            }
        })
    }
    removeAll(destroyChild: boolean = true) {
        this.dom.innerHTML = "";
        return this;
    }
    getAll() {
        return this.objects;
        //return Array.from(this.dom.children) as HTMLElement[]
    }
    getIndex(c) {
        return Array.from(this.dom.children).indexOf(c.dom ? c.dom : c)
    }
    setShadowOffset(x, y) {

    }
    setStroke() {

    }
    find(selector) {
        return this.dom.querySelector(selector) as HTMLElement;
    }
    findAll(selector: string) {
        return this.dom.querySelectorAll(selector);
    }
    findObject(selector) {
        return new HTMLContainer(this.find(selector));
    }
    getValues() {
        if (this.dom.tagName == "SELECT") {
            return [(this.dom as HTMLSelectElement).value];
        }
        return this.dom.textContent;
    }
    setValue(value) {
        (this.dom as HTMLOptionElement).value = value;
        return this;
    }
    appendTo(dom) {
        if (dom instanceof HTMLContainer) {
            dom.add(this);
        } else {
            dom.append(this.dom);
        }
        return this;
    }
    setTitle(title){
        this.dom.title = title;
        return this;
    }
}

export class HTMLDialog extends HTMLContainer {
    protected dom: HTMLDialogElement;
    private onClose: () => void;
    private container: HTMLElement | null;

    constructor(onClose: () => void, container: HTMLElement | null = null) {
        super(document.createElement(container ? "div" : 'dialog'))
        this.container = container;

        this.dom.innerHTML = `<div class="header">
            <h1><span></span><button id="close">x</button></h1>
        </div>
        <div class="body"></div>
        `

        this.onClose = onClose;
        this.dom.addEventListener('click', e => {
            const dom = e.target as HTMLElement;
            if (dom.id == "close") this.onClose();
        })
    }
    setInnerHTML(html) {
        this.getDOM().innerHTML = html;
        return this;
    }
    add(child) {
        this.findObject('.body').add(child);
        return this;
    }
    setTitle(title) {
        this.find('h1 span:first-child').textContent = title;
        return this;
    }
    removeAll(destroyChild: boolean = true) {
        this.getDOM().innerHTML = "";
        return this;
    }
    getDOM(): HTMLElement {
        return this.dom.querySelector(".body") as HTMLElement;
    }
    show() {
        super.show();
        if (this.container) {
            this.container.append(this.dom);
            this.container.scrollTop = this.container.scrollHeight;
            return this;
        }
        document.body.append(this.dom);
        this.dom.showModal();
        return this;
    }
    hide() {
        if (this.container) {
        } else
            this.dom.close();
        return super.hide();
    }
}



export enum Theme {
    DARK = 'dark',
    LIGHT = 'light',
    GRAY = 'gray'
}

export function getTierColor(tier: ModifierTier): integer {
    switch (tier) {
        default:
        case ModifierTier.COMMON:
            return 0xcccccc;
        case ModifierTier.GREAT:
            return 0x4998f8;
        case ModifierTier.ULTRA:
            return 0xf8d038;
        case ModifierTier.ROGUE:
            return 0xdb4343;
        case ModifierTier.MASTER:
            return 0xe331c5;
        case ModifierTier.LUXURY:
            return 0xe74c18;
    }
}

class TextUI extends HTMLContainer {
    scene: TextBattleScene;
    theme: Theme = Theme.LIGHT;
    public skip: boolean = false;

    openMenu() {
        if (this.scene.ui.getMode() == 16) {
            this.scene.ui.revertMode()
        } else this.scene.ui.setOverlayMode(16);
    }
    constructor(scene: TextBattleScene) {
        super(0, 0);
        this.scene = scene;

        const dom = this.dom;

        document.addEventListener('keydown', (e) => {
            if (e.key == 'm') {
                this.openMenu()
                return;
            }
            switch (e.key) {
                case 'x':
                    this.skip = !this.skip;
                    break;
                case 'a':
                    this.scene.ui.processInput(100 + 0);
                    break;
                case 's':
                    this.scene.ui.processInput(100 + 1);
                    break;
                case 'd':
                    this.scene.ui.processInput(100 + 2);
                    break;
                case 'q':
                    this.scene.ui.processInput(100 + 3);
                    break;
                case 'w':
                    this.scene.ui.processInput(100 + 4);
                    break;
                case 'e':
                    this.scene.ui.processInput(100 + 5);
                    break;
                case '1':
                    this.scene.ui.processInput(100 + 6);
                    break;
                case '2':
                    this.scene.ui.processInput(100 + 7);
                    break;
                case '3':
                    this.scene.ui.processInput(100 + 8);
                    break;
                case 'Escape':
                    this.scene.ui.processInput(100 + 99);
                    break;
            }

        })

        dom.style.width = '100%';
        dom.style.height = 'calc(100% - 20px)';

        dom.classList.add('text-ui');
        dom.innerHTML = `<div id="basicInfo">
            <div id="text-biome-wave"></div>
            <div id="text-money"></div>
            <div id="text-score"></div>
            <div id="luckHint">
                <div id="text-luck-label"></div>
                <div id="text-luck"></div>
            </div>
            <div id="enemy-global-modifiers">
            </div>
        </div>
        <div class="battle">
            <div id="ability-bar"></div>
            <div id="candy-bar"></div>
            <div id="party-exp-bar"></div>
            <div id="main">
                <div id="enemies"></div>
                <div id="msg-container"></div>
                <div id="player-pokes"></div>
                <div id="player-modifiers"></div>
            </div>
        </div>
        <div class="input-pad">
            <button class="menu-button">M</button>
            <button class="skip-button">E</button>
        </div>
        `

        document.querySelector("#appContainer")?.after(dom);

        if (window.location.href.indexOf("localhost") !== -1) {
            this.theme = Theme.GRAY;
        }
        import("#app/touch-controls.js")
            .then(module => {
                if (module.isMobile()) {
                    if (window.location.href.indexOf("localhost") == -1) {
                        document.body.classList.add('dark');
                        this.theme = Theme.DARK;
                    }

                    this.findObject('.input-pad').addClass('visible');

                    this.findObject(".menu-button").on('touchstart', () => {

                    }).on('touchend', () => {
                        this.openMenu();
                    });
                    this.findObject(".skip-button").on('touchstart', () => {

                    }).on('touchend', (e) => {
                        this.skip = !this.skip;
                        const button = (e.target as HTMLButtonElement)
                        button.classList.toggle("skip")
                    });
                }
            })

        scene.eventTarget.addEventListener("onTurnInit", () => {
            if (this.scene.currentBattle.trainer) {
                let html = this.scene.currentBattle.trainer.getName() + "<div class='enemy-pokes'>"
                this.scene.getEnemyParty().forEach((pokemon, index) => {
                    html += `<div class="iconfont icon-pokeball ${!pokemon.isFainted() && "alive"}"></div>`;
                });
                this.scene.textPlugin.showOptionDom(new HTMLContainer().setInnerHTML('<br/>' + html + " </div>"));
            } else {
                const containers = new HTMLContainer().add('<br/>');

                this.scene.getEnemyParty().forEach((pokemon, index) => {
                    if(pokemon.isBoss()){
                        pokemon = pokemon as EnemyPokemon;
                        let html = `<div>
                        <span class="poke-name">${pokemon.name}</span>
                        ${ `<span>${pokemon.bossSegmentIndex}/${pokemon.bossSegments}</span>`}
                        </div>`;
    
                        const pokeDom = new HTMLContainer().setInnerHTML(html);
                        containers.add(pokeDom);
    
                        setPokemonNameComponent(pokemon,containers.findObject('.poke-name'));
                    }
                });

                this.scene.textPlugin.showOptionDom(containers);
            }
        })
    }
    autoSkip() {
        return this.skip && !this.scene.getEnemyParty().some(p => (p.isShiny() || checkPokemonMissing(p)));
    }
    getTextColor(textStyle: TextStyle, shadow: boolean = this.theme !== Theme.DARK, uiTheme = Theme.LIGHT) {
        if (this.theme == Theme.GRAY) {
            return "#CCC";
        }
        switch (textStyle) {
            case TextStyle.MESSAGE:
                return !shadow ? "#f8f8f8" : "#6b5a73";
            case TextStyle.WINDOW:
            case TextStyle.MOVE_INFO_CONTENT:
            case TextStyle.MOVE_PP_FULL:
            case TextStyle.TOOLTIP_CONTENT:
            case TextStyle.SETTINGS_VALUE:
                if (uiTheme) {
                    return !shadow ? "#bdbdbd" : "#d0d0c8";
                }
                return !shadow ? "#f8f8f8" : "#6b5a73";
            case TextStyle.MOVE_PP_HALF_FULL:
                if (uiTheme) {
                    return !shadow ? "#a68e17" : "#ebd773";
                }
                return !shadow ? "#ccbe00" : "#6e672c";
            case TextStyle.MOVE_PP_NEAR_EMPTY:
                if (uiTheme) {
                    return !shadow ? "#d64b00" : "#f7b18b";
                }
                return !shadow ? "#d64b00" : "#69402a";
            case TextStyle.MOVE_PP_EMPTY:
                if (uiTheme) {
                    return !shadow ? "#e13d3d" : "#fca2a2";
                }
                return !shadow ? "#e13d3d" : "#632929";
            case TextStyle.WINDOW_ALT:
                return !shadow ? "#bdbdbd" : "#d0d0c8";
            case TextStyle.BATTLE_INFO:
                if (uiTheme) {
                    return !shadow ? "#404040" : "#ded6b5";
                }
                return !shadow ? "#f8f8f8" : "#6b5a73";
            case TextStyle.PARTY:
                return !shadow ? "#f8f8f8" : "#707070";
            case TextStyle.PARTY_RED:
                return !shadow ? "#f89890" : "#984038";
            case TextStyle.SUMMARY:
                return !shadow ? "#f8f8f8" : "#636363";
            case TextStyle.SUMMARY_ALT:
                if (uiTheme) {
                    return !shadow ? "#f8f8f8" : "#636363";
                }
                return !shadow ? "#bdbdbd" : "#d0d0c8";
            case TextStyle.SUMMARY_RED:
            case TextStyle.TOOLTIP_TITLE:
                return !shadow ? "#e70808" : "#ffbd73";
            case TextStyle.SUMMARY_BLUE:
                return !shadow ? "#40c8f8" : "#006090";
            case TextStyle.SUMMARY_PINK:
                return !shadow ? "#f89890" : "#984038";
            case TextStyle.SUMMARY_GOLD:
            case TextStyle.MONEY:
                return !shadow ? "#e8e8a8" : "#a0a060";
            case TextStyle.SETTINGS_LOCKED:
            case TextStyle.SUMMARY_GRAY:
                return !shadow ? "#a0a0a0" : "#636363";
            case TextStyle.STATS_LABEL:
                return !shadow ? "#f8b050" : "#c07800";
            case TextStyle.STATS_VALUE:
                return !shadow ? "#f8f8f8" : "#6b5a73";
            case TextStyle.SUMMARY_GREEN:
                return !shadow ? "#78c850" : "#306850";
            case TextStyle.SETTINGS_LABEL:
            case TextStyle.PERFECT_IV:
                return !shadow ? "#f8b050" : "#c07800";
            case TextStyle.SETTINGS_SELECTED:
                return !shadow ? "#f88880" : "#f83018";
            case TextStyle.SMALLER_WINDOW_ALT:
                return !shadow ? "#bdbdbd" : "#d0d0c8";
            case TextStyle.BGM_BAR:
                return !shadow ? "#f8f8f8" : "#6b5a73";
        }
    }
    findObject(selector: any): HTMLContainer {
        return new HTMLContainer(this.dom).findObject(selector);
    }
}




let rootUI: TextUI;

export function getRootContainer(scene: any = null) {
    if (rootUI)
        return rootUI;

    return rootUI = new TextUI(scene);
}
export function getHTMLContainer(width: number | string, height: number | string) {
    return new HTMLContainer(width, height) as any as Phaser.GameObjects.Container
}

export {
    HTMLObject,
    HTMLContainer
}

export default HTMLContainer;