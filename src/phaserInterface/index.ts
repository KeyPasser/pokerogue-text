import { HTMLContainer } from "#app/html-ui/Root.js"
import RandomDataGenerator from "./RandomDataGenerator";
import { fnMap } from "./EaseFn";

const Types = {
    Core: {
        GameConfig: {} as any,
        PipelineConfig: {} as any,
    },
}

export const Math = {
    RandomDataGenerator: RandomDataGenerator,
    Clamp: (value: number, min: number, max: number) => {
        return Math.min(Math.max(value, min), max);
    },
    min: (a: number, b: number) => {
        return a < b ? a : b;
    },
    max: (a: number, b: number) => {
        return a > b ? a : b;
    },
    Linear : function (p0, p1, t)
    {
        return (p1 - p0) * t + p0;
    }
};

const Phaser = {
    VERSION: '300.550.2',
    Types,
    WEBGL: 1,
    Scale: {
        Fit: 1,
    },
    Core: {
        Events: {
            BLUR: 0,
        }
    },
    Math: Math,
    Scene: HTMLContainer,
    GameObjects: {
        DisplayList: Array,
        Container: HTMLContainer,
        GameObject: HTMLContainer,
        Sprite: HTMLContainer,
        Image: HTMLContainer,
        NineSlice: HTMLContainer,
        Text: HTMLContainer,
        Rectangle: HTMLContainer,
        Line: HTMLContainer,
        Shape: HTMLContainer,
        Components:{}
    },
    Utils: {
        Objects: {
            GetValue: (object, key, defaultValue) => {
                return object?object[key]||defaultValue : defaultValue;
            },
            GetAdvancedValue: (object, key, defaultValue) => {
                return object?object[key]||defaultValue : defaultValue;
            },
            IsPlainObject: () => false,
        },
        String:{
            Pad:(str:string)=>str
        }
    },
    Tweens: {
        Builders: {
            GetEaseFunction: (name) => fnMap[name],
        },
        add: ({ onComplete }) => {
            onComplete?.()
        },
        addCounter: ({
            onUpdate,
            onRepeat,
            repeat,
            repeatDelay,
            onComplete
        }) => {
            let count = 0;
            const interval = repeat && setInterval(() => {
                onUpdate?.({
                    getValue: () => count
                })
                onRepeat?.()
                count++;
                if (count == repeat) {
                    clearInterval(interval)
                    onComplete?.()
                }
            }, repeatDelay)


            return {
                remove: () => {
                    clearInterval(interval)
                },
                stop: () => {
                    clearInterval(interval)
                }
            }
        },
        getTweensOf: () => {
            return []
        },
        TweenChain:Object,
    },
    Sound: {
        BaseSound: HTMLContainer,
    },
    Input: {
        Keyboard: {
            KeyCodes: {

            }
        }
    },
    Renderer: {
        WebGL: {
            Pipelines: {
                MultiPipeline: HTMLContainer,
                PostFXPipeline: HTMLContainer,
            }
        },
        Canvas:{
            SetTransform:()=>false
        }
    },
    Loader: {
        LoaderPlugin: HTMLContainer,
        Events:{
            COMPLETE:0
        }
    },
    Plugins: {
        PluginCache: {
            register: () => { }
        },
    },
    Geom: {
        Rectangle: HTMLContainer,
        Polygon:{
            Earcut:()=>[]
        },
        Contains: 1
    },
    Time:{
        TimerEvent:Object
    },
    Display:{
        Color:{
            IntegerToColor:(c:number= 0xcccccc)=>{return '#'+c.toString(16)}
        },
        Canvas:{
            CanvasPool:{
                create:()=>{
                    return document.createElement('canvas')
                },
                remove:()=>{

                }
            }
        }
    },
    Class:{
        mixin:()=>{return class{}}
    },
    DOM:{
        AddToDOM:()=>{}
    }
}
// @ts-ignore
window.Phaser = Phaser;
export default Phaser;