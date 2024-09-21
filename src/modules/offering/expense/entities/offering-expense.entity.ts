import {
  Index,
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { RecordStatus } from '@/common/enums';

import { User } from '@/modules/user/entities';
import { Church } from '@/modules/church/entities';

@Entity({ name: 'offerings_expenses' })
@Index(['type', 'subType'])
export class OfferingExpense {
  //* General data
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  type: string;

  @Column('text', { name: 'sub_type', nullable: true })
  subType: string;

  @Column('decimal')
  amount: number;

  @Column('text')
  currency: string;

  @Column('text', { name: 'comments', nullable: true })
  comments: string;

  @Column('date', { name: 'date' })
  date: Date;

  @Column('text', { name: 'image_urls', array: true })
  imageUrls: string[];

  @Column('text', { name: 'reason_elimination', nullable: true })
  reasonElimination: string;

  //* Info register and update date
  @Column('timestamptz', { name: 'created_at', nullable: true })
  createdAt: Date;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column('timestamptz', { name: 'updated_at', nullable: true })
  updatedAt: Date;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User;

  @Column('text', {
    name: 'record_status',
    default: RecordStatus.Active,
  })
  recordStatus: string;

  //* Relations (FK)
  // Church
  @ManyToOne(() => Church, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'church_id' })
  church: Church;
}