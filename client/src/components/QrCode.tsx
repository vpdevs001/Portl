import { View } from 'react-native';
import qrcodeGenerator from 'qrcode-generator';

type QrCodeProps = {
  value: string;
  size?: number;
  foreground?: string;
  background?: string;
};

// Quiet zone: the blank margin a QR code needs around its modules for a
// scanner to find the position markers at all. The spec calls for 4
// modules of clear space on every side — without it, most real cameras
// (including expo-camera's barcode scanner) simply never recognize the
// pattern as a QR code, no matter how correct the modules themselves are.
const QUIET_ZONE_MODULES = 4;

/**
 * Renders a QR code as a grid of plain <View> cells instead of an <Image>
 * or <Svg>. `qrcode-generator` is pure JS (just computes the light/dark
 * module matrix, no canvas/DOM involved), so this needs zero native
 * modules and zero extra dev-build rebuild — unlike react-native-svg-based
 * QR libraries, which would trigger the same kind of native rebuild noted
 * elsewhere in plan.md for camera/date-picker.
 */
export function QrCode({
  value,
  size = 200,
  foreground = '#14201a',
  background = '#fff'
}: QrCodeProps) {
  const code = qrcodeGenerator(0, 'M');
  code.addData(value);
  code.make();

  const moduleCount = code.getModuleCount();
  const totalModules = moduleCount + QUIET_ZONE_MODULES * 2;
  const cellSize = size / totalModules;
  const offset = QUIET_ZONE_MODULES * cellSize;

  return (
    <View style={{ width: size, height: size, backgroundColor: background }}>
      {Array.from({ length: moduleCount * moduleCount }).map((_, index) => {
        const row = Math.floor(index / moduleCount);
        const col = index % moduleCount;
        if (!code.isDark(row, col)) return null;

        // Absolutely positioned from pre-rounded pixel bounds, not flexWrap.
        // With a fractional cellSize, letting flex wrap rows on its own can
        // accumulate rounding error across a row and push a cell onto the
        // wrong line, silently corrupting the matrix. Computing each cell's
        // left/top from rounded totals (not accumulated per-cell rounding)
        // keeps every row and column exactly where the matrix says it is.
        const left = Math.round(offset + col * cellSize);
        const top = Math.round(offset + row * cellSize);
        const right = Math.round(offset + (col + 1) * cellSize);
        const bottom = Math.round(offset + (row + 1) * cellSize);

        return (
          <View
            key={`${row}-${col}`}
            style={{
              position: 'absolute',
              left,
              top,
              width: right - left,
              height: bottom - top,
              backgroundColor: foreground
            }}
          />
        );
      })}
    </View>
  );
}
