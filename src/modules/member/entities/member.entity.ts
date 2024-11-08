import {
  Index,
  Column,
  Entity,
  BeforeInsert,
  BeforeUpdate,
  PrimaryGeneratedColumn,
} from 'typeorm';

//NOTE : crear indices o en las entitades especiales.
@Entity({ name: 'members' })
@Index(['firstName', 'lastName'])
export class Member {
  //* General and personal info
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
  @Column('date', { name: 'birth_date' })
  birthDate: Date;

  @Column('int', { name: 'age' })
  age: number;

  @Index()
  @Column('text', { name: 'marital_status' })
  maritalStatus: string;

  @Column('int', { name: 'number_children', default: 0 })
  numberChildren: number;

  @Column('date', { name: 'conversion_date' })
  conversionDate: Date;

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

  @Column({ name: 'roles', type: 'text', array: true })
  roles: string[];

  //? Internal Functions
  @BeforeInsert()
  @BeforeUpdate()
  transformToDates() {
    this.birthDate = new Date(this.birthDate);
    this.conversionDate = new Date(this.conversionDate);

    // Generate age with birth date
    const ageMiliSeconds = Date.now() - this.birthDate.getTime();

    const ageDate = new Date(ageMiliSeconds);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);

    this.age = age;
  }
}
