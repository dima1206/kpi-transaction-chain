import * as crypto from 'crypto';

export default {
  hash: (data: string) => {
    return crypto.createHash('sha256').update(data).digest('hex');
  },
};
