import { Socket } from 'socket.io-client';
import { Global, Module } from '@nestjs/common';
import { io } from 'socket.io-client';

@Global()
@Module({
  providers: [
    {
      provide: Socket,
      useValue: io('http://localhost:3000', {
        transports: ['websocket'],
        query: { secret: process.env.SECRET || 'UNKNOWN' },
      }),
    },
  ],
  exports: [Socket],
})
export class ClientModule {}
