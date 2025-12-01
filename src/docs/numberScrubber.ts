import { syntaxTree } from "@codemirror/language";
import { EditorView } from "@codemirror/view";

export function numberScrubber() {
  return [
    EditorView.domEventHandlers({
      mousedown: (event, view) => {
        const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
        if (pos === null) return false;

        const tree = syntaxTree(view.state);
        let numberFrom = -1;
        let numberTo = -1;
        let numberValue = "";

        tree.iterate({
          from: pos,
          to: pos,
          enter: (node) => {
            if (node.name === "Number") {
              numberFrom = node.from;
              numberTo = node.to;
              numberValue = view.state.doc.sliceString(node.from, node.to);
            }
          },
        });

        if (numberFrom === -1) return false;

        event.preventDefault(); // Prevent text selection

        const startX = event.clientX;
        const startY = event.clientY;
        const startValue = parseFloat(numberValue);
        const isDecimal = numberValue.includes(".");
        let currentFrom = numberFrom;
        let currentTo = numberTo;
        let isDragging = false;
        const dragThreshold = 3; // pixels

        const handleMouseMove = (e: MouseEvent) => {
          const deltaX = Math.abs(e.clientX - startX);
          const deltaY = Math.abs(e.clientY - startY);

          // Only start dragging if we've moved past the threshold
          if (
            !isDragging &&
            (deltaX > dragThreshold || deltaY > dragThreshold)
          ) {
            isDragging = true;
          }

          if (!isDragging) return;

          e.preventDefault();

          // Keep cursor as ew-resize during drag
          document.body.style.cursor = "ew-resize";

          const delta = e.clientX - startX;
          const sensitivity = e.shiftKey ? 0.1 : 1;
          const adjustedDelta = delta * sensitivity;

          let newValue: number;
          if (isDecimal) {
            newValue = startValue + adjustedDelta * 0.01;
            newValue = Math.round(newValue * 100) / 100;
          } else {
            newValue = Math.round(startValue + adjustedDelta * 0.1);
          }

          const newText = isDecimal ? newValue.toFixed(2) : String(newValue);

          view.dispatch({
            changes: { from: currentFrom, to: currentTo, insert: newText },
          });

          // Update positions for next iteration
          currentTo = currentFrom + newText.length;
        };

        const handleMouseUp = () => {
          document.body.style.cursor = "default";
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);

          // If we didn't drag, place the cursor where they clicked
          if (!isDragging) {
            view.dispatch({
              selection: { anchor: pos },
            });
          }
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return true;
      },
    }),
  ];
}
