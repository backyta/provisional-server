import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '@/modules/user/entities';
import { Status } from '@/common/enums';

@Entity({ name: 'offerings_expense' })
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // General data
  @Column('text')
  type: string;

  @Column('text', { name: 'sub_type', nullable: true })
  subType: string;

  @Column('int')
  amount: number;

  @Column('text')
  currency: string;

  @Column('text', { nullable: true })
  comments: string;

  @Column('date', { name: 'date' })
  date: Date;

  @Column('text', { name: 'url_files', nullable: true })
  urlFiles: string;

  @Column('text', { name: 'reason_elimination', nullable: true })
  reasonElimination: string;

  // Info register and update date
  @Column('timestamp', { name: 'created_at', nullable: true })
  createdAt: string | Date;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column('timestamp', { name: 'updated_at', nullable: true })
  updatedAt: string | Date;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User;

  @Column('text', { name: 'status', default: Status.Active })
  status: string;
}
