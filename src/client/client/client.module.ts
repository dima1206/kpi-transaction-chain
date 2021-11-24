import { Global, Module } from '@nestjs/common';
import { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import * as fs from 'fs';

const keysData = fs.readFileSync(process.cwd() + '/keys.json');
const keys = JSON.parse(keysData.toString());
const SECRET = keys[process.env.SECRET];

console.log(SECRET);

@Global()
@Module({
  providers: [
    {
      provide: Socket,
      useValue: io(process.env.SERVER_HOST || 'http://localhost:3000', {
        transports: ['websocket'],
        query: { secret: SECRET || 'UNKNOWN' },
      }),
    },
  ],
  exports: [Socket],
})
export class ClientModule {}
