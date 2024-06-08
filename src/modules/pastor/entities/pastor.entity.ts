import {
  BeforeInsert,
  BeforeUpdate,
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
import { Copastor } from '@/modules/copastor/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Disciple } from '@/modules/disciple/entities/';
import { Supervisor } from '@/modules/supervisor/entities';
import { FamilyHouse } from '@/modules/family-house/entities';

@Entity({ name: 'pastors' })
@Index(['firstName', 'lastName'])
export class Pastor {
  //General and Personal info
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('text', { name: 'first_name' })
  firstName: string;

  @Index()
  @Column('text', { name: 'last_name' })
  lastName: string;

  @Column('text', { name: 'gender' })
  gender: string;

  @Column('text', { name: 'origin_country' })
  originCountry: string;

  @Index()
  @Column('date', { name: 'date_birth' })
  dateBirth: Date;

  @Column('int', { name: 'age' })
  age: number;

  @Index()
  @Column('text', { name: 'marital_status' })
  maritalStatus: string;

  @Column('int', { name: 'number_children', default: 0 })
  numberChildren: number;

  @Column('date', { name: 'conversion_date' })
  conversionDate: Date;

  // Contact Info
  @Index()
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

  @Index()
  @Column('text', { name: 'district_residence' })
  districtResidence: string;

  @Index()
  @Column('text', { name: 'urban_sector_residence' })
  urbanSectorResidence: string;

  @Index()
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

  @Column('text', { default: Status.Active })
  status: string;

  //* Relations (Array)
  @OneToMany(() => Copastor, (copastor) => copastor.theirPastor)
  copastors: Copastor[];

  @OneToMany(() => Supervisor, (supervisor) => supervisor.theirPastor)
  supervisors: Supervisor[];

  @OneToMany(() => Preacher, (preacher) => preacher.theirPastor)
  preachers: Preacher[];

  @OneToMany(() => Zone, (zone) => zone.theirPastor)
  zones: Zone[];

  @OneToMany(() => FamilyHouse, (familyHouse) => familyHouse.theirPastor)
  familyHouses: FamilyHouse[];

  @OneToMany(() => Disciple, (disciple) => disciple.theirPastor)
  disciples: Disciple[];

  //* Relations(FK);
  @ManyToOne(() => Church, (church) => church.pastors)
  @JoinColumn({ name: 'their_church_id' })
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
