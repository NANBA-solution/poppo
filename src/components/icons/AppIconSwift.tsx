import type { AppIconProps } from '@/components/icons/types';
import * as React from 'react';

type SwiftIconRenderer = React.ComponentType<AppIconProps>;

let renderer: SwiftIconRenderer | null | undefined;

function getSwiftIconRenderer(): SwiftIconRenderer | null {
  if (renderer !== undefined) {
    return renderer;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    renderer = require('poppo-icons').PoppoIconView as SwiftIconRenderer;
  } catch {
    renderer = null;
  }
  return renderer;
}

/** iOS SwiftUI アイコン（PoppoIcons モジュール同梱時） */
export function AppIconSwift(props: AppIconProps) {
  const Renderer = getSwiftIconRenderer();
  if (!Renderer) {
    return null;
  }
  return <Renderer {...props} />;
}
