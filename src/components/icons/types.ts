export type IconName =
  | 'pigeon'
  | 'camera'
  | 'brain'
  | 'book'
  | 'feed'
  | 'settings'
  | 'trophy'
  | 'heart'
  | 'heart-outline'
  | 'flash'
  | 'flash-auto'
  | 'chevron-right'
  | 'chevron-left'
  | 'instagram'
  | 'x-logo'
  | 'egg'
  | 'bird'
  | 'moon'
  | 'sparkle'
  | 'search'
  | 'crown'
  | 'check'
  | 'report'
  | 'target'
  | 'sound';

export type AppIconProps = {
  name: IconName;
  size?: number;
  color?: string;
};
