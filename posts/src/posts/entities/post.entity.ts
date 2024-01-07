import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  content: string;

  @Column()
  author: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  publishedDate: number;
}
