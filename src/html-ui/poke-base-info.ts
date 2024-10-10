import Pokemon from "#app/field/pokemon.js";
import HTMLContainer from "./Root";

class PokeBaseInfo extends HTMLContainer{
    poke:Pokemon;
    constructor(poke){
        super();
        this.setInnerHTML(``)
    }
}