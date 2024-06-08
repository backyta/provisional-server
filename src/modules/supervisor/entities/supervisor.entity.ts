import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Status } from '@/common/enums';

import { Zone } from '@/modules/zone/entities';
import { User } from '@/modules/user/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Church } from '@/modules/church/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Preacher } from '@/modules/preacher/entities';
import { FamilyHouse } from '@/modules/family-house/entities';
// TODO : los supervisores tmb se podrán ligar directamente al pastor, ya que si se crea un anexo
// Habrán un pastor y no hay copastor los supervisores se encargaran de las casas, se podría mandar
// un copastor como entrenamiento o apoyo a esa zona y este copastor apoyaría a los supervisores.
// este copastor englobaría a los supervisores y al pastor y se enlaza directo al pastor.

// TODO : hacer un valor true o false para poder asignar un theirPastor directo al supervisor
@Entity({ name: 'supervisors' })
@Index(['firstName', 'lastName'])
export class Supervisor {
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

  @Column('boolean', {
    name: 'is_direct_relation_to_pastor',
    default: false,
  })
  isDirectRelationToPastor: boolean;

  //* Relations (Array)
  @OneToMany(() => Preacher, (preacher) => preacher.theirSupervisor)
  preachers: Preacher[];

  @OneToMany(() => FamilyHouse, (familyHouse) => familyHouse.theirSupervisor)
  familyHouses: FamilyHouse[];

  @OneToMany(() => Disciple, (disciple) => disciple.theirSupervisor)
  disciples: Disciple[];

  //* Relations (FK)
  @ManyToOne(() => Church, (church) => church.supervisors, {
    // eager: true,
  })
  @JoinColumn({ name: 'their_church_id' })
  theirChurch: Church;

  @ManyToOne(() => Pastor, (pastor) => pastor.supervisors, {
    // eager: true,
  })
  @JoinColumn({ name: 'their_pastor_id' })
  theirPastor: Pastor;

  @ManyToOne(() => Copastor, (copastor) => copastor.supervisors, {
    onDelete: 'SET NULL',
    // eager: true,
  })
  @JoinColumn({ name: 'their_copastor_id' })
  theirCopastor: Copastor;

  @OneToOne(() => Zone, {
    // eager: true,
  })
  @JoinColumn({ name: 'their_zone_id' })
  theirZone: Zone;

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
