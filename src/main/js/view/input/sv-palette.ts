import * as ColorConverter from '../../converter/color';
import {ClassName} from '../../misc/class-name';
import * as DisposingUtil from '../../misc/disposing-util';
import * as DomUtil from '../../misc/dom-util';
import {NumberUtil} from '../../misc/number-util';
import {PaneError} from '../../misc/pane-error';
import {Color} from '../../model/color';
import {InputValue} from '../../model/input-value';
import {View, ViewConfig} from '../view';

const className = ClassName('svp', 'input');

interface Config extends ViewConfig {
	value: InputValue<Color>;
}

/**
 * @hidden
 */
export class SvPaletteInputView extends View {
	public readonly value: InputValue<Color>;
	private canvasElem_: HTMLCanvasElement | null;
	private markerElem_: HTMLDivElement | null;

	constructor(document: Document, config: Config) {
		super(document, config);

		this.onValueChange_ = this.onValueChange_.bind(this);

		this.value = config.value;
		this.value.emitter.on('change', this.onValueChange_);

		this.element.classList.add(className());
		this.element.tabIndex = 0;

		const canvasElem = document.createElement('canvas');
		canvasElem.classList.add(className('c'));
		this.element.appendChild(canvasElem);
		this.canvasElem_ = canvasElem;

		const markerElem = document.createElement('div');
		markerElem.classList.add(className('m'));
		this.element.appendChild(markerElem);
		this.markerElem_ = markerElem;

		this.update();

		config.model.emitter.on('dispose', () => {
			this.canvasElem_ = DisposingUtil.disposeElement(this.canvasElem_);
			this.markerElem_ = DisposingUtil.disposeElement(this.markerElem_);
		});
	}

	get canvasElement(): HTMLCanvasElement {
		if (!this.canvasElem_) {
			throw PaneError.alreadyDisposed();
		}
		return this.canvasElem_;
	}

	public update(): void {
		if (!this.markerElem_) {
			throw PaneError.alreadyDisposed();
		}

		const ctx = DomUtil.getCanvasContext(this.canvasElement);
		if (!ctx) {
			return;
		}

		const c = this.value.rawValue;
		const hsvComps = c.getComponents('hsv');
		const width = this.canvasElement.width;
		const height = this.canvasElement.height;

		const cellCount = 64;
		const cw = Math.ceil(width / cellCount);
		const ch = Math.ceil(height / cellCount);
		for (let iy = 0; iy < cellCount; iy++) {
			for (let ix = 0; ix < cellCount; ix++) {
				const s = NumberUtil.map(ix, 0, cellCount - 1, 0, 100);
				const v = NumberUtil.map(iy, 0, cellCount - 1, 100, 0);
				ctx.fillStyle = ColorConverter.toFunctionalRgbString(
					new Color([hsvComps[0], s, v], 'hsv'),
				);

				const x = Math.floor(
					NumberUtil.map(ix, 0, cellCount - 1, 0, width - cw),
				);
				const y = Math.floor(
					NumberUtil.map(iy, 0, cellCount - 1, 0, height - ch),
				);
				ctx.fillRect(x, y, cw, ch);
			}
		}

		const left = NumberUtil.map(hsvComps[1], 0, 100, 0, 100);
		this.markerElem_.style.left = `${left}%`;
		const top = NumberUtil.map(hsvComps[2], 0, 100, 100, 0);
		this.markerElem_.style.top = `${top}%`;
	}

	private onValueChange_(): void {
		this.update();
	}
}
