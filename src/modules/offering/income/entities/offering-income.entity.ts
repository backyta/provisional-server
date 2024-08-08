import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { RecordStatus } from '@/common/enums';

import { Zone } from '@/modules/zone/entities';
import { User } from '@/modules/user/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { FamilyGroup } from '@/modules/family-group/entities';

@Entity({ name: 'offerings_income' })
@Index(['type', 'subType'])
export class OfferingIncome {
  //* General data
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  type: string;

  @Index()
  @Column('text', { name: 'sub_type', nullable: true })
  subType: string;

  @Column('decimal')
  amount: number;

  @Column('text')
  currency: string;

  @Column('text', { name: 'comments', nullable: true })
  comments: string;

  @Index()
  @Column('date', { name: 'date' })
  date: Date;

  @Column('text', { name: 'image_urls', array: true })
  imageUrls: string[];

  @Column('text', { name: 'shift', nullable: true })
  shift: string;

  @Column('text', { name: 'reason_elimination', nullable: true })
  reasonElimination: string;

  //* Info register and update date
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

  @Column('text', {
    name: 'record_status',
    default: RecordStatus.Active,
  })
  recordStatus: string;

  @Column('text', { name: 'member_type', nullable: true })
  memberType: string;

  //* Relations (FK)
  // Family House
  @ManyToOne(() => FamilyGroup, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'family_group_id' })
  familyGroup: FamilyGroup;

  // Member
  // NOTE : agregar en cada entidad que al subir de nivel se elimina pero se coloca el nuevo en todos los registros que tenia el anterior ID.
  @ManyToOne(() => Pastor, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'pastor_id' })
  pastor: Pastor;

  @ManyToOne(() => Copastor, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'copastor_id' })
  copastor: Copastor;

  @ManyToOne(() => Supervisor, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'supervisor_id' })
  supervisor: Supervisor;

  @ManyToOne(() => Preacher, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'preacher_id' })
  preacher: Preacher;

  @ManyToOne(() => Disciple, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'disciple_id' })
  disciple: Disciple;

  // Zone
  @ManyToOne(() => Zone, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'zone_id' })
  zone: Zone;
}
