import { StyleSheet, View, ViewProps, ScrollView } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';

export interface ScreenProps extends ViewProps {
  scroll?: boolean;
  edges?: Edge[];
}

export function Screen({ scroll = false, edges = ['top', 'bottom'], style, children, ...rest }: ScreenProps) {
  const Container = scroll ? ScrollView : View;

  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      <Container style={[styles.content, style]} {...rest}>
        {children}
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
});
