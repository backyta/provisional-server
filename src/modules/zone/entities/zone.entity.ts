import {
  Column,
  Entity,
  Index,
  OneToOne,
  ManyToOne,
  OneToMany,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { RecordStatus } from '@/common/enums';

import { User } from '@/modules/user/entities';
import { Church } from '@/modules/church/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { FamilyGroup } from '@/modules/family-group/entities';

@Entity({ name: 'zones' })
export class Zone {
  //* General info
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('text', { name: 'zone_name' })
  zoneName: string;

  @Column('text', { name: 'country', default: 'Peru' })
  country: string;

  @Column('text', { name: 'department', default: 'Lima' })
  department: string;

  @Column('text', { name: 'province', default: 'Lima' })
  province: string;

  @Index()
  @Column('text', { name: 'district' })
  district: string;

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

  //* Relations (Array)
  @OneToMany(() => Preacher, (preacher) => preacher.theirZone)
  preachers: Preacher[];

  @OneToMany(() => FamilyGroup, (familyGroup) => familyGroup.theirZone)
  familyGroups: FamilyGroup[];

  @OneToMany(() => Disciple, (disciple) => disciple.theirZone)
  disciples: Disciple[];

  //* Relation (FK)
  @ManyToOne(() => Pastor, (pastor) => pastor.zones)
  @JoinColumn({ name: 'their_pastor_id' })
  theirPastor: Pastor;

  @ManyToOne(() => Copastor, (copastor) => copastor.zones, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'their_copastor_id' })
  theirCopastor: Copastor;

  @ManyToOne(() => Church, (church) => church.zones)
  @JoinColumn({ name: 'their_church_id' })
  theirChurch: Church;

  @OneToOne(() => Supervisor, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'their_supervisor_id' })
  theirSupervisor: Supervisor;
}
