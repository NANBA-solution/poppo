import { Redirect } from 'expo-router';

/** ログイン機能は廃止。旧ルートからカメラへリダイレクト */
export default function AuthRedirect() {
  return <Redirect href="/camera" />;
}
