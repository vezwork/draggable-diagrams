import _ from "lodash";
import { Manipulable } from "./manipulable";
import { group, keyed, transform } from "./shape";
import { insert, remove } from "./utils";
import { Vec2 } from "./vec2";
import { XYWH } from "./xywh";

type PermState = {
  store: { key: string; label: string }[];
  items: { key: string; label: string }[];
};

export const manipulableInsertAndRemove: Manipulable<PermState> = {
  render(state) {
    // draw grid as rectangles
    const TILE_SIZE = 50;
    return group(`grid-poly`, [
      {
        type: "rectangle" as const,
        xywh: XYWH(0, 0, 60, TILE_SIZE),
        label: "Store:",
      },
      ...state.store.map(({ key, label }, idx) =>
        transform(
          Vec2(80 + idx * TILE_SIZE, 0),
          keyed(key, true, {
            type: "rectangle" as const,
            xywh: XYWH(0, 0, TILE_SIZE, TILE_SIZE),
            strokeStyle: "black",
            lineWidth: 2,
            label,
          }),
        ),
      ),
      ...state.items.map(({ key, label }, idx) =>
        transform(
          Vec2(idx * TILE_SIZE, TILE_SIZE * 1.5),
          keyed(key, true, {
            type: "rectangle" as const,
            xywh: XYWH(0, 0, TILE_SIZE, TILE_SIZE),
            strokeStyle: "black",
            lineWidth: 2,
            label,
          }),
        ),
      ),
    ]);
  },

  accessibleFrom(state, draggableKey) {
    const itemIdx = state.items.findIndex((item) => item.key === draggableKey);
    if (itemIdx !== -1) {
      const draggedItem = state.items[itemIdx];
      const itemsWithoutDragged = remove(state.items, itemIdx);

      return [
        ..._.range(itemsWithoutDragged.length + 1).map((idx) => ({
          ...state,
          items: insert(itemsWithoutDragged, idx, draggedItem),
        })),
        {
          ...state,
          items: itemsWithoutDragged,
        },
      ];
    } else {
      // item is from store, can be inserted anywhere
      const storeItem = state.store.find((item) => item.key === draggableKey)!;
      return [
        state,
        ..._.range(state.items.length + 1).map((idx) => ({
          store: state.store.map((item) =>
            item.key === draggableKey
              ? { ...item, key: item.key + "-1" }
              : item,
          ),
          items: insert(state.items, idx, storeItem),
        })),
      ];
    }
  },
};
