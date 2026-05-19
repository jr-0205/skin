const editorCanvas = document.getElementById('skinCanvas');
const editorCtx = editorCanvas.getContext('2d');
const modelCanvas = document.getElementById('modelCanvas');
const modelCtx = modelCanvas.getContext('2d');
const skinUpload = document.getElementById('skinUpload');
const colorPicker = document.getElementById('colorPicker');
const colorValue = document.getElementById('colorValue');
const brushSize = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
const currentToolLabel = document.getElementById('currentToolLabel');
const pixelLabel = document.getElementById('pixelLabel');
const toggleGridBtn = document.getElementById('toggleGrid');
const undoBtn = document.getElementById('undoBtn');
const lighterBtn = document.getElementById('lighterBtn');
const darkerBtn = document.getElementById('darkerBtn');
const clearBtn = document.getElementById('clearBtn');
const downloadSkinBtn = document.getElementById('downloadSkinBtn');
const modelRotation = document.getElementById('modelRotation');
const modelRotationValue = document.getElementById('modelRotationValue');
const modelPitch = document.getElementById('modelPitch');
const modelPitchValue = document.getElementById('modelPitchValue');
const modelZoom = document.getElementById('modelZoom');
const modelZoomValue = document.getElementById('modelZoomValue');
const modelType = document.getElementById('modelType');
const toolButtons = Array.from(document.querySelectorAll('[data-tool]'));
const previewToggles = Array.from(document.querySelectorAll('[data-preview-option]'));

const skinCanvas = document.createElement('canvas');
skinCanvas.width = 64;
skinCanvas.height = 64;
const skinCtx = skinCanvas.getContext('2d', { willReadFrequently: true });

let currentTool = 'pencil';
let showGrid = true;
let isDrawing = false;
let lastPixelKey = '';
let undoStack = [];
let modelHitRegions = [];
let isPaintingModel = false;
let modelFaceQueue = [];

const toolLabels = {
	pencil: 'Pincel',
	eraser: 'Borrador',
	picker: 'Cuentagotas',
	fill: 'Rellenar'
};

const modelOptions = {
	showBaseLayer: true,
	showOuterLayer: true,
	showHead: true,
	showBody: true,
	showRightArm: true,
	showLeftArm: true,
	showRightLeg: true,
	showLeftLeg: true
};

const parts = [
	{
		key: 'head',
		toggle: 'showHead',
		x: -32,
		y: -104,
		w: 64,
		h: 64,
		d: 64,
		base: { front: [8, 8, 8, 8], right: [16, 8, 8, 8], left: [0, 8, 8, 8], top: [8, 0, 8, 8], bottom: [16, 0, 8, 8], back: [24, 8, 8, 8] },
		outer: { front: [40, 8, 8, 8], right: [48, 8, 8, 8], left: [32, 8, 8, 8], top: [40, 0, 8, 8], bottom: [48, 0, 8, 8], back: [56, 8, 8, 8] }
	},
	{
		key: 'body',
		toggle: 'showBody',
		x: -32,
		y: -40,
		w: 64,
		h: 96,
		d: 32,
		base: { front: [20, 20, 8, 12], right: [28, 20, 4, 12], left: [16, 20, 4, 12], top: [20, 16, 8, 4], bottom: [28, 16, 8, 4], back: [32, 20, 8, 12] },
		outer: { front: [20, 36, 8, 12], right: [28, 36, 4, 12], left: [16, 36, 4, 12], top: [20, 32, 8, 4], bottom: [28, 32, 8, 4], back: [32, 36, 8, 12] }
	},
	{
		key: 'rightArm',
		toggle: 'showRightArm',
		x: -64,
		y: -40,
		w: 32,
		h: 96,
		d: 32,
		base: { front: [44, 20, 4, 12], right: [48, 20, 4, 12], left: [40, 20, 4, 12], top: [44, 16, 4, 4], bottom: [48, 16, 4, 4], back: [52, 20, 4, 12] },
		outer: { front: [44, 36, 4, 12], right: [48, 36, 4, 12], left: [40, 36, 4, 12], top: [44, 32, 4, 4], bottom: [48, 32, 4, 4], back: [52, 36, 4, 12] }
	},
	{
		key: 'leftArm',
		toggle: 'showLeftArm',
		x: 32,
		y: -40,
		w: 32,
		h: 96,
		d: 32,
		base: { front: [36, 52, 4, 12], right: [40, 52, 4, 12], left: [32, 52, 4, 12], top: [36, 48, 4, 4], bottom: [40, 48, 4, 4], back: [44, 52, 4, 12] },
		outer: { front: [52, 52, 4, 12], right: [56, 52, 4, 12], left: [48, 52, 4, 12], top: [52, 48, 4, 4], bottom: [56, 48, 4, 4], back: [60, 52, 4, 12] }
	},
	{
		key: 'rightLeg',
		toggle: 'showRightLeg',
		x: -32,
		y: 56,
		w: 32,
		h: 96,
		d: 32,
		base: { front: [4, 20, 4, 12], right: [8, 20, 4, 12], left: [0, 20, 4, 12], top: [4, 16, 4, 4], bottom: [8, 16, 4, 4], back: [12, 20, 4, 12] },
		outer: { front: [4, 36, 4, 12], right: [8, 36, 4, 12], left: [0, 36, 4, 12], top: [4, 32, 4, 4], bottom: [8, 32, 4, 4], back: [12, 36, 4, 12] }
	},
	{
		key: 'leftLeg',
		toggle: 'showLeftLeg',
		x: 0,
		y: 56,
		w: 32,
		h: 96,
		d: 32,
		base: { front: [20, 52, 4, 12], right: [24, 52, 4, 12], left: [16, 52, 4, 12], top: [20, 48, 4, 4], bottom: [24, 48, 4, 4], back: [28, 52, 4, 12] },
		outer: { front: [4, 52, 4, 12], right: [8, 52, 4, 12], left: [0, 52, 4, 12], top: [4, 48, 4, 4], bottom: [8, 48, 4, 4], back: [12, 52, 4, 12] }
	}
];

function saveUndo() {
	undoStack.push(skinCtx.getImageData(0, 0, 64, 64));
	if (undoStack.length > 30) undoStack.shift();
}

function restoreUndo() {
	const previous = undoStack.pop();
	if (!previous) return;
	skinCtx.putImageData(previous, 0, 0);
	renderAll();
}

function getScale() {
	return editorCanvas.width / 64;
}

function renderEditor() {
	editorCtx.imageSmoothingEnabled = false;
	editorCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
	editorCtx.fillStyle = '#0a0a12';
	editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
	editorCtx.drawImage(skinCanvas, 0, 0, editorCanvas.width, editorCanvas.height);

	if (!showGrid) return;

	const scale = getScale();
	editorCtx.strokeStyle = 'rgba(176, 133, 255, 0.16)';
	editorCtx.lineWidth = 1;
	for (let i = 0; i <= 64; i++) {
		const pos = Math.round(i * scale) + 0.5;
		editorCtx.beginPath();
		editorCtx.moveTo(pos, 0);
		editorCtx.lineTo(pos, editorCanvas.height);
		editorCtx.stroke();
		editorCtx.beginPath();
		editorCtx.moveTo(0, pos);
		editorCtx.lineTo(editorCanvas.width, pos);
		editorCtx.stroke();
	}
}

function shadeColor(rgba, shade) {
	return `rgba(${clampColor(Math.round(rgba[0] * shade))}, ${clampColor(Math.round(rgba[1] * shade))}, ${clampColor(Math.round(rgba[2] * shade))}, ${rgba[3] / 255})`;
}

function getSkinPixel(x, y) {
	return skinCtx.getImageData(x, y, 1, 1).data;
}

function addHitRegion(points, skinX, skinY, depth) {
	modelHitRegions.push({ points, skinX, skinY, depth });
}

function drawTexturedFace(uv, p0, ux, uy, shade = 1, depth = 0) {
	const [sx, sy, sw, sh] = uv;
	for (let y = 0; y < sh; y++) {
		for (let x = 0; x < sw; x++) {
			const rgba = getSkinPixel(sx + x, sy + y);
			const ax = p0.x + ux.x * (x / sw) + uy.x * (y / sh);
			const ay = p0.y + ux.y * (x / sw) + uy.y * (y / sh);
			const bx = p0.x + ux.x * ((x + 1) / sw) + uy.x * (y / sh);
			const by = p0.y + ux.y * ((x + 1) / sw) + uy.y * (y / sh);
			const cx = p0.x + ux.x * ((x + 1) / sw) + uy.x * ((y + 1) / sh);
			const cy = p0.y + ux.y * ((x + 1) / sw) + uy.y * ((y + 1) / sh);
			const dx = p0.x + ux.x * (x / sw) + uy.x * ((y + 1) / sh);
			const dy = p0.y + ux.y * (x / sw) + uy.y * ((y + 1) / sh);
			const points = [{ x: ax, y: ay }, { x: bx, y: by }, { x: cx, y: cy }, { x: dx, y: dy }];

			if (rgba[3] !== 0) {
				modelCtx.fillStyle = shadeColor(rgba, shade);
				modelCtx.beginPath();
				modelCtx.moveTo(ax, ay);
				modelCtx.lineTo(bx, by);
				modelCtx.lineTo(cx, cy);
				modelCtx.lineTo(dx, dy);
				modelCtx.closePath();
				modelCtx.fill();
			}
			addHitRegion(points, sx + x, sy + y, depth);
		}
	}
}

function projectPoint(x, y, z, angle, pitch) {
	const yawRadians = angle * Math.PI / 180;
	const pitchRadians = pitch * Math.PI / 180;
	const yawCos = Math.cos(yawRadians);
	const yawSin = Math.sin(yawRadians);
	const pitchCos = Math.cos(pitchRadians);
	const pitchSin = Math.sin(pitchRadians);
	const zoom = Number(modelZoom ? modelZoom.value : 125) / 100;
	const rotatedX = x * yawCos - z * yawSin;
	const yawZ = x * yawSin + z * yawCos;
	const rotatedY = y * pitchCos - yawZ * pitchSin;
	const rotatedZ = y * pitchSin + yawZ * pitchCos;
	const scale = 1.72 * zoom;
	return {
		x: modelCanvas.width / 2 + rotatedX * scale,
		y: modelCanvas.height * 0.47 + rotatedY * scale - rotatedZ * 0.46 * zoom,
		z: rotatedZ
	};
}

function getRenderPart(part) {
	if (!modelType || modelType.value !== 'slim') return part;
	if (part.key === 'rightArm') return { ...part, x: -56, w: 24 };
	if (part.key === 'leftArm') return { ...part, x: 32, w: 24 };
	return part;
}

function averageDepth(points) {
	return points.reduce((sum, point) => sum + point.z, 0) / points.length;
}

function drawBox(part, layer, inflate, angle, pitch) {
	const uv = part[layer];
	if (!uv) return;

	const x0 = part.x - inflate;
	const x1 = part.x + part.w + inflate;
	const y0 = part.y - inflate;
	const y1 = part.y + part.h + inflate;
	const z0 = -part.d / 2 - inflate;
	const z1 = part.d / 2 + inflate;

	const p = {
		ntl: projectPoint(x0, y0, z0, angle, pitch),
		ntr: projectPoint(x1, y0, z0, angle, pitch),
		nbl: projectPoint(x0, y1, z0, angle, pitch),
		nbr: projectPoint(x1, y1, z0, angle, pitch),
		ftr: projectPoint(x1, y0, z1, angle, pitch),
		ftl: projectPoint(x0, y0, z1, angle, pitch),
		fbr: projectPoint(x1, y1, z1, angle, pitch),
		fbl: projectPoint(x0, y1, z1, angle, pitch)
	};

	const faces = [
		{
			uv: uv.back,
			points: [p.ntr, p.ntl, p.nbl, p.nbr],
			p0: p.ntr,
			ux: { x: p.ntl.x - p.ntr.x, y: p.ntl.y - p.ntr.y },
			uy: { x: p.nbl.x - p.ntl.x, y: p.nbl.y - p.ntl.y },
			shade: 0.7,
			depth: averageDepth([p.ntr, p.ntl, p.nbl, p.nbr])
		},
		{
			uv: uv.left,
			points: [p.ftl, p.ntl, p.nbl, p.fbl],
			p0: p.ftl,
			ux: { x: p.ntl.x - p.ftl.x, y: p.ntl.y - p.ftl.y },
			uy: { x: p.nbl.x - p.ntl.x, y: p.nbl.y - p.ntl.y },
			shade: 0.78,
			depth: averageDepth([p.ftl, p.ntl, p.nbl, p.fbl])
		},
		{
			uv: uv.right,
			points: [p.ntr, p.ftr, p.fbr, p.nbr],
			p0: p.ntr,
			ux: { x: p.ftr.x - p.ntr.x, y: p.ftr.y - p.ntr.y },
			uy: { x: p.fbr.x - p.ftr.x, y: p.fbr.y - p.ftr.y },
			shade: 0.82,
			depth: averageDepth([p.ntr, p.ftr, p.fbr, p.nbr])
		},
		{
			uv: uv.top,
			points: [p.ftl, p.ftr, p.ntr, p.ntl],
			p0: p.ftl,
			ux: { x: p.ftr.x - p.ftl.x, y: p.ftr.y - p.ftl.y },
			uy: { x: p.ntr.x - p.ftr.x, y: p.ntr.y - p.ftr.y },
			shade: 1.1,
			depth: averageDepth([p.ftl, p.ftr, p.ntr, p.ntl])
		},
		{
			uv: uv.bottom,
			points: [p.nbl, p.nbr, p.fbr, p.fbl],
			p0: p.nbl,
			ux: { x: p.nbr.x - p.nbl.x, y: p.nbr.y - p.nbl.y },
			uy: { x: p.fbr.x - p.nbr.x, y: p.fbr.y - p.nbr.y },
			shade: 0.66,
			depth: averageDepth([p.nbl, p.nbr, p.fbr, p.fbl])
		},
		{
			uv: uv.front,
			points: [p.ftl, p.ftr, p.fbr, p.fbl],
			p0: p.ftl,
			ux: { x: p.ftr.x - p.ftl.x, y: p.ftr.y - p.ftl.y },
			uy: { x: p.fbr.x - p.ftr.x, y: p.fbr.y - p.ftr.y },
			shade: 1,
			depth: averageDepth([p.ftl, p.ftr, p.fbr, p.fbl])
		}
	];

	modelFaceQueue.push(...faces.filter(face => face.uv));
}

function drawModelPreview() {
	modelHitRegions = [];
	modelFaceQueue = [];
	modelCtx.clearRect(0, 0, modelCanvas.width, modelCanvas.height);
	const gradient = modelCtx.createLinearGradient(0, 0, 0, modelCanvas.height);
	gradient.addColorStop(0, '#0b0b12');
	gradient.addColorStop(1, '#090910');
	modelCtx.fillStyle = gradient;
	modelCtx.fillRect(0, 0, modelCanvas.width, modelCanvas.height);

	modelCtx.fillStyle = '#151020';
	modelCtx.beginPath();
	modelCtx.ellipse(modelCanvas.width / 2, modelCanvas.height - 66, 145, 30, 0, 0, Math.PI * 2);
	modelCtx.fill();

	const angle = Number(modelRotation.value);
	const pitch = Number(modelPitch ? modelPitch.value : 10);
	for (const part of parts) {
		if (!modelOptions[part.toggle]) continue;
		const renderPart = getRenderPart(part);
		if (modelOptions.showBaseLayer) drawBox(renderPart, 'base', 0, angle, pitch);
		if (modelOptions.showOuterLayer) drawBox(renderPart, 'outer', 2.6, angle, pitch);
	}

	modelFaceQueue
		.sort((a, b) => a.depth - b.depth)
		.forEach(face => {
			drawTexturedFace(face.uv, face.p0, face.ux, face.uy, face.shade, face.depth);
		});
}

function renderAll() {
	renderEditor();
	drawModelPreview();
}

function getPixelFromEvent(event) {
	const rect = editorCanvas.getBoundingClientRect();
	const x = Math.floor((event.clientX - rect.left) / rect.width * 64);
	const y = Math.floor((event.clientY - rect.top) / rect.height * 64);
	return {
		x: Math.max(0, Math.min(63, x)),
		y: Math.max(0, Math.min(63, y))
	};
}

function getModelPointFromEvent(event) {
	const rect = modelCanvas.getBoundingClientRect();
	return {
		x: (event.clientX - rect.left) / rect.width * modelCanvas.width,
		y: (event.clientY - rect.top) / rect.height * modelCanvas.height
	};
}

function pointInTriangle(point, a, b, c) {
	const area = (p1, p2, p3) => (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2;
	const total = Math.abs(area(a, b, c));
	const a1 = Math.abs(area(point, b, c));
	const a2 = Math.abs(area(a, point, c));
	const a3 = Math.abs(area(a, b, point));
	return Math.abs(total - (a1 + a2 + a3)) < 0.35;
}

function pointInQuad(point, points) {
	return pointInTriangle(point, points[0], points[1], points[2]) || pointInTriangle(point, points[0], points[2], points[3]);
}

function getSkinPixelFromModelEvent(event) {
	const point = getModelPointFromEvent(event);
	for (let i = modelHitRegions.length - 1; i >= 0; i--) {
		const region = modelHitRegions[i];
		if (pointInQuad(point, region.points)) {
			return { x: region.skinX, y: region.skinY };
		}
	}
	return null;
}

function hexToRgba(hex) {
	const clean = hex.replace('#', '');
	return [
		parseInt(clean.slice(0, 2), 16),
		parseInt(clean.slice(2, 4), 16),
		parseInt(clean.slice(4, 6), 16),
		255
	];
}

function rgbaToHex(data) {
	return '#' + [data[0], data[1], data[2]]
		.map(value => value.toString(16).padStart(2, '0'))
		.join('');
}

function clampColor(value) {
	return Math.max(0, Math.min(255, value));
}

function adjustActiveColor(amount) {
	const color = hexToRgba(colorPicker.value);
	const adjusted = color.map((value, index) => {
		if (index === 3) return value;
		return clampColor(value + amount);
	});
	colorPicker.value = rgbaToHex(adjusted);
	if (colorValue) colorValue.textContent = colorPicker.value;
}

function paintPixel(x, y, rgba) {
	const size = Number(brushSize.value);
	const offset = Math.floor(size / 2);
	const imageData = skinCtx.createImageData(1, 1);
	imageData.data.set(rgba);

	for (let yy = y - offset; yy < y - offset + size; yy++) {
		for (let xx = x - offset; xx < x - offset + size; xx++) {
			if (xx >= 0 && xx < 64 && yy >= 0 && yy < 64) {
				skinCtx.putImageData(imageData, xx, yy);
			}
		}
	}
}

function pickColor(x, y) {
	const data = skinCtx.getImageData(x, y, 1, 1).data;
	if (data[3] === 0) return;
	colorPicker.value = rgbaToHex(data);
	if (colorValue) colorValue.textContent = colorPicker.value;
}

function colorsMatch(a, b) {
	return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

function floodFill(startX, startY, fillColor) {
	const imageData = skinCtx.getImageData(0, 0, 64, 64);
	const data = imageData.data;
	const startIndex = (startY * 64 + startX) * 4;
	const target = Array.from(data.slice(startIndex, startIndex + 4));
	if (colorsMatch(target, fillColor)) return;

	const stack = [[startX, startY]];
	while (stack.length) {
		const [x, y] = stack.pop();
		if (x < 0 || x >= 64 || y < 0 || y >= 64) continue;

		const index = (y * 64 + x) * 4;
		const current = Array.from(data.slice(index, index + 4));
		if (!colorsMatch(current, target)) continue;

		data.set(fillColor, index);
		stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
	}

	skinCtx.putImageData(imageData, 0, 0);
}

function useTool(x, y) {
	if (currentTool === 'picker') {
		pickColor(x, y);
		return false;
	}

	if (currentTool === 'fill') {
		floodFill(x, y, hexToRgba(colorPicker.value));
		return true;
	}

	const color = currentTool === 'eraser' ? [0, 0, 0, 0] : hexToRgba(colorPicker.value);
	paintPixel(x, y, color);
	return true;
}

function setTool(tool) {
	currentTool = tool;
	currentToolLabel.textContent = toolLabels[tool];
	toolButtons.forEach(button => {
		button.classList.toggle('is-active', button.dataset.tool === tool);
	});
}

function createBlankSkin() {
	skinCtx.clearRect(0, 0, 64, 64);
	renderAll();
}

function loadDefaultEditorSkin() {
	const image = new Image();
	image.onload = function() {
		skinCtx.clearRect(0, 0, 64, 64);
		skinCtx.imageSmoothingEnabled = false;
		skinCtx.drawImage(image, 0, 0, 64, 64);
		renderAll();
	};
	image.onerror = createBlankSkin;
	image.src = 'assets/default-skin.png';
}

function loadUploadedSkin(file) {
	const image = new Image();
	image.onload = function() {
		saveUndo();
		skinCtx.clearRect(0, 0, 64, 64);
		skinCtx.imageSmoothingEnabled = false;
		skinCtx.drawImage(image, 0, 0, 64, 64);
		renderAll();
		URL.revokeObjectURL(image.src);
	};
	image.src = URL.createObjectURL(file);
}

function downloadSkin() {
	const link = document.createElement('a');
	link.href = skinCanvas.toDataURL('image/png');
	link.download = 'skin-editada-juniorcito.png';
	document.body.appendChild(link);
	link.click();
	link.remove();
}

toolButtons.forEach(button => {
	button.addEventListener('click', function() {
		setTool(button.dataset.tool);
	});
});

previewToggles.forEach(toggle => {
	toggle.addEventListener('click', function() {
		const option = toggle.dataset.previewOption;
		modelOptions[option] = !modelOptions[option];
		toggle.classList.toggle('is-active', modelOptions[option]);
		drawModelPreview();
	});
});

skinUpload.addEventListener('change', function() {
	if (skinUpload.files && skinUpload.files[0]) {
		loadUploadedSkin(skinUpload.files[0]);
	}
});

brushSize.addEventListener('input', function() {
	brushSizeValue.textContent = brushSize.value;
});

colorPicker.addEventListener('input', function() {
	if (colorValue) colorValue.textContent = colorPicker.value;
});

if (lighterBtn) {
	lighterBtn.addEventListener('click', function() {
		adjustActiveColor(18);
	});
}

if (darkerBtn) {
	darkerBtn.addEventListener('click', function() {
		adjustActiveColor(-18);
	});
}

modelRotation.addEventListener('input', function() {
	modelRotationValue.textContent = modelRotation.value;
	drawModelPreview();
});

if (modelPitch) {
	modelPitch.addEventListener('input', function() {
		modelPitchValue.textContent = modelPitch.value;
		drawModelPreview();
	});
}

if (modelZoom) {
	modelZoom.addEventListener('input', function() {
		modelZoomValue.textContent = `${modelZoom.value}%`;
		drawModelPreview();
	});
}

if (modelType) {
	modelType.addEventListener('change', drawModelPreview);
}

toggleGridBtn.addEventListener('click', function() {
	showGrid = !showGrid;
	toggleGridBtn.classList.toggle('is-active', showGrid);
	renderEditor();
});

undoBtn.addEventListener('click', restoreUndo);

clearBtn.addEventListener('click', function() {
	saveUndo();
	createBlankSkin();
});

downloadSkinBtn.addEventListener('click', downloadSkin);

function editModelPixel(event, allowNonDrawingTool = false) {
	const pixel = getSkinPixelFromModelEvent(event);
	if (!pixel) return false;

	pixelLabel.textContent = `x: ${pixel.x}, y: ${pixel.y}`;
	if (!allowNonDrawingTool && currentTool !== 'pencil' && currentTool !== 'eraser') return false;

	const changed = useTool(pixel.x, pixel.y);
	if (changed) renderAll();
	return changed;
}

modelCanvas.addEventListener('pointerdown', function(event) {
	const pixel = getSkinPixelFromModelEvent(event);
	if (!pixel) return;

	pixelLabel.textContent = `x: ${pixel.x}, y: ${pixel.y}`;
	const shouldSave = currentTool !== 'picker';
	if (shouldSave) saveUndo();
	const changed = useTool(pixel.x, pixel.y);
	if (changed) renderAll();
	isPaintingModel = currentTool === 'pencil' || currentTool === 'eraser';
	lastPixelKey = `${pixel.x},${pixel.y}`;
	modelCanvas.setPointerCapture(event.pointerId);
});

modelCanvas.addEventListener('pointermove', function(event) {
	const pixel = getSkinPixelFromModelEvent(event);
	if (!pixel) return;
	pixelLabel.textContent = `x: ${pixel.x}, y: ${pixel.y}`;
	if (!isPaintingModel) return;

	const pixelKey = `${pixel.x},${pixel.y}`;
	if (pixelKey === lastPixelKey) return;
	lastPixelKey = pixelKey;
	editModelPixel(event);
});

modelCanvas.addEventListener('pointerup', function() {
	isPaintingModel = false;
	lastPixelKey = '';
});

modelCanvas.addEventListener('pointerleave', function() {
	isPaintingModel = false;
	lastPixelKey = '';
});

editorCanvas.addEventListener('pointerdown', function(event) {
	const { x, y } = getPixelFromEvent(event);
	pixelLabel.textContent = `x: ${x}, y: ${y}`;
	lastPixelKey = `${x},${y}`;

	const shouldSave = currentTool !== 'picker';
	if (shouldSave) saveUndo();
	const changed = useTool(x, y);
	if (changed) renderAll();
	isDrawing = currentTool === 'pencil' || currentTool === 'eraser';
	editorCanvas.setPointerCapture(event.pointerId);
});

editorCanvas.addEventListener('pointermove', function(event) {
	const { x, y } = getPixelFromEvent(event);
	pixelLabel.textContent = `x: ${x}, y: ${y}`;
	if (!isDrawing) return;

	const pixelKey = `${x},${y}`;
	if (pixelKey === lastPixelKey) return;
	lastPixelKey = pixelKey;
	useTool(x, y);
	renderAll();
});

editorCanvas.addEventListener('pointerup', function() {
	isDrawing = false;
	lastPixelKey = '';
});

editorCanvas.addEventListener('pointerleave', function() {
	isDrawing = false;
	lastPixelKey = '';
});

toggleGridBtn.classList.add('is-active');
loadDefaultEditorSkin();
