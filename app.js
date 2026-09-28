const svgNS = 'http://www.w3.org/2000/svg';
const stage = document.getElementById('stage');
const stageBackground = document.getElementById('stage-background');
const shapesLayer = document.getElementById('shapes-layer');
const overlayLayer = document.getElementById('overlay-layer');
const statusElement = document.getElementById('status');
const shapeColorInput = document.getElementById('shape-color');
const backgroundColorInput = document.getElementById('background-color');
const deleteButton = document.getElementById('delete-shape');
const clearButton = document.getElementById('clear-canvas');
const fullscreenButton = document.getElementById('fullscreen-toggle');

const stageBounds = { width: 1000, height: 700 };
const minimumSize = 24;
const handleSize = 8;

let shapes = [];
let selectedShapeId = null;
let interaction = null;
let nextShapeId = 1;

const defaultShapeColors = {
  rectangle: '#ffffff',
  circle: '#60a5fa',
  triangle: '#f97316',
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function createShape(type) {
  const baseSize = type === 'circle' ? 120 : 160;
  const shape = {
    id: String(nextShapeId++),
    type,
    x: stageBounds.width / 2 - baseSize / 2,
    y: stageBounds.height / 2 - baseSize / 2,
    width: baseSize,
    height: type === 'circle' ? baseSize : 110,
    color: defaultShapeColors[type],
  };

  if (type === 'triangle') {
    shape.height = 130;
  }

  shapes.push(shape);
  selectShape(shape.id);
  render();
}

function getSelectedShape() {
  return shapes.find((shape) => shape.id === selectedShapeId) ?? null;
}

function getShapeBounds(shape) {
  return {
    x: shape.x,
    y: shape.y,
    width: shape.width,
    height: shape.height,
  };
}

function setShapeBounds(shape, bounds) {
  shape.x = clamp(bounds.x, 0, stageBounds.width - bounds.width);
  shape.y = clamp(bounds.y, 0, stageBounds.height - bounds.height);
  shape.width = clamp(bounds.width, minimumSize, stageBounds.width);
  shape.height = clamp(bounds.height, minimumSize, stageBounds.height);

  if (shape.type === 'circle') {
    const size = clamp(Math.max(shape.width, shape.height), minimumSize, Math.min(stageBounds.width, stageBounds.height));
    shape.width = size;
    shape.height = size;
    shape.x = clamp(shape.x, 0, stageBounds.width - size);
    shape.y = clamp(shape.y, 0, stageBounds.height - size);
  }
}

function getPointerPosition(event) {
  const point = stage.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const transformed = point.matrixTransform(stage.getScreenCTM().inverse());
  return {
    x: clamp(transformed.x, 0, stageBounds.width),
    y: clamp(transformed.y, 0, stageBounds.height),
  };
}

function describeShape(shape) {
  if (!shape) {
    return 'No shape selected.';
  }

  return `${shape.type} selected. Position ${Math.round(shape.x)}, ${Math.round(shape.y)}. Size ${Math.round(shape.width)} by ${Math.round(shape.height)}.`;
}

function updateStatus() {
  const shape = getSelectedShape();
  statusElement.textContent = describeShape(shape);
  deleteButton.disabled = !shape;
  shapeColorInput.disabled = !shape;
  shapeColorInput.value = shape ? shape.color : '#ffffff';
}

function selectShape(id) {
  selectedShapeId = id;
  updateStatus();
  render();
}

function clearOverlay() {
  while (overlayLayer.firstChild) {
    overlayLayer.removeChild(overlayLayer.firstChild);
  }
}

function renderShape(shape) {
  let element;

  if (shape.type === 'rectangle') {
    element = document.createElementNS(svgNS, 'rect');
    element.setAttribute('x', shape.x);
    element.setAttribute('y', shape.y);
    element.setAttribute('width', shape.width);
    element.setAttribute('height', shape.height);
    element.setAttribute('rx', 6);
  } else if (shape.type === 'circle') {
    element = document.createElementNS(svgNS, 'ellipse');
    element.setAttribute('cx', shape.x + shape.width / 2);
    element.setAttribute('cy', shape.y + shape.height / 2);
    element.setAttribute('rx', shape.width / 2);
    element.setAttribute('ry', shape.height / 2);
  } else {
    element = document.createElementNS(svgNS, 'polygon');
    const top = `${shape.x + shape.width / 2},${shape.y}`;
    const bottomLeft = `${shape.x},${shape.y + shape.height}`;
    const bottomRight = `${shape.x + shape.width},${shape.y + shape.height}`;
    element.setAttribute('points', `${top} ${bottomLeft} ${bottomRight}`);
  }

  element.classList.add('shape');
  element.setAttribute('fill', shape.color);
  element.setAttribute('data-shape-id', shape.id);
  element.setAttribute('role', 'presentation');
  shapesLayer.appendChild(element);
}

function renderSelection(shape) {
  if (!shape) {
    return;
  }

  const bounds = getShapeBounds(shape);
  const outline = document.createElementNS(svgNS, 'rect');
  outline.setAttribute('x', bounds.x - 6);
  outline.setAttribute('y', bounds.y - 6);
  outline.setAttribute('width', bounds.width + 12);
  outline.setAttribute('height', bounds.height + 12);
  outline.setAttribute('class', 'selection-outline');
  overlayLayer.appendChild(outline);

  const handles = {
    nw: { x: bounds.x, y: bounds.y },
    ne: { x: bounds.x + bounds.width, y: bounds.y },
    sw: { x: bounds.x, y: bounds.y + bounds.height },
    se: { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
  };

  Object.entries(handles).forEach(([handle, point]) => {
    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', point.x);
    circle.setAttribute('cy', point.y);
    circle.setAttribute('r', handleSize);
    circle.setAttribute('class', 'resize-handle');
    circle.setAttribute('data-handle', handle);
    circle.setAttribute('data-shape-id', shape.id);
    overlayLayer.appendChild(circle);
  });
}

function render() {
  while (shapesLayer.firstChild) {
    shapesLayer.removeChild(shapesLayer.firstChild);
  }
  clearOverlay();
  shapes.forEach(renderShape);
  renderSelection(getSelectedShape());
}

function deleteSelectedShape() {
  if (!selectedShapeId) {
    return;
  }

  shapes = shapes.filter((shape) => shape.id !== selectedShapeId);
  selectedShapeId = null;
  updateStatus();
  render();
}

function clearCanvas() {
  shapes = [];
  selectedShapeId = null;
  updateStatus();
  render();
}

function bringToFront(shapeId) {
  const index = shapes.findIndex((shape) => shape.id === shapeId);
  if (index < 0) {
    return;
  }

  const [shape] = shapes.splice(index, 1);
  shapes.push(shape);
}

function startDragging(shape, pointer) {
  interaction = {
    type: 'drag',
    shapeId: shape.id,
    offsetX: pointer.x - shape.x,
    offsetY: pointer.y - shape.y,
  };
}

function startResizing(shape, handle, pointer) {
  interaction = {
    type: 'resize',
    shapeId: shape.id,
    handle,
    startPointer: pointer,
    startBounds: { ...getShapeBounds(shape) },
  };
}

function resizeFromHandle(shape, startBounds, handle, pointer) {
  if (handle.length !== 2) {
    return { ...startBounds };
  }

  if (pointer == null) {
    return { ...startBounds };
  }

  if (shape.type === 'circle') {
    const anchorX = handle.includes('w') ? startBounds.x + startBounds.width : startBounds.x;
    const anchorY = handle.includes('n') ? startBounds.y + startBounds.height : startBounds.y;
    const deltaX = Math.abs(pointer.x - anchorX);
    const deltaY = Math.abs(pointer.y - anchorY);
    const size = clamp(Math.max(deltaX, deltaY), minimumSize, Math.min(stageBounds.width, stageBounds.height));

    return {
      x: handle.includes('w') ? anchorX - size : anchorX,
      y: handle.includes('n') ? anchorY - size : anchorY,
      width: size,
      height: size,
    };
  }

  const result = { ...startBounds };
  const right = startBounds.x + startBounds.width;
  const bottom = startBounds.y + startBounds.height;

  if (handle.includes('n')) {
    result.y = clamp(pointer.y, 0, bottom - minimumSize);
    result.height = bottom - result.y;
  }
  if (handle.includes('s')) {
    result.height = clamp(pointer.y - startBounds.y, minimumSize, stageBounds.height - startBounds.y);
  }
  if (handle.includes('w')) {
    result.x = clamp(pointer.x, 0, right - minimumSize);
    result.width = right - result.x;
  }
  if (handle.includes('e')) {
    result.width = clamp(pointer.x - startBounds.x, minimumSize, stageBounds.width - startBounds.x);
  }

  return result;
}

function updateInteraction(event) {
  if (!interaction) {
    return;
  }

  const shape = shapes.find((item) => item.id === interaction.shapeId);
  if (!shape) {
    interaction = null;
    return;
  }

  const pointer = getPointerPosition(event);

  if (interaction.type === 'drag') {
    setShapeBounds(shape, {
      x: pointer.x - interaction.offsetX,
      y: pointer.y - interaction.offsetY,
      width: shape.width,
      height: shape.height,
    });
  } else if (interaction.type === 'resize') {
    const resized = resizeFromHandle(shape, interaction.startBounds, interaction.handle, pointer);
    setShapeBounds(shape, resized);
  }

  updateStatus();
  render();
}

function endInteraction() {
  interaction = null;
}

stage.addEventListener('pointerdown', (event) => {
  const handle = event.target.dataset.handle;
  const shapeId = event.target.dataset.shapeId;
  const pointer = getPointerPosition(event);

  if (handle && shapeId) {
    const shape = shapes.find((item) => item.id === shapeId);
    if (!shape) {
      return;
    }

    selectShape(shape.id);
    startResizing(shape, handle, pointer);
    stage.setPointerCapture(event.pointerId);
    return;
  }

  if (shapeId) {
    const shape = shapes.find((item) => item.id === shapeId);
    if (!shape) {
      return;
    }

    bringToFront(shapeId);
    selectShape(shapeId);
    startDragging(shape, pointer);
    stage.setPointerCapture(event.pointerId);
    return;
  }

  selectedShapeId = null;
  updateStatus();
  render();
});

stage.addEventListener('pointermove', updateInteraction);
stage.addEventListener('pointerup', endInteraction);
stage.addEventListener('pointercancel', endInteraction);

shapeColorInput.addEventListener('input', (event) => {
  const shape = getSelectedShape();
  if (!shape) {
    return;
  }

  shape.color = event.target.value;
  render();
});

backgroundColorInput.addEventListener('input', (event) => {
  stageBackground.setAttribute('fill', event.target.value);
});

deleteButton.addEventListener('click', deleteSelectedShape);
clearButton.addEventListener('click', clearCanvas);

document.getElementById('add-rectangle').addEventListener('click', () => createShape('rectangle'));
document.getElementById('add-circle').addEventListener('click', () => createShape('circle'));
document.getElementById('add-triangle').addEventListener('click', () => createShape('triangle'));

fullscreenButton.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      stage.focus();
    } else {
      await document.documentElement.requestFullscreen();
      stage.focus();
    }
  } catch (error) {
    statusElement.textContent = `Fullscreen unavailable: ${error.message}`;
  }
});

document.addEventListener('fullscreenchange', () => {
  const isFullscreen = Boolean(document.fullscreenElement);
  fullscreenButton.textContent = isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen';
  fullscreenButton.setAttribute('aria-pressed', String(isFullscreen));
});

document.addEventListener('keydown', (event) => {
  const activeElement = document.activeElement;
  if (activeElement && ['INPUT', 'BUTTON'].includes(activeElement.tagName)) {
    return;
  }

  const shape = getSelectedShape();
  if (!shape) {
    return;
  }

  const moveStep = event.shiftKey ? 0 : 12;
  const sizeStep = event.shiftKey ? 12 : 0;
  let handled = true;

  if (event.key === 'Delete' || event.key === 'Backspace') {
    deleteSelectedShape();
  } else if (event.key === 'ArrowLeft') {
    if (event.shiftKey) {
      setShapeBounds(shape, { x: shape.x, y: shape.y, width: shape.width - sizeStep, height: shape.height - (shape.type === 'circle' ? sizeStep : 0) });
    } else {
      setShapeBounds(shape, { x: shape.x - moveStep, y: shape.y, width: shape.width, height: shape.height });
    }
  } else if (event.key === 'ArrowRight') {
    if (event.shiftKey) {
      setShapeBounds(shape, { x: shape.x, y: shape.y, width: shape.width + sizeStep, height: shape.height + (shape.type === 'circle' ? sizeStep : 0) });
    } else {
      setShapeBounds(shape, { x: shape.x + moveStep, y: shape.y, width: shape.width, height: shape.height });
    }
  } else if (event.key === 'ArrowUp') {
    if (event.shiftKey) {
      setShapeBounds(shape, { x: shape.x, y: shape.y, width: shape.width, height: shape.height - sizeStep });
    } else {
      setShapeBounds(shape, { x: shape.x, y: shape.y - moveStep, width: shape.width, height: shape.height });
    }
  } else if (event.key === 'ArrowDown') {
    if (event.shiftKey) {
      setShapeBounds(shape, { x: shape.x, y: shape.y, width: shape.width, height: shape.height + sizeStep });
    } else {
      setShapeBounds(shape, { x: shape.x, y: shape.y + moveStep, width: shape.width, height: shape.height });
    }
  } else if (event.key === 'Escape') {
    selectedShapeId = null;
  } else {
    handled = false;
  }

  if (handled) {
    event.preventDefault();
    updateStatus();
    render();
  }
});

updateStatus();
render();
