import Color from "colorjs.io";
import type {Palette} from "./palette.js";

type ColorEntryMatch = {
    startPos: number;
    endPos: number;
    color: Color;
    adjusted?: Color;
}

export class ColorScheme {

    private readonly matches: ColorEntryMatch[];
    public readonly uniqueColors: Color[];

    constructor(private readonly inputFileData: string, private readonly regexp: RegExp = /(value=")([\dA-Fa-f]{6})(")/g, private readonly matchToReadableColor: (match: string) => string = c => `#${c}`, adjustment?: (c: Color) => Color) {
        const uniqueColorValues = new Set<string>();
        this.matches = Array.from(inputFileData.matchAll(regexp)).map((regexpMatch) => {
            const fullMatch = regexpMatch[0],
                prefix = regexpMatch[1],
                colorValue = regexpMatch[2],
                suffix = regexpMatch[3];
            if (!(fullMatch && prefix && colorValue && suffix)) {
                throw new Error(`Missing matching groups in match [${regexpMatch}] for regex [${regexp}]`);
            }

            const startPos = regexpMatch.index + prefix.length;
            const endPos = startPos + colorValue.length;

            const readableColorValue = matchToReadableColor(colorValue);

            if (adjustment) {
                const origColor = new Color(readableColorValue);
                const adjustedColor = adjustment(origColor);

                uniqueColorValues.add(adjustedColor.toString({format: 'hex'}));
                return {
                    startPos,
                    endPos,
                    color: origColor,
                    adjusted: adjustedColor
                };
            } else {
                uniqueColorValues.add(readableColorValue);
                const color = new Color(matchToReadableColor(colorValue));
                return {
                    startPos,
                    endPos,
                    color,
                    adjusted: color.clone(),
                };
            }
        });

        this.uniqueColors = Array.from(uniqueColorValues).map(cv => new Color(cv).to('oklch')).sort((a,b) => b.get('l') - a.get('l'));
    }

    public toAdjusted(palette: Palette) {
        const paletteColors = palette.colors.flat();
        return new ColorScheme(
            this.inputFileData,
            this.regexp,
            this.matchToReadableColor,
            (originalColor) => findClosestPaletteColor(originalColor, paletteColors)
        );

        function findClosestPaletteColor(pivot: Color, paletteColors: Color[]) {
            let result = pivot;
            let minDistance = Number.MAX_VALUE;

            for (const c of paletteColors) {
                const d = pivot.distance(c);
                if (d < minDistance) {
                    result = c;
                    minDistance = d;
                }
            }

            console.log(`${pivot.toString({format: 'hex'})} => ${result.to('srgb').toString({format: 'hex'})}`);

            return result;
        }
    }

    public export(): string {
        const firstMatch = this.matches[0];
        if (!firstMatch) {
            return this.inputFileData;
        }

        let out = this.inputFileData.substring(0, firstMatch.startPos);

        for (let i = 1; i < this.matches.length; i++) {
            // @ts-ignore
            out += this.matches[i - 1].adjusted.to('srgb').toString({format: 'hex'}).substring(1);
            // @ts-ignore
            out += this.inputFileData.substring(this.matches[i - 1].endPos, this.matches[i].startPos);
        }

        // @ts-ignore
        out += this.matches[this.matches.length - 1].adjusted.to('srgb').toString({format: 'hex'}).substring(1);
        // @ts-ignore
        out += this.inputFileData.substring(this.matches[this.matches.length - 1].endPos);

        return out;
    }

    private clone() {
        return new ColorScheme(this.inputFileData);
    }
}


const example = new ColorScheme('', /(value=")([\dA-Fa-f]{6})(")/g);
