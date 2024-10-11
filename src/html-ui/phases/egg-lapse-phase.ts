import { Egg } from "#app/data/egg.js";
import overrides from "#app/overrides.js";
import type BattleScene from '#app/battle-scene.js';
import { HEggHatchPhase } from "./egg-hatch-phase";


const extendLapsePhase = <T extends new (...args: any[]) => any>(Clz:T)=>{
    
    class HEggLapsePhase extends Clz{
        constructor(...args: any[]) {
            super(args[0],1);
        }
        start() {
            console.log(`%cStart Phase ${this.constructor.name}`, "color:green;");

            const eggsToHatch: Egg[] = this.scene.gameData.eggs.filter((egg: Egg) => {
                return overrides.EGG_IMMEDIATE_HATCH_OVERRIDE ? true : --egg.hatchWaves < 1;
            });
            const eggsToHatchCount: number = eggsToHatch.length;
    
            if (eggsToHatchCount > 0) {
                this.scene.textPlugin.showOptionDom(document.createElement("br"));
                this.regularlyHatch(eggsToHatch);
            }else{
                this.end();
            }
        }
        async regularlyHatch(eggsToHatch: Egg[]) {
            let eggsToHatchCount: number = eggsToHatch.length;

            for (const egg of eggsToHatch) {
                const phase = new HEggHatchPhase(this.scene, this as any, egg, eggsToHatchCount);
                eggsToHatchCount--;
                await phase.start();
            }
            this.end();
        }

    }
    return HEggLapsePhase;
}

export default extendLapsePhase;