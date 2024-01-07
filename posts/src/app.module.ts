import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsModule } from './posts/posts.module';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('POSTGRES_HOST'),
        port: +configService.get('POSTGRES_PORT'),
        username: configService.get('POSTGRES_USER'),
        password: configService.get('POSTGRES_PASSWORD'),
        database: configService.get('POSTGRES_DB'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    ClientsModule.registerAsync({
      isGlobal: true,
      clients: [
        {
          name: 'INDEX_SERVICE',
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: 'posts',
                brokers: configService.get<string>('KAFKA_BROKERS').split(','),
              },
              consumer: {
                groupId: 'kafka-microservices',
              },
            },
          }),
        },
      ],
    }),
    PostsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
