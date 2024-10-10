export const fnMap = {
    "Sine.easeIn" : function (v)
    {
        if (v === 0)
        {
            return 0;
        }
        else if (v === 1)
        {
            return 1;
        }
        else
        {
            return 1 - Math.cos(v * Math.PI / 2);
        }
    },
    "Sine.easeOut":function (v)
    {
        if (v === 0)
        {
            return 0;
        }
        else if (v === 1)
        {
            return 1;
        }
        else
        {
            return Math.sin(v * Math.PI / 2);
        }
    },
    "Cubic.easeIn":function (v)
    {
        return v * v * v;
    }
}