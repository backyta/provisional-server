import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Status } from '@/common/enums';

import { User } from '@/modules/user/entities';
import { Church } from '@/modules/church/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { FamilyHouse } from '@/modules/family-house/entities';

@Entity({ name: 'zones' })
export class Zone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  //General info
  @Column('text', { name: 'zone_name', unique: true })
  zoneName: string;

  @Column('text', { name: 'country', default: 'Peru' })
  country: string;

  @Column('text', { name: 'department', default: 'Lima' })
  department: string;

  @Column('text', { name: 'province', default: 'Lima' })
  province: string;

  @Column('text', { name: 'district' })
  district: string;

  // Roles amount under their charge
  @Column('int', { name: 'number_preachers', default: 0 })
  numberPreachers: number;

  @Column('int', { name: 'number_family_houses', default: 0 })
  numberFamilyHouses: number;

  @Column('int', { name: 'number_disciples', default: 0 })
  numberDisciples: number;

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

  @Column('text', { default: Status.Active })
  status: string;

  // Relations (Array)
  @OneToMany(() => Preacher, (preacher) => preacher.theirZone)
  preachers: Preacher[];

  @OneToMany(() => FamilyHouse, (familyHouse) => familyHouse.theirZone)
  familyHouses: FamilyHouse[];

  @OneToMany(() => Disciple, (disciple) => disciple.theirZone)
  disciples: Disciple[];

  // Relation (FK)
  @ManyToOne(() => Pastor, (pastor) => pastor.zones)
  @JoinColumn({ name: 'their_pastor' })
  theirPastor: Pastor;

  @ManyToOne(() => Copastor, (copastor) => copastor.zones)
  @JoinColumn({ name: 'their_copastor' })
  theirCopastor: Copastor;

  @ManyToOne(() => Church, (church) => church.zones)
  @JoinColumn({ name: 'their_church' })
  theirChurch: Church;

  @OneToOne(() => Supervisor)
  @JoinColumn({ name: 'their_supervisor' })
  theirSupervisor: Supervisor;
}
