import * as Utils from "../utils";
import { Egg, getLegendaryGachaSpeciesForTimestamp, IEggOptions } from "../data/egg";
import { VoucherType } from "../system/voucher";
import { getPokemonSpecies } from "../data/pokemon-species";
import { Tutorial, handleTutorial } from "../tutorial";
import { Button } from "#enums/buttons";
import Overrides from "#app/overrides";
import { GachaType } from "#app/enums/gacha-types";
import i18next from "i18next";
import { EggTier } from "#enums/egg-type";
import HUiHandler from "./PhaseUI/HUiHandler";
import { Mode } from "./UI";
import TextBattleScene from "#app/html-ui/text-battle-scene";
import "./gacha-style.scss"
import { getTierColor, HTMLContainer, HTMLDialog } from "./Root";
import { ModifierTier } from "#app/modifier/modifier-tier.js";

export default class HEggGachaUiHandler extends HUiHandler {
    private gachaCursor: integer;

    private transitioning: boolean;
    private transitionCancelled: boolean;
    private defaultText: string;

    private ui: HTMLDialog

    constructor(scene: TextBattleScene) {
        super(scene);// Mode.EGG_GACHA

        this.defaultText = i18next.t("egg:selectMachine");
    }

    setup() {

    }

    show(args: any[]): boolean {

        this.gachaCursor = 0;

        Utils.getEnumValues(GachaType).forEach((gachaType, g) => {
            this.updateGachaInfo(g);
        });

        this.setCursor(0);

        this.setGachaCursor(1);

        const species = getPokemonSpecies(getLegendaryGachaSpeciesForTimestamp(this.scene, new Date().getTime()));
        const voucherCounts = this.scene.gameData.voucherCounts;
        const one = voucherCounts[0]
        const five = voucherCounts[1]
        const ten = voucherCounts[2]
        const twentyFive = voucherCounts[3]

        let dialog = this.ui;
        if(!this.ui){
            dialog = this.ui = new HTMLDialog(()=>{
                this.clear();
                this.scene.ui.revertMode();
            }
            ).setName("egg-gacha").setInnerHTML(`
            <div class="tickets-container">
                <div id="ticket-1">1 ${i18next.t("egg:pull")}*${one}</div>
                <div id="ticket-5">5 ${i18next.t("egg:pulls")}*${five}</div>
                <div id="ticket-10">10 ${i18next.t("egg:pulls")}*${ten}</div>
                <div id="ticket-25">25 ${i18next.t("egg:pulls")}*${twentyFive}</div>
            </div>
            <div class="gacha-container">
                <div>
                    <label><input type="radio" class="gacha" name="gacha" value="0" checked>${i18next.t("egg:moveUPGacha")}</label>
                    <label><input type="radio" class="gacha" name="gacha" value="1">${i18next.t("egg:legendaryUPGacha")} ${species.name}</label>
                    <label><input type="radio" class="gacha" name="gacha" value="2">${i18next.t("egg:shinyUPGacha")}</label>
                </div>
                <div>
                    <label><input type="radio" name="ticket" class="ticket" value="0">1 ${i18next.t("egg:pull")}</label>
                    <label><input type="radio" name="ticket" class="ticket" value="1">1 ${i18next.t("egg:pulls")}*10</label>
                    <label><input checked type="radio" name="ticket" class="ticket" value="2">5 ${i18next.t("egg:pulls")}</label>
                    <label><input type="radio" name="ticket" class="ticket" value="3">10 ${i18next.t("egg:pulls")}</label>
                    <label><input type="radio" name="ticket" class="ticket" value="4">25 ${i18next.t("egg:pulls")}</label>
                </div>
            </div>
            <button id="pull">pull!</button>
            <div class="msgs"></div>
            `).on('click', e => {
                const target = e.target as HTMLDivElement;
    
                if (target.id == "pull") {
                    const inputEle:HTMLInputElement =  Array.from(dialog.findAll('input.gacha')).filter((input:HTMLInputElement) => input.checked)[0] as HTMLInputElement;
                    const gachaIndex = inputEle.value;
                    this.gachaCursor = +gachaIndex;

                    const ticketEle = Array.from(dialog.findAll('input.ticket')).filter((input:HTMLInputElement) => input.checked)[0] as HTMLInputElement;
                    const ticketIndex = ticketEle.value;
    
                    const ticketType = [0, 0, 1, 2, 3][ticketIndex];
                    const ticketCount = [1, 10, 1, 1, 1][ticketIndex];
                    const eggCount = [1, 10, 5, 10, 25][ticketIndex];
    
                    if (this.scene.gameData.voucherCounts[ticketType] < ticketCount) {
                        this.showText(i18next.t("egg:notEnoughVouchers"));
                        return;
                    }
    
                    if (this.scene.gameData.eggs.length > 100 - eggCount){
                        this.showText(i18next.t("egg:tooManyEggs"));
                        return;
                    }
    
                    this.consumeVouchers(ticketType, ticketCount);
    
                    this.pull(eggCount);
                }
            })
        }
        

        dialog.setTitle(i18next.t("menuUiHandler:EGG_GACHA")+" "+this.scene.gameData.eggs.length+" / 100");
        
        this.ui.findObject(".msgs").removeAll();
        dialog.show();

        this.showText(this.defaultText, 0);

        handleTutorial(this.scene, Tutorial.Egg_Gacha);

        return true;
    }

    getDelayValue(delay: integer) {
        if (this.transitioning && this.transitionCancelled) {
            delay = Math.ceil(delay / 5);
        }
        return Utils.fixedInt(delay);
    }

    pull(pullCount: integer = 0, count: integer = 0, eggs?: Egg[]): void {
        if (Overrides.EGG_GACHA_PULL_COUNT_OVERRIDE && !count) {
            pullCount = Overrides.EGG_GACHA_PULL_COUNT_OVERRIDE;
        }

        const doPull = () => {
            if (this.transitionCancelled) {
                return this.showSummary(eggs!);
            }

            const doPullAnim = () => {
                if (++count < pullCount) {
                    this.pull(pullCount, count, eggs);
                } else {
                    this.showSummary(eggs!);
                }
            };

            if (!count) {
                this.scene.time.delayedCall(this.getDelayValue(350), doPullAnim);
            } else {
                doPullAnim();
            }
        };

        if (!pullCount) {
            pullCount = 1;
        }
        if (!count) {
            count = 0;
        }
        if (!eggs) {
            eggs = [];
            for (let i = 1; i <= pullCount; i++) {
                const eggOptions: IEggOptions = { scene: this.scene, pulled: true, sourceType: this.gachaCursor };

                // Before creating the last egg, check if the guaranteed egg tier was already generated
                // if not, override the egg tier
                if (i === pullCount) {
                    const guaranteedEggTier = this.getGuaranteedEggTierFromPullCount(pullCount);
                    if (!eggs.some(egg => egg.tier >= guaranteedEggTier) && guaranteedEggTier !== EggTier.COMMON) {
                        eggOptions.tier = guaranteedEggTier;
                    }
                }

                const egg = new Egg(eggOptions);
                eggs.push(egg);
            }
            // Shuffle the eggs in case the guaranteed one got added as last egg
            eggs = Utils.randSeedShuffle<Egg>(eggs);


            (this.scene.currentBattle ? this.scene.gameData.saveAll(this.scene, true, true, true) : this.scene.gameData.saveSystem()).then(success => {
                if (!success) {
                    return this.scene.reset(true);
                }
                doPull();
            });
            return;
        }

        doPull();
    }

    getGuaranteedEggTierFromPullCount(pullCount: number): EggTier {
        switch (pullCount) {
            case 10:
                return EggTier.GREAT;
            case 25:
                return EggTier.ULTRA;
            default:
                return EggTier.COMMON;
        }
    }

    showSummary(eggs: Egg[]): void {
        const eggContainer = new HTMLContainer().setName("eggs-container")
        .setInnerHTML(eggs.map((egg, i) => 
            `<div data-index=${i} style="color:#${getTierColor(egg.tier as any as ModifierTier).toString(16)}">${i18next.t("egg:egg")} (${egg.getEggDescriptor()})</div>`
          ).join(""));
          this.ui.findObject(".msgs").add(eggContainer).getDOM().scrollTop = 999999;

          this.ui.setTitle(i18next.t("menuUiHandler:EGG_GACHA")+" "+this.scene.gameData.eggs.length+" / 100");
    }

    hideSummary() {

    }

    updateGachaInfo(gachaType: GachaType): void {

    }

    consumeVouchers(voucherType: VoucherType, count: integer): void {
        this.scene.gameData.voucherCounts[voucherType] = Math.max(this.scene.gameData.voucherCounts[voucherType] - count, 0);
        this.updateVoucherCounts();
    }

    updateVoucherCounts(): void {
        const voucherCounts = this.scene.gameData.voucherCounts;

        [
            '1',
            '5',
            '10',
            '25'
        ].map((count,i) => {
            const dom = this.ui.findObject(`#ticket-${count}`);
            dom.setInnerHTML(`${count} ${i18next.t("egg:pulls")}*${voucherCounts[i]}`);
        })
        
    }

    showText(text: string, delay?: number, callback?: Function, callbackDelay?: number, prompt?: boolean, promptDelay?: number): void {
        if (!text) {
            text = this.defaultText;
        }

        const obj = this.ui.findObject(".msgs");
        obj.add(new HTMLContainer().setText(text));

        const dom = obj.getDOM();
        dom.scrollTop = dom.scrollHeight;
    }

    showError(text: string): void {
        this.showText(text, undefined, () => this.showText(this.defaultText), Utils.fixedInt(1500));
    }
    setTransitioning(transitioning: boolean): void {
    }

    processInput(button: Button): boolean {
        return true;
    }

    setCursor(cursor: integer): boolean {
        return true;
    }

    setGachaCursor(cursor: integer): boolean {
        return false;
    }

    clear(): void {
        this.ui.hide();
    }
}
