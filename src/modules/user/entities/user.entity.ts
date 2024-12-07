import { RecordStatus } from '@/common/enums';
import {
  Index,
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  BeforeUpdate,
  BeforeInsert,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'users' })
@Index(['firstName', 'lastName'])
export class User {
  //* General info
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('text')
  firstName: string;

  @Index()
  @Column('text')
  lastName: string;

  @Index()
  @Column('text')
  gender: string;

  @Index()
  @Column('text', { unique: true })
  email: string;

  @Column('text', { select: false })
  password: string;

  @Column('text', { array: true, default: ['user'] })
  roles: string[];

  //* Info register and update date
  @Column('timestamptz', { name: 'created_at', nullable: true })
  createdAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column('timestamptz', { name: 'updated_at', nullable: true })
  updatedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User;

  @Column('text', { name: 'inactivation_category', nullable: true })
  inactivationCategory: string;

  @Column('text', { name: 'inactivation_reason', nullable: true })
  inactivationReason: string;

  @Column('text', {
    name: 'record_status',
    default: RecordStatus.Active,
  })
  recordStatus: string;

  //? Internal Functions
  @BeforeInsert()
  checkFieldsBeforeInsert() {
    this.email = this.email.toLowerCase().trim();
  }

  @BeforeUpdate()
  checkFieldsBeforeUpdate() {
    this.checkFieldsBeforeInsert();
  }
}
