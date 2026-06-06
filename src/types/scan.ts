export type PigeonScanJson = {
  isPigeon: true;
  breed: string;
};

/** ハト以外の写真 */
export class NotPigeonError extends Error {
  constructor() {
    super('NOT_PIGEON');
    this.name = 'NotPigeonError';
  }
}

export function isNotPigeonError(error: unknown): error is NotPigeonError {
  return error instanceof NotPigeonError;
}
