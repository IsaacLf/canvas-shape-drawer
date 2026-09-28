# canvas-shape-drawer

A lightweight browser app for ambient-light testing with movable, resizable, recolorable shapes on a large stage.

## Run locally

No build step or dependencies are required.

- Open `index.html` directly in a browser from the project root, or
- Serve the repository with a simple static server, for example:

```bash
cd canvas-shape-drawer
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Available interactions

- **Add shapes:** create rectangles, circles, and triangles from the top toolbar.
- **Select and move:** click or tap a shape, then drag it around the stage.
- **Resize:** drag a selected shape's corner handles, or use <kbd>Shift</kbd> + <kbd>Left</kbd>/<kbd>Right</kbd> to change width and <kbd>Shift</kbd> + <kbd>Up</kbd>/<kbd>Down</kbd> to change height. For circles, the same keys change overall size while keeping the shape proportional.
- **Recolor:** change the selected shape with the shape color picker.
- **Change background:** use the background color picker. The stage starts black by default.
- **Delete:** remove the selected shape with the button or the <kbd>Delete</kbd>/<kbd>Backspace</kbd> keys.
- **Clear canvas:** remove all shapes while keeping the stage available for new tests.
- **Fullscreen:** use the fullscreen button to enter or exit browser fullscreen mode.
- **Keyboard support:** arrow keys move the selected shape; <kbd>Shift</kbd> + horizontal arrows resize width; <kbd>Shift</kbd> + vertical arrows resize height; for circles, <kbd>Shift</kbd> + arrows change overall size while keeping the shape proportional; <kbd>Escape</kbd> clears the selection.

## Notes

- The interface is responsive and optimized to keep the stage area as large as possible.
- Bright default shape colors are used so shapes remain visible against the default black background.
- The app uses standard HTML, CSS, and JavaScript only.
