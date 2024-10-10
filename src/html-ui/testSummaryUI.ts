import { HTMLContainer } from "./Root";

export default class HSummary extends HTMLContainer{
    constructor(){
        super(document.createElement('div'))
    }
    setup(){
        `
         <div id="base">
            <div id="candy">
                <span>candy:</span>
                <span>X</span>
                <span>7</span>
            </div>
            <div id="name"></div>
            <div id="ball"></div>
            <div id="level"></div>
            <div id="gender"></div>
            <div id="shiny">S</div>
            <div id="spliced">X</div>
            <div id="fusion-shiny">FS</div>
        </div>
        <div id="poke-summary-tab">
            <div id="status-tab">Status</div>
            <div id="stats-tab">Stats</div>
            <div id="move-tab">Moves</div>
        <div>
        <div>
            <div id="status">
               <div id="profile">
                     <div id="trainer">
                        <span>trainer</span>
                        <span>/</span>
                        <span>Guest</span>
                     </div>
                     <div id="id">
                        <span>ID No.</span>
                        <span>29670</span>
                     </div>
                     <div id="poke-type">
                        <span>type</span>
                        <span>/</span>
                        <span>水</span>
                     </div>
               </div>
               <div id="ability">
                    <div id="title"></div>
                    <div id="ability-title"></div>
                    <div id="ability-desc"></div>
               </div>
               <div id="memo">
                    <div id="nature">
                    </div>
                    <div id="met"></div>
                    <div id="biome"></div>
               </div>
            </div>
            <div id="stats">
                <div id="items">
                </div>
                <div id="ivs">
                </div>
                <div id="exp">
                    <div id="cur-exp"></div>
                    <div id="next-level"></div>
                </div>
            </div>
            <div id="move">
                <div id="move0">
                    <div class="name"></div>
                    <div id="description"></div>
                    <div id="details">
                        <div id="power">
                            <span>威力</span>
                            <span>100</span>
                        </div>
                        <div id="accuracy">
                            <span>命中</span>
                            <span>100</span>
                        </div>
                        <div id="类别">
                            <span>威力</span>
                        </div>
                     </div>
                </div>
                <div id="move1">
                    <div class="name"></div>
                    <div id="description"></div>
                    <div id="details">
                        <div id="power">
                            <span>威力</span>
                            <span>100</span>
                        </div>
                        <div id="accuracy">
                            <span>命中</span>
                            <span>100</span>
                        </div>
                        <div id="类别">
                            <span>威力</span>
                        </div>
                     </div>
                </div>
                <div id="move2">
                    <div class="name"></div>
                    <div id="description"></div>
                    <div id="details">
                        <div id="power">
                            <span>威力</span>
                            <span>100</span>
                        </div>
                        <div id="accuracy">
                            <span>命中</span>
                            <span>100</span>
                        </div>
                        <div id="类别">
                            <span>威力</span>
                        </div>
                     </div>
                </div>
                <div id="move3">
                    <div class="name"></div>
                    <div id="description"></div>
                    <div id="details">
                        <div id="power">
                            <span>威力</span>
                            <span>100</span>
                        </div>
                        <div id="accuracy">
                            <span>命中</span>
                            <span>100</span>
                        </div>
                        <div id="类别">
                            <span>威力</span>
                        </div>
                     </div>
                </div>
            </div>
        </div>
        `
    }
    show(){

    }
}