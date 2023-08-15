window.addEventListener("DOMContentLoaded",() => {
	const fw = new FlyingWindows("canvas");
});

class FlyingWindows {
	constructor(qs,speed = 0.02,windows = 25) {
		this.C = document.querySelector(qs);
		this.c = this.C.getContext("2d");
		this.S = window.devicePixelRatio;
		this.W = 800;
		this.H = 600;
		this.FPS = 60;
		this.tick = 0;
		this.launchSpeed = 0;
		this.speed = speed;
		this.maxWindows = windows;
		this.windows = [];
		this.spriteSheet = "";
		this.debug = false;

		this.init();
	}
	draw() {
		const { c, S, W, H, FPS, launchSpeed, windows, spriteSheet, debug } = this;

		// clear everything
		c.fillStyle = "#000";
		c.fillRect(0,0,W,H);

		// draw the windows
		windows.forEach(win => {
			const { sx, sy, sw, sh, x, y, w, h } = win;
			const xAdjust = x - w / 2;
			const yAdjust = y - h / 2;

			c.drawImage(spriteSheet,sx,sy,sw * S,sh * S,xAdjust,yAdjust,w,h);
		});

		// debug info
		if (debug === true) {
			const textX = 24;

			c.fillStyle = "#fff";
			c.fillText(`${FPS} FPS`,textX,24);
			c.fillText(`Pixel Ratio: ${S}`,textX,48);
			c.fillText(`Speed: ${launchSpeed}`,textX,72);
			c.fillText(`Windows: ${windows.length}`,textX,96);
		}
	}
	easeIn(x) {
		return x ** 2;
	}
	formatCanvas() {
		if (this.S > 3)
			this.S = 3;

		const { C, c, W, H, S } = this;

		// properly scale the canvas based on the pixel ratio
		C.width = W * S;
		C.height = H * S;
		C.style.width = "auto";
		C.style.height = "100%";
		c.scale(S,S);
		c.font = "16px sans-serif";
	}
	init() {
		this.formatCanvas();
		this.loadSpritesheet().then(loaded => {
			this.spriteSheet = loaded;
			this.run();

		}).catch(err => {
			console.log(err);
		});
	}
	loadSpritesheet() {
		return new Promise((resolve,reject) => {
			const sprite = new Image();
			const suffix = this.S > 1 ? `@${this.S}x` : "";
			const folder = "https://assets.codepen.io/416221";
			const spriteSrc = `${folder}/windows${suffix}.png`;

			sprite.src = spriteSrc;
			sprite.onload = () => {
				resolve(sprite);
			};
			sprite.onerror = () => {
				reject(`${spriteSrc} not loaded`);
			};
		});
	}
	moveWindows() {
		// acceleration
		const speedIncAdjust = 60 / this.FPS;
		let speedInc = this.speed * speedIncAdjust;

		if (this.launchSpeed < this.speed) {
			speedInc = this.launchSpeed * speedIncAdjust;
			this.launchSpeed += 0.0001 * speedIncAdjust;
			this.launchSpeed = +this.launchSpeed.toFixed(4);
		}

		// movement
		this.windows.forEach(win => {
			// update the dimensions
			win.w = win.sw * Math.min(win.progress * 2,1);
			win.h = win.w * (win.sh / win.sw);

			// …and position
			const { start, end } = win.dPerceived;
			const curDist = start + ((end - start) * this.easeIn(win.progress));

			win.x = (this.W / 2) + Math.sin(win.angle.z) * curDist;
			win.y = (this.H / 2) + Math.cos(win.angle.z) * curDist;

			win.progress += speedInc;
		});

		// remove offscreen windows
		this.windows = this.windows.filter(win => {
			const { x, y, w, h } = win;
			const halfW = w / 2;
			const halfH = h / 2;
			const withinW = x + halfW >= 0 && x - halfW <= this.W;
			const withinH = y + halfH >= 0 && y - halfH <= this.H;

			return withinW && withinH;
		});

		// spawn a new window
		if (this.windows.length < this.maxWindows) {
			const winW = 74;
			const winH = 60;
			const win = {
				angle: this.randomAngle,
				progress: 0,
				d: {
					start: this.randomFloat(50,250)
				},
				sx: winW * this.randomColorID * this.S,
				sy: 0,
				sw: winW,
				sh: winH,
				x: this.W / 2,
				y: this.H / 2,
				w: 0,
				h: 0
			};
			const angleXFactor = Math.cos(win.angle.x);

			win.d.end = win.d.start + 800;
			win.dPerceived = {
				start: angleXFactor * win.d.start,
				end: angleXFactor * win.d.end
			};

			this.windows.push(win);
		}
	}
	get randomAngle() {
		const maxAngle = 75;
		return {
			x: (Math.PI / 2) * (maxAngle / 90) * Math.random(),
			z: 2 * Math.PI * Math.random()
		};
	}
	get randomColorID() {
		const colors = 11;
		return Math.floor(colors * Math.random());
	}
	randomFloat(min,max) {
		return (max - min) * Math.random() + min;
	}
	run() {
		const now = Math.round(this.FPS * Date.now() / 1000);

		if (now !== this.tick) {
			this.draw();
			this.moveWindows();
			this.tick = now;
		}

		requestAnimationFrame(this.run.bind(this));
	}
}