import {
  Index,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { RecordStatus } from '@/common/enums';

import { Zone } from '@/modules/zone/entities';
import { User } from '@/modules/user/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { FamilyGroup } from '@/modules/family-group/entities';

@Entity({ name: 'churches' })
export class Church {
  //* General info
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('text', { name: 'church_name', unique: true })
  churchName: string;

  @Column('boolean', { name: 'is_anexe', default: false })
  isAnexe: boolean;

  @Column('text', { name: 'worship_times', array: true })
  worshipTimes: string[];

  @Column('date', { name: 'founding_date' })
  foundingDate: Date;

  //* Contact Info
  @Index()
  @Column('text', { name: 'email', unique: true, nullable: true })
  email: string;

  @Column('text', { name: 'phone_number', nullable: true })
  phoneNumber: string;

  @Column('text', { name: 'country', default: 'Peru' })
  country: string;

  @Column('text', { name: 'department', default: 'Lima' })
  department: string;

  @Column('text', { name: 'province', default: 'Lima' })
  province: string;

  @Index()
  @Column('text', { name: 'district' })
  district: string;

  @Index()
  @Column('text', { name: 'urban_sector' })
  urbanSector: string;

  @Index()
  @Column('text', { name: 'address' })
  address: string;

  @Column('text', { name: 'reference_address' })
  referenceAddress: string;

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

  //* Relations (Array)
  @OneToMany(() => Church, (church) => church.theirMainChurch)
  anexes: Church[];

  @OneToMany(() => Pastor, (pastor) => pastor.theirChurch)
  pastors: Pastor[];

  @OneToMany(() => Copastor, (copastor) => copastor.theirChurch)
  copastors: Copastor[];

  @OneToMany(() => Supervisor, (supervisor) => supervisor.theirChurch)
  supervisors: Supervisor[];

  @OneToMany(() => Preacher, (preacher) => preacher.theirChurch)
  preachers: Preacher[];

  @OneToMany(() => Zone, (zone) => zone.theirChurch)
  zones: Zone[];

  @OneToMany(() => FamilyGroup, (familyGroup) => familyGroup.theirChurch)
  familyGroups: FamilyGroup[];

  @OneToMany(() => Disciple, (disciple) => disciple.theirChurch)
  disciples: Disciple[];

  //* Relations(FK)
  @ManyToOne(() => Church, (church) => church.anexes, {
    nullable: true,
  })
  @JoinColumn({ name: 'their_main_church_id' })
  theirMainChurch: Church;
}
