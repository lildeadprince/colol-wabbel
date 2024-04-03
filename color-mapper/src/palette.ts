import Color from "colorjs.io";

export class Palette {
    colors: Color[][];

    constructor(hex: string[][]) {
        this.colors = hex.map(hexRow => hexRow.map(h => new Color(h).to('oklch')));
    }

    static fromFileContents(paletteFileContents: string) {
        return new Palette(
            paletteFileContents.trim().split('\n')
                .filter(l => l)
                .map(line => line.trim().split(/\s/)
                    .map(h => h.trim())
                )
        );
    }


}
