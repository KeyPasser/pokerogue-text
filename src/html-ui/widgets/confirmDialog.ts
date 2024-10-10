import i18next from "i18next";
import { HTMLContainer } from "../Root";

export class ConfirmDialog extends HTMLContainer{
    constructor(text:string, onYes:()=>void, onNo:()=>void){
        super();
        this.addClass('confirm-dialog').setInnerHTML(`
            <div class="content-container">
                <div>${text}</div>
                <div class="footer">
                    <div class="yes">${i18next.t("menu:yes")}</div>
                    <div class="no">${i18next.t("menu:no")}</div>
                </div>
              </div>
            `)

        this.findObject('.yes').on('click', ()=>{
            onYes();
            this.destroy();
        });
        this.findObject('.no').on('click', ()=>{
            onNo();
            this.destroy();
        });

        document.body.append(this.dom);
    }
    destroy(){
        this.dom.remove();
    }
}