const mask = {
	"nw": {
		"x": 319.32091440704045,
		"y": 547.5954649404039
	},
	"ne": {
		"x": 1303.6738158436196,
		"y": 893.3063255426707
	},
	"se": {
		"x": 1380.2052746684474,
		"y": 366.83390621655565
	},
	"sw": {
		"x": 261.2625663330331,
		"y": 80.49167871899857
	}
}

const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

const { CanvasImage } = require('./canvasImageNode.js');

loadImage('base.jpg').then(async (image) => {
	const canvas = createCanvas(image.width, image.height);
	const ctx = canvas.getContext('2d');
	ctx.drawImage(image, 0, 0, image.width, image.height)

	// Write "Awesome!"
	// ctx.font = '30px Impact'
	// ctx.rotate(0.1)
	// ctx.fillText('Awesome!', 50, 100)

	// ctx.beginPath();
	// ctx.moveTo(mask.nw.x, image.height - mask.nw.y);
	// ctx.lineTo(mask.ne.x, image.height - mask.ne.y);
	// ctx.lineTo(mask.se.x, image.height - mask.se.y);
	// ctx.lineTo(mask.sw.x, image.height - mask.sw.y);
	// ctx.lineTo(mask.nw.x, image.height - mask.nw.y);
	// ctx.strokeStyle = 'rgba(0, 255, 0, 1)';
	// ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
	// ctx.lineWidth = 6;
	// ctx.stroke();
	// ctx.fill();

	console.log(image.height);
	console.log(image.width);
	console.log(image.naturalHeight);
	console.log(image.naturalWidth);

	const im = await loadImage('brand.jpg');

	// swap ne/nw, se/sw for horizontal flip
	let handles = {
		nw: { x: mask.nw.x, y: image.height - mask.nw.y },
		ne: { x: mask.ne.x, y: image.height - mask.ne.y },
		se: { x: mask.se.x, y: image.height - mask.se.y },
		sw: { x: mask.sw.x, y: image.height - mask.sw.y }
	};

	const canvasImageNode = new CanvasImage(canvas, im);
	canvasImageNode.draw(handles);

	const out = fs.createWriteStream(__dirname + '/test.png')
	const stream = canvas.createPNGStream()
	stream.pipe(out)
	out.on('finish', () =>  console.log('The PNG file was created.'))

  // console.log('<img src="' + canvas.toDataURL() + '" />')
	})
