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
import { Church } from '@/modules/church/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Supervisor } from '@/modules/supervisor/entities';

@Entity({ name: 'family_houses' })
export class FamilyHouse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  //General info
  @Column('text', { name: 'house_name', unique: true })
  houseName: string;

  @Column('text', { name: 'house_number' })
  houseNumber: string;

  @Column('text', { name: 'code_house', unique: true })
  codeHouse: string;

  @Column('text', { name: 'worship_time' })
  worshipTime: string;

  // Disciples amount who belong to the house
  @Column('int', { name: 'number_disciples', default: 0 })
  numberDisciples: number;

  // Contact Info
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

  @Column('text')
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
  @OneToMany(() => Disciple, (disciple) => disciple.theirFamilyHouse)
  disciples: Disciple[];

  // Relations(FK)
  @ManyToOne(() => Pastor, (pastor) => pastor.familyHouses)
  @JoinColumn({ name: 'their_pastor' })
  theirPastor: Pastor;

  @ManyToOne(() => Copastor, (copastor) => copastor.familyHouses)
  @JoinColumn({ name: 'their_copastor' })
  theirCopastor: Copastor;

  @ManyToOne(() => Supervisor, (supervisor) => supervisor.familyHouses)
  @JoinColumn({ name: 'their_supervisor' })
  theirSupervisor: Supervisor;

  @ManyToOne(() => Preacher, (preacher) => preacher.familyHouses)
  @JoinColumn({ name: 'their_preacher' })
  theirPreacher: Preacher;

  @ManyToOne(() => Zone, (zone) => zone.familyHouses)
  @JoinColumn({ name: 'their_zone' })
  theirZone: Zone;

  @ManyToOne(() => Church, (church) => church.familyHouses)
  @JoinColumn({ name: 'their_church' })
  theirChurch: Church;
}
