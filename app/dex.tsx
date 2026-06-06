import { Redirect } from 'expo-router';

/** 旧ルート互換: /dex → /collection */
export default function DexRedirect() {
  return <Redirect href="/collection" />;
}
