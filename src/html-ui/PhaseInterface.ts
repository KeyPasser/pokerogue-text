import { HTMLContainer } from "./Root"

export const addHTMLSprit = (options) => {
    return new (class extends HTMLContainer {
      public texture: any = {
        key: "",
        frameTotal: 0
      }
      public frame: any = {
        texture: {
          key: "",
          frameTotal: 0,
          has:()=>true
        }
      }
      public anims:{
        pause:()=>void
        stop:()=>void,
        get:()=>Object
      } = {
        pause:()=>{},
        stop:()=>{},
        get:()=>({})
      }
      constructor() {
        super();
        this.texture.has= ()=>true;
      }
      play() { 
        return {
          stop:()=>{}
        }
      }
      setPipeline() { }
      setScale() { }
      stop() {
        return this;
      }
      setFrame() { }
      setMask() { }
      setTintFill() { }
      clearTint() { }
      setPipelineData() { }
    })()
  }