import {
  Column,
  Entity,
  Index,
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
  @Index()
  @Column('text', { name: 'house_name', unique: true })
  houseName: string;

  @Column('text', { name: 'house_number' })
  houseNumber: string;

  @Index()
  @Column('text', { name: 'code_house', unique: true })
  codeHouse: string;

  @Column('text', { name: 'worship_time' })
  worshipTime: string;

  // Contact Info
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
  @Column('text')
  address: string;

  @Column('text', { name: 'reference_address' })
  referenceAddress: string;

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

  // Disciples amount who belong to the house
  @Column('int', { name: 'number_disciples', default: 0 })
  numberDisciples: number;

  //* Relations (Array)
  @OneToMany(() => Disciple, (disciple) => disciple.theirFamilyHouse)
  disciples: Disciple[];

  //* Relations(FK)
  @ManyToOne(() => Church, (church) => church.familyHouses, {
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'their_church_id' })
  theirChurch: Church;

  @ManyToOne(() => Pastor, (pastor) => pastor.familyHouses, {
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'their_pastor_id' })
  theirPastor: Pastor;

  @ManyToOne(() => Copastor, (copastor) => copastor.familyHouses, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'their_copastor_id' })
  theirCopastor: Copastor;

  @ManyToOne(() => Supervisor, (supervisor) => supervisor.familyHouses, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'their_supervisor_id' })
  theirSupervisor: Supervisor;

  @ManyToOne(() => Preacher, (preacher) => preacher.familyHouses, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'their_preacher_id' })
  theirPreacher: Preacher;

  @ManyToOne(() => Zone, (zone) => zone.familyHouses, {
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'their_zone_id' })
  theirZone: Zone;
}
