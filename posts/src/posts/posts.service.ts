import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientKafka } from '@nestjs/microservices';
import { Kafka } from 'kafkajs';

@Injectable()
export class PostsService implements OnModuleInit {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @Inject('INDEX_SERVICE')
    private indexService: ClientKafka,
  ) {}

  async onModuleInit() {
    this.indexService.subscribeToResponseOf('index');
    const kafka = new Kafka({
      clientId: 'my-app',
      brokers: ['localhost:9092'],
    });
    const admin = kafka.admin();
    const topics = await admin.listTopics();

    const topicList = [];
    if (!topics.includes('index')) {
      topicList.push({
        topic: 'index',
        numPartitions: 10,
        replicationFactor: 1,
      });
    }

    if (topicList.length) {
      await admin.createTopics({
        topics: topicList,
      });
    }
  }

  async create(createPostDto: CreatePostDto) {
    const newPost = this.postRepository.create(createPostDto);
    await this.postRepository.save(newPost);
    this.indexService
      .send('index', JSON.stringify({ ...newPost, index: 'posts' }))
      .subscribe();
    return newPost;
  }

  async findAll() {
    return await this.postRepository.find();
  }

  async findOne(id: string) {
    return await this.postRepository.findOne({ where: { id } });
  }

  async update(id: string, updatePostDto: UpdatePostDto) {
    await this.postRepository.update({ id }, updatePostDto);
  }

  async remove(id: string) {
    await this.postRepository.delete({ id });
  }
}
