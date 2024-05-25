import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Status } from '@/common/enums';

import { Zone } from '@/modules/zone/entities';
import { User } from '@/modules/user/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { FamilyHouse } from '@/modules/family-house/entities';

@Entity({ name: 'church' })
export class Church {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  //General info
  @Column('text', { name: 'church_name', unique: true })
  churchName: string;

  @Column('boolean', { name: 'is_anexe', default: false })
  isAnexe: boolean;

  @Column('text', { name: 'worship_times', array: true })
  worshipTimes: string[];

  @Column('date', { name: 'founding_date' })
  foundingDate: Date;

  // Roles amount under their charge
  @Column('int', { name: 'number_anexes', default: 0 })
  numberAnexes: number;

  @Column('int', { name: 'number_pastors', default: 0 })
  numberPastors: number;

  @Column('int', { name: 'number_copastors', default: 0 })
  numberCopastors: number;

  @Column('int', { name: 'number_supervisors', default: 0 })
  numberSupervisors: number;

  @Column('int', { name: 'number_preachers', default: 0 })
  numberPreachers: number;

  @Column('int', { name: 'number_zones', default: 0 })
  numberZones: number;

  @Column('int', { name: 'number_family_houses', default: 0 })
  numberFamilyHouses: number;

  @Column('int', { name: 'number_disciples', default: 0 })
  numberDisciples: number;

  // Contact Info
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

  @Column('text', { name: 'district' })
  district: string;

  @Column('text', { name: 'urban_sector' })
  urbanSector: string;

  @Column('text', { name: 'address' })
  address: string;

  @Column('text', { name: 'reference_address' })
  referenceAddress: string;

  // Info register and update date
  @Column('timestamp', { name: 'created_at', nullable: true })
  createdAt: string | Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column('timestamp', { name: 'updated_at', nullable: true })
  updatedAt: string | Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User;

  @Column('text', { name: 'status', default: Status.Active })
  status: string;

  // Relations (Array)
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

  @OneToMany(() => FamilyHouse, (familyHouse) => familyHouse.theirChurch)
  familyHouses: FamilyHouse[];

  @OneToMany(() => Disciple, (disciple) => disciple.theirChurch)
  disciples: Disciple[];

  // Relations(FK)
  @ManyToOne(() => Church, (church) => church.anexes, { nullable: true })
  @JoinColumn({ name: 'their_main_church' })
  theirMainChurch: Church;
}
