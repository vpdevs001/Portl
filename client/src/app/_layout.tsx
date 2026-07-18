import { Stack } from 'expo-router';
import { QueryProvider } from '@/components/providers/query-provider';

import './global.css';

export default function RootLayout() {
  return (
    <QueryProvider>
      <Stack />
    </QueryProvider>
  );
}
