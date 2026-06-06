import { playPigeonTab } from '@/utils/pigeonSound';
import { useRouter, type Href } from 'expo-router';
import * as React from 'react';

/** 画面遷移時に鳩の鳴き声を鳴らす router ラッパー */
export function useTabRouter() {
  const router = useRouter();

  return React.useMemo(
    () => ({
      ...router,
      push: (href: Href) => {
        void playPigeonTab();
        router.push(href);
      },
      replace: (href: Href) => {
        void playPigeonTab();
        router.replace(href);
      },
      back: () => {
        void playPigeonTab();
        router.back();
      },
    }),
    [router],
  );
}
