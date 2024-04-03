import {useCallback, useEffect, useState} from 'react'
import './App.css'

import {Palette as PaletteObj, ColorScheme} from "color-mapper";
import {Palette} from "./palette";
import Color from "colorjs.io";
import set = Color.set;
import {DownloadIcon} from "@radix-ui/react-icons";
import {last} from "colorjs.io/types/src/util";


function App() {
    const [paletteFileHandle, setPaletteFileHandle] = useState<FileSystemHandle | null>(null);
    const [colorSchemeFileHandle, setColorSchemeFileHandle] = useState<FileSystemHandle | null>(null);

    const [palette, setPalette] = useState<PaletteObj>();
    const [colorScheme, setColorScheme] = useState<ColorScheme>();
    const [adjustedColorScheme, setAdjustedColorScheme] = useState<ColorScheme>();

    const handlePickPaletteFile = useCallback(async (e) => {
        const fileHandle = await window.showOpenFilePicker({
            types: [{description: "Color palette"}],
            multiple: false,
        });
        const fileData = await fileHandle[0].getFile();

        setPaletteFileHandle(fileHandle[0]);

        if (fileData) {
            const content = await fileData.text();
            console.log('palette \n', content);
            setPalette(PaletteObj.fromFileContents(content));
        }
    }, []);

    const handlePickSchemeFile = useCallback(async (e) => {
        const fileHandle = await window.showOpenFilePicker({
            types: [{description: 'Color scheme'}],
            multiple: false,
        });
        const fileData = await fileHandle[0].getFile();

        setColorSchemeFileHandle(fileHandle[0]);

        if (fileData) {
            const content = await fileData.text();
            // console.log('color scheme\n', content);
            const colorScheme = new ColorScheme(content)

            console.log('scheme palette')
            console.log('total unique colors', colorScheme.uniqueColors.length);
            // console.log('cols', 10);
            // console.log('rows', Math.ceil(colorScheme.uniqueColors.length / 10));

            console.log(Array.from(
                new Array(Math.ceil(colorScheme.uniqueColors.length / 10)),
                (_, rowIndex) => Array.from(
                    new Array(10),
                    (_, colIndex) => colorScheme.uniqueColors[colIndex + rowIndex * 10]?.to('srgb').toString({format: 'hex'})
                ).join(' ')
            ).join('\n'));
            setColorScheme(colorScheme);
        }
    }, []);

    useEffect(() => {
        if (!(palette && colorScheme)) {
            // need both to proceed
            return;
        }

        setAdjustedColorScheme(colorScheme.toAdjusted(palette));
    }, [palette, colorScheme]);

    const handleSaveAdjustedScheme = useCallback(async () => {
        const lastdot = colorSchemeFileHandle.name.lastIndexOf('.');
        const basename = colorSchemeFileHandle.name.substring(0, lastdot);
        const ext = colorSchemeFileHandle.name.substring(lastdot);

        const adjustedSchemeHandle = await window.showSaveFilePicker({
            suggestedName: basename + '.out' + ext,
            types: [{ description: 'Original extension', accept: {'text/plain': [ext as `.${string}`]}}],
            startIn: colorSchemeFileHandle
        });

        const writableFile = await adjustedSchemeHandle.createWritable({keepExistingData: false});
        await writableFile.write(adjustedColorScheme.export());
        await writableFile.close();
    }, [colorSchemeFileHandle, adjustedColorScheme]);

    return (
        <>
            <div style={{marginBlockEnd: '2rem', marginLeft: '1rem'}}><h1 style={{
                transform: ' scaleY(1) skewX(340deg) translate(0rem, 0.4rem)',
                margin: 0,
                lineHeight: 1,
                opacity: 0.15
            }}>
                Colo
                <span style={{
                    transform: 'scaleY(-1)',
                    fontSize: '2.5rem',
                    verticalAlign: 'middle',
                    display: 'inline-block'
                }}>L</span>{' '}
                M
                <span style={{transform: 'scaleY(-1) translateY(-1rem)', display: 'inline-block'}}>a</span>
                pp
                <span style={{transform: 'scaleY(-1) translateY(-1rem)', display: 'inline-block'}}>e</span>
                <span style={{
                    transform: 'scaleY(-1)',
                    fontSize: '2.5rem',
                    verticalAlign: 'middle',
                    display: 'inline-block'
                }}>L</span>
            </h1>
                <h1 style={{transform: 'scaleY(-1) skewX(20deg) translate(-1.2rem, -1rem)', margin: 0, lineHeight: 1}}>
                    Colo
                    <span style={{
                        transform: 'scaleY(-1)',
                        fontSize: '2.5rem',
                        verticalAlign: 'middle',
                        display: 'inline-block'
                    }}>L</span>{' '}
                    M
                    <span style={{transform: 'scaleY(-1) translateY(-1rem)', display: 'inline-block'}}>a</span>
                    pp
                    <span style={{transform: 'scaleY(-1) translateY(-1rem)', display: 'inline-block'}}>e</span>
                    <span style={{
                        transform: 'scaleY(-1)',
                        fontSize: '2.5rem',
                        verticalAlign: 'middle',
                        display: 'inline-block'
                    }}>L</span>
                </h1></div>
            <div style={{
                display: 'grid',
                gridTemplateColumns: "repeat(3, 1fr)",
                gridTemplateRows: "auto 1fr auto",
                gap: '2rem'
            }}>

                <div>
                    <button onClick={handlePickSchemeFile}>Pick a color map file</button>
                </div>
                <div>
                    <button onClick={handlePickPaletteFile}>Pick palette a file</button>
                </div>
                <div>
                    <button onClick={handleSaveAdjustedScheme}>Save adjusted color scheme <DownloadIcon/></button>
                </div>
                <div className="card">
                    <Palette
                        columns={colorScheme ? palette?.colors[0].length + 5 : 0}
                        colors={colorScheme ?
                            Object.entries(colorScheme.uniqueColors.reduce((hueBands, c) => {
                                const hueBand = Math.floor(c.get('h') / Math.floor(360 / 8));
                                if (hueBand in hueBands) {
                                    hueBands[hueBand].push(c);
                                } else {
                                    hueBands[hueBand] = [c];
                                }
                                return hueBands;
                            }, {} as Record<number, Color[]>))
                                .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                                .map(([_, colors]) => [_, colors.sort((a, b) => {
                                    const dc = b.get('c') - a.get('c');
                                    if (Math.abs(dc) < 0.035) { // chroma banding
                                        return b.get('l') - a.get('l')
                                    } else {
                                        return dc;
                                    }
                                })] as const)
                                .map(([_, colors]) => {
                                    while (colors.length % (palette?.colors[0].length + 5)) {
                                        colors.push(null);
                                    }
                                    return colors;
                                })
                                .flat() : []
                        }/>
                </div>
                <div className="card">
                    <Palette
                        columns={palette?.colors[0].length || 3}
                        colors={palette?.colors.flat() || [new Color('#ff0000'), new Color('#00ff00'), new Color('#0000ff')]}/>
                </div>
                <div className="card">
                    <Palette
                        columns={palette?.colors[0].length || 3}
                        colors={palette?.colors.flat().map(c => adjustedColorScheme?.uniqueColors.find((v) => {
                            return (
                                c.to('srgb').toString({format: 'hex'})
                                ===
                                v.to('srgb').toString({format: 'hex'})
                            );
                        }) ? c : null)}/>
                </div>

                <div style={{opacity: 0.5}}>{colorSchemeFileHandle ? colorSchemeFileHandle?.name :
                    <a href="assets/Dark.icls" download>Example color scheme</a>}</div>
                <div style={{opacity: 0.5}}>{paletteFileHandle ? paletteFileHandle?.name :
                    <a href="assets/palette.clr" download>Example palette</a>}</div>
                <div/>
            </div>

        </>
    );
}

export default App
