/**
 * Handler for rendering game things onto a canvas element.
 */
export class CanvasManager {

	public spriteCanvas: HTMLCanvasElement;
	public boardCanvas: HTMLCanvasElement;
	public spriteCtx: CanvasRenderingContext2D;
	public boardCtx: CanvasRenderingContext2D;

	public spritesheet: HTMLImageElement;
	public boardImage: HTMLImageElement;

	constructor(
		spriteCanvas: HTMLCanvasElement, 
		boardCanvas: HTMLCanvasElement,
		onSpritesheetLoaded?: () => void
	) {
		this.spriteCanvas = spriteCanvas;
		this.boardCanvas = boardCanvas;
		const _spriteCtx = spriteCanvas.getContext("2d");
		const _boardCtx = boardCanvas.getContext("2d");

		this.spritesheet = new Image();
		this.boardImage = new Image();

		if (!_spriteCtx || !_boardCtx) {
			// TODO - is there a way to handle this?
			throw new Error("Couldn't load canvas2d context!");
		}

		this.updateCanvasSize();

		this.spriteCtx = _spriteCtx;
		this.boardCtx = _boardCtx;
		this.preloadAssets(onSpritesheetLoaded);
	}
}