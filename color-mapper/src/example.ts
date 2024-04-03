import * as fs from 'node:fs/promises';
import * as path from "node:path";
import Color from "colorjs.io";

await main(process.argv);

async function main(args: string[]) {
    const palettePath = args[2];
    const dataPath = args[3];

    if (!palettePath) {
        console.log('Palette file not defined. Exiting!');
        process.exit(1);
    }
    if (!dataPath) {
        console.log('Data file not defined. Exiting!');
        process.exit(1);
    }

    const paletteHex = await fs.readFile(palettePath, 'utf8').then(paletteColors => paletteColors.split('\n'))
    const data = await fs.readFile(dataPath, 'utf8');

    const paletteColors = paletteHex.filter(line => !!line).map(hex => new Color(hex));
    paletteColors.forEach(c => console.log(c.toString(), c.to('hex')));

    const positionsToReplace = data.replaceAll(/(value=")([\dA-Fa-f]{6})(")/g, (match, prefix, color, suffix) => {
        // console.log([match, prefix, color, suffix, offset, str].join('|'));

        const closestPaletteColor = findClosestPaletteColor(new Color(color), paletteColors);
        return `${prefix}${closestPaletteColor.to('hex')}${suffix}`;
    });

    if (args[4]) {
        const outPath = args[4];
        await fs.writeFile(outPath, positionsToReplace);
    } else {
        const ext = path.extname(dataPath);
        const baseName = path.basename(dataPath, ext);
        const outName = baseName + '.out' + ext;
        const dir = path.dirname(dataPath)
        const resolved = path.resolve(dir, outName);

        // console.table({
        //     ext, baseName, outName, resolved,
        // });

        await fs.writeFile(resolved, positionsToReplace);
    }

}

function findClosestPaletteColor(pivot: Color, paletteColors: Color[]) {
    let result = pivot;
    let minDistance = Number.MAX_VALUE;

    for(const c of paletteColors) {
        const d = pivot.distance(c);
        if(d < minDistance) {
            result = c;
            minDistance = d;
        }
    }

    return result;
}
