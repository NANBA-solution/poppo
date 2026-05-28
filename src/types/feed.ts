export type StampId = 'kuruppo' | 'hohoho' | 'gerogero' | 'peewee' | 'bododo' | 'gugu';

export type FeedStamp = {
  id: StampId;
  label: string;
  sound: string;
};

export type FeedPost = {
  id: string;
  stampId: StampId;
  stampLabel: string;
  authorName: string;
  avatarId: string;
  breed: string | null;
  nickname: string | null;
  imageUri: string | null;
  createdAt: string;
  isMine: boolean;
};
