import type TextBattleScene from "#app/text-battle-scene.js";
import HTMLContainer from "./Root";

function bbcodeToHtml(bbcode) {  
    // 替换[color]标签  
    bbcode = bbcode.replace(/\n/g,"").replace(/\[color=(.*?)\](.*?)\[\/color\]/g, '<span style="color:$1">$2</span>');  
    // 替换[shadow]标签  
    bbcode = bbcode.replace(/\[shadow=(.*?)\](.*?)\[\/shadow\]/g, '<span style="text-shadow: 2px 2px 2px $1">$2</span>');  
    // 替换换行符  
    bbcode = bbcode.replace(/\n/g, '<br/>');  
    return bbcode;  
}  
class TextPlugin{
    useText:boolean = localStorage.getItem('textmode') == "true"
    scene:TextBattleScene;

    constructor(scene:TextBattleScene){
        this.scene = scene
        this.container = (document.querySelector('#msg-container') as HTMLDivElement)
    }
    showHTML(html: string, className: string = "") {
        const div = document.createElement("div");
      div.innerHTML = html;
      div.classList.add(className);
      this.showOptionDom(div);
      
      this.showMsg("",true);
      return div;
    }
    setReuseMsgDom(reuse) {
        this.reuseLastMsg = reuse;
        return this
    }
    removeDom(selector: string) {
      this.hideOptionDom(this.container.querySelector(selector) as HTMLDivElement);
      return this;
    }

    updateDom(selector: string, props:{[key:string]:string | string[]}) {
        const dom = this.container.querySelector(selector);
        if(!dom) return this;

        for (const key in props) {
            if(key == 'classList'){
                const classList = props[key] as string[];
                dom.className="";
                dom.classList.add(...classList);
                continue;
            }
            dom[key] = props[key];
        }
        return this;
    }

    reuseLastMsg:boolean = false;
    count:number = 0;
    container:HTMLDivElement;

    createOptionDom(className = "option-select"){
        const dom = document.createElement("div");
        dom.style.display = "flex";
        dom.classList.add(className);

        return dom
    }
    showOptionDom(dom:HTMLElement|HTMLContainer){
        if(dom instanceof HTMLContainer){
            dom = dom.getDOM();
        }
        const container = this.container
        container.append(dom);

        container.scrollTop = container.scrollHeight;
    }
    hideOptionDom(dom:HTMLDivElement){
        dom?.remove();
    }
    showMsg(msg: string, forceNew = false){
        const container = this.container;

        if(this.reuseLastMsg&&!forceNew){
            const last = this.container.querySelector(".msg:last-of-type") as HTMLDivElement;
            if(!last) return this.showMsg(msg,true);
            last.textContent = msg+"\n";
        }else{
            const dom = document.createElement("div");
            dom.classList.add('msg')
            dom.textContent = msg+"\n";
            document.querySelector("#msg-container")?.append(dom);
    
            this.count++;
            const limit = 260
            if(this.count >= limit+1){
                this.count = limit;
                document.querySelector("#msg-container .msg")?.remove();
            }
        }

        container.scrollTop = container.scrollHeight;
    }
    showBBCodeMsg(msg: string, forceNew = false){
        const container = this.container;

            const dom = document.createElement("div");
            dom.classList.add('msg')
            dom.innerHTML = bbcodeToHtml(msg);
            document.querySelector("#msg-container")?.append(dom);

        container.scrollTop = container.scrollHeight;
    }
    showShadowText(msg,shadow){
        const dom = document.createElement("div");
            dom.classList.add('msg')
            dom.textContent = msg+"\n";
            dom.title = shadow;
            document.querySelector("#msg-container")?.append(dom);
    
            this.count++;
    }
}
export {TextPlugin,bbcodeToHtml};