declare module "*.hs" {  
    const template: (data: Object) => string;  
    export default template;  
  }  