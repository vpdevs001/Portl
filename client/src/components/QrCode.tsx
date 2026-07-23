import { View } from 'react-native';
import qrcodeGenerator from 'qrcode-generator';

type QrCodeProps = {
  value: string;
  size?: number;
  foreground?: string;
  background?: string;
};

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
  const cellSize = size / moduleCount;

  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: background,
        flexDirection: 'row',
        flexWrap: 'wrap'
      }}
    >
      {Array.from({ length: moduleCount * moduleCount }).map((_, index) => {
        const row = Math.floor(index / moduleCount);
        const col = index % moduleCount;
        const isDark = code.isDark(row, col);

        return (
          <View
            key={`${row}-${col}`}
            style={{
              width: cellSize,
              height: cellSize,
              backgroundColor: isDark ? foreground : background
            }}
          />
        );
      })}
    </View>
  );
}
