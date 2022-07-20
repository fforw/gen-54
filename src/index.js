
import domready from "domready"
import "./style.css"
import { randomPaletteWithBlack } from "./randomPalette"
import Color from "./Color"

const PHI = (1 + Math.sqrt(5)) / 2;
const TAU = Math.PI * 2;
const DEG2RAD_FACTOR = TAU / 360;

const config = {
    width: 0,
    height: 0,
    palette: ["#fff", "#000"]
};

/**
 * @type CanvasRenderingContext2D
 */
let ctx;
let canvas;

/**
 * @type CanvasRenderingContext2D
 */
let tmpCtx;
let tmpCanvas;

const overdraw = 1.2


function randomPoints(count = 50 )
{
    const { width, height } = config

    const out = []
    for (let i = 0; i < count; i++)
    {
        out.push([
            0|Math.random() * width * overdraw,
            0|Math.random() * height * overdraw,
        ])

    }
    return out
}


function round(pts)
{
    for (let i = 0; i < pts.length; i++)
    {
        pts[i][0] = Math.round(pts[i][0])
        pts[i][1] = Math.round(pts[i][1])
    }

    return pts
}


/**
 * Returns true if the given cutout intersects any of the circles
 * @param circles
 * @param cutout
 * @return {boolean}
 */
function intersects(circles, cutout)
{
    return circles.some( (c,idx) => {

        const [x0,y0, r0] = c
        const [x1,y1, r1] = cutout

        const dx = x1 - x0
        const dy = y1 - y0

        const dist = Math.sqrt(dx * dx + dy * dy)

        // we want to avoid close intersections, too, so we make our radiuses a little smaller
        let intersects = dist < (r0 + r1) * 0.85
        if (intersects)
        {
            console.log("Cutout intersects circle #", idx )
        }
        return intersects
    })
}


function randomColor(alpha)
{
    const { palette } = config
    return Color.from(palette[0 | Math.random() * palette.length]).toRGBA(alpha)
}


function addStops(gradient, alpha)
{
    if (Math.random() < 0.5)
    {
        gradient.addColorStop(0, randomColor(alpha) )
        gradient.addColorStop(0.5, randomColor(alpha) )
        gradient.addColorStop(1, randomColor(alpha) )
    }
    else
    {
        gradient.addColorStop(0, randomColor(alpha) )
        gradient.addColorStop(1, randomColor(alpha) )
    }
}


function createGradient(x, y, r, alpha)
{

    if (Math.random() < 0.5)
    {
        let gradient = ctx.createRadialGradient(x,y,0, x,y,r)
        addStops(gradient, alpha)
        return gradient
    }

    const angle = TAU * Math.random()

    let gradient = ctx.createLinearGradient(
        x + Math.cos(angle) * r,
        y + Math.sin(angle) * r,
        x - Math.cos(angle) * r,
        y - Math.sin(angle) * r
    )
    addStops(gradient, alpha)
    return gradient
}


class Group
{
    /**
     * @type CanvasRenderingContext2D
     */
    ctx =  null;
    canvas = null;

    circles = []
    cutouts = []

    exp = 4 + Math.random() * 6

    overshoot = Math.round(-20 + Math.random() * 40)

    constructor()
    {
        const { width, height, palette } = config

        let canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        this.canvas = canvas
        this.ctx = canvas.getContext("2d")

        const circleCount = 3 + Math.random() * 6
        const exp = 2 + Math.random() * 2

        const size = Math.max(width, height) * 0.25

        for (let i = 0; i < circleCount; i++)
        {
            this.circles.push(
                [
                    0 | Math.random() * width * overdraw,
                    0 | Math.random() * height * overdraw,
                    Math.round(100 + Math.pow(Math.random(), exp) * size),
                    Color.from(palette[0 | Math.random() * palette.length]).toRGBHex(),
                    Math.random() < 0.5
                ]
            )
        }

        const cutoutCount = 1 + Math.random() * 1

        for (let i = 0; i < cutoutCount; i++)
        {
            let cutout

            let count = 0
            do
            {
                console.log("Attempt #", ++count)
                
                cutout = [
                    0 | Math.random() * width * overdraw,
                    0 | Math.random() * height * overdraw,
                    Math.round(200 + Math.random() * (size * 0.8 - 200))
                ]
            } while (!intersects(this.circles, cutout))

            this.cutouts.push(
                cutout
            )
        }
    }

    draw(alpha)
    {
        const { circles, cutouts, ctx, exp, overshoot } = this
        for (let i = 0; i < circles.length; i++)
        {
            const [x,y,r,color,full] = circles[i]

            // if (full)
            // {
                ctx.fillStyle = createGradient(x,y,r, alpha)
                ctx.beginPath()
                ctx.moveTo(x + r, y)
                ctx.arc(x,y,r,0,TAU, true)
                ctx.fill()
            // }
            // else
            // {
            //     ctx.strokeStyle = color
            //     const lw = Math.round(r * 0.3333)
            //     const lwh = Math.round(r * 0.5)
            //     ctx.lineWidth = lw
            //     ctx.beginPath()
            //     ctx.moveTo(x + r - lwh, y)
            //     ctx.arc(x,y,r - lwh,0,TAU, true)
            //     ctx.stroke()
            // }
        }

        const { width, height, palette } = config

        ctx.save()

        ctx.beginPath()
        for (let i = 0; i < circles.length; i++)
        {
            const [x,y,r,color,full] = circles[i]

            const r0 = r + overshoot
            ctx.moveTo(x + r0, y)
            ctx.arc(x,y,r0,0,TAU, true)
        }
        ctx.clip()

        const stripeCount = 2000
        const horizontal = Math.random() < 0.5
        for (let i = 0; i < stripeCount; i++)
        {

            const x = 0 | Math.random() * width * overdraw
            const y = 0 | Math.random() * height * overdraw

            const h = Math.round(1 + Math.random() * 1)

            ctx.fillStyle = Color.from(palette[0|Math.random() * palette.length]).toRGBA(0.1 + Math.pow(Math.random(), exp) * 0.9)
            if (horizontal)
            {
                ctx.fillRect(x, y, 100 + Math.random() * 300, h)
            }
            else
            {
                ctx.fillRect(x, y, h, 100 + Math.random() * 300)
            }
        }
        ctx.restore()

        ctx.save()
        ctx.globalCompositeOperation = "destination-out"
        ctx.fillStyle = "#fff"
        for (let i = 0; i < cutouts.length; i++)
        {
            const [x,y,r] = cutouts[i]

            ctx.beginPath()
            ctx.moveTo(x + r, y)
            ctx.arc(x,y,r,0,TAU, true)
            ctx.fill()
        }
        ctx.restore()


    }
}



domready(
    () => {

        canvas = document.getElementById("screen");
        tmpCanvas = document.createElement("canvas");
        ctx = canvas.getContext("2d");
        tmpCtx = tmpCanvas.getContext("2d");

        const width = (window.innerWidth) | 0;
        const height = (window.innerHeight) | 0;

        config.width = width;
        config.height = height;

        canvas.width = width;
        canvas.height = height;

        tmpCanvas.width = width;
        tmpCanvas.height = height;

        const paint = () => {

            config.palette = randomPaletteWithBlack()

            ctx.fillStyle = config.palette[0];
            ctx.fillRect(0,0, width, height);



            const input = [
                ... randomPoints(10)

            ]

            const layers = [0.1 + Math.random() * 0.05, 0.3 + Math.random() * 0.3, 1 - Math.random() * 0.2]
            for (let i = 0; i < layers.length; i++)
            {
                const alpha = layers[i]
                const g = new Group()
                g.draw(alpha)
                ctx.drawImage(g.canvas, 0, 0)

                for (let j = 0; j < g.circles.length; j++)
                {
                    const [x,y] = g.circles[j]
                    input.push([x,y])
                }

                for (let j = 0; j < g.cutouts.length; j++)
                {
                    const [x,y] = g.cutouts[j]
                    input.push([x,y])
                }
            }
            
        }

        paint()

        canvas.addEventListener("click", paint, true)
    }
);
