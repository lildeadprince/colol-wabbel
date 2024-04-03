import {type FC, useMemo} from "react";
import Color from "colorjs.io";

type Props = {
    columns: number;
    colors: Color[];
}

const size = 3;
export const Palette: FC<Props> = (props) => {
    if (!props.colors) {
        return null;
    }
    const oklchColors = useMemo(() => props.colors.map(c => c?.to('oklch')), [props.colors]);

    return (
        <div className='palette' style={{'--palette-columns': props.columns}}>
            {
                oklchColors.map((c => {
                            if (!c) {
                                return <div className='palette-color-box'
                                     style={{'--color-box-bg': 'transparent', '--shadow-color': 'transparent'}}>
                                    <div className='palette-color-hover-box'></div>
                                </div>
                            }
                            const lum = c.get('l');

                            // can do it with sign() or abs(), but can't be bothered
                            const chiaroscuro = (lum > 0.6 ? 0.6 : 1) - lum / 2;

                            const colorBoxBg = c.to('srgb').toString({format: 'hex'});
                            const shadowColor = c.clone().set('l', chiaroscuro).to('srgb').toString({format: 'hex'});

                            return (
                                <div className='palette-color-box'
                                     style={{'--color-box-bg': colorBoxBg, '--shadow-color': shadowColor}}>
                                    <div className='palette-color-hover-box'></div>
                                </div>
                            );
                        }
                    )
                )
            }
        </div>
    );
}
