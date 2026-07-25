import { KeyboardAvoidingView, Platform, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Edge = 'top' | 'bottom' | 'left' | 'right';

type ScreenProps = ViewProps & {
  className?: string;
  edges?: Edge[];
};

/**
 * Full-screen root for tab/stack routes.
 *
 * Uses react-native KeyboardAvoidingView (Uniwind className support) plus
 * manual inset padding — SafeAreaView from react-native-safe-area-context is
 * a third-party component and does not receive Uniwind styles, so flex-1
 * never applied and tab scenes collapsed to blank.
 *
 * KeyboardAvoidingView is used (instead of plain View) so every screen built
 * on top of Screen automatically shifts its content out from under the
 * keyboard — forms whose fields sit near the bottom no longer get hidden
 * behind the keyboard when focused. Headers are hidden app-wide (see
 * app/_layout.tsx), so no extra keyboardVerticalOffset is needed.
 */
export function Screen({
  className = 'flex-1 bg-background',
  edges = ['top'],
  style,
  children,
  ...props
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={className}
      style={[
        {
          paddingTop: edges.includes('top') ? insets.top : 0,
          paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
          paddingLeft: edges.includes('left') ? insets.left : 0,
          paddingRight: edges.includes('right') ? insets.right : 0
        },
        style
      ]}
      {...props}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
