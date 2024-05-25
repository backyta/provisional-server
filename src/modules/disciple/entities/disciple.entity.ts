import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Status } from '@/common/enums';

import { Zone } from '@/modules/zone/entities';
import { User } from '@/modules/user/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Church } from '@/modules/church/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { FamilyHouse } from '@/modules/family-house/entities';

@Entity({ name: 'disciples' })
export class Disciple {
  //General and Personal info
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'first_name' })
  firstName: string;

  @Column('text', { name: 'last_name' })
  lastName: string;

  @Column('text', { name: 'gender' })
  gender: string;

  @Column('text', { name: 'origin_country' })
  originCountry: string;

  @Column('date', { name: 'date_birth' })
  dateBirth: Date;

  @Column('int', { name: 'age' })
  age: number;

  @Column('text', { name: 'marital_status' })
  maritalStatus: string;

  @Column('int', { name: 'number_children', default: 0 })
  numberChildren: number;

  @Column('date', { name: 'conversion_date' })
  conversionDate: Date;

  // Contact Info
  @Column('text', { name: 'email', unique: true, nullable: true })
  email: string;

  @Column('text', { name: 'phone_number', nullable: true })
  phoneNumber: string;

  @Column('text', { name: 'country_residence', default: 'Peru' })
  countryResidence: string;

  @Column('text', { name: 'department_residence', default: 'Lima' })
  departmentResidence: string;

  @Column('text', { name: 'province_residence', default: 'Lima' })
  provinceResidence: string;

  @Column('text', { name: 'district_residence' })
  districtResidence: string;

  @Column('text', { name: 'urban_sector_residence' })
  urbanSectorResidence: string;

  @Column('text', { name: 'address_residence' })
  addressResidence: string;

  @Column('text', { name: 'address_residence_reference' })
  addressResidenceReference: string;

  @Column({ name: 'roles', type: 'text', array: true })
  roles: string[];

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

  // Relations (FK)
  @ManyToOne(() => FamilyHouse, (familyHouse) => familyHouse.disciples)
  @JoinColumn({ name: 'their_family_house' })
  theirFamilyHouse: FamilyHouse;

  @ManyToOne(() => Pastor, (pastor) => pastor.disciples)
  @JoinColumn({ name: 'their_pastor' })
  theirPastor: Pastor;

  @ManyToOne(() => Copastor, (copastor) => copastor.disciples)
  @JoinColumn({ name: 'their_copastor' })
  theirCopastor: Copastor;

  @ManyToOne(() => Preacher, (preacher) => preacher.disciples)
  @JoinColumn({ name: 'their_preacher' })
  theirPreacher: Preacher;

  @ManyToOne(() => Supervisor, (supervisor) => supervisor.disciples)
  @JoinColumn({ name: 'their_supervisor' })
  theirSupervisor: Supervisor;

  @ManyToOne(() => Zone, (zone) => zone.disciples)
  @JoinColumn({ name: 'their_zone' })
  theirZone: Zone;

  @ManyToOne(() => Church, (church) => church.disciples)
  @JoinColumn({ name: 'their_church' })
  theirChurch: Church;

  // Internal Functions
  @BeforeInsert()
  @BeforeUpdate()
  transformToDates() {
    this.dateBirth = new Date(this.dateBirth);
    this.conversionDate = new Date(this.conversionDate);

    // Generate age with date_birth
    const ageMiliSeconds = Date.now() - this.dateBirth.getTime();

    const ageDate = new Date(ageMiliSeconds);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);

    this.age = age;
  }
}
