import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform, UIManager } from 'react-native';

const SVG_VIEW_MANAGERS = ['RNSVGSvgView', 'RNSVGPath', 'RNSVGGroup', 'RNSVGCircle'] as const;

function hasViewManager(name: string): boolean {
  if (Platform.OS === 'web') return false;
  try {
    if (typeof UIManager.getViewManagerConfig === 'function') {
      return UIManager.getViewManagerConfig(name) != null;
    }
    if (typeof UIManager.hasViewManagerConfig === 'function') {
      return UIManager.hasViewManagerConfig(name);
    }
  } catch {
    return false;
  }
  return false;
}

/** iOS SwiftUI アイコン（PoppoIcons ローカルモジュール）が同梱されているか */
export function isPoppoIconsNativeAvailable(): boolean {
  if (Platform.OS !== 'ios') {
    return false;
  }
  return requireOptionalNativeModule('PoppoIcons') != null;
}

/** react-native-svg が dev client に同梱されているか */
export function isSvgNativeAvailable(): boolean {
  if (Platform.OS === 'web') return true;
  return SVG_VIEW_MANAGERS.some((name) => hasViewManager(name));
}

/** expo-camera が dev client に同梱されているか */
export function isExpoCameraNativeAvailable(): boolean {
  return requireOptionalNativeModule('ExpoCamera') != null;
}
