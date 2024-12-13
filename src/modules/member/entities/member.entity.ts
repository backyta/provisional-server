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
@Index(['firstNames', 'lastNames'])
export class Member {
  //* General and personal info
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('text', { name: 'first_names' })
  firstNames: string;

  @Index()
  @Column('text', { name: 'last_names' })
  lastNames: string;

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

  @Column('text', { name: 'residence_country', default: 'Peru' })
  residenceCountry: string;

  @Column('text', { name: 'residence_department', default: 'Lima' })
  residenceDepartment: string;

  @Column('text', { name: 'residence_province', default: 'Lima' })
  residenceProvince: string;

  @Index()
  @Column('text', { name: 'residence_district' })
  residenceDistrict: string;

  @Index()
  @Column('text', { name: 'residence_urban_sector' })
  residenceUrbanSector: string;

  @Index()
  @Column('text', { name: 'residence_address' })
  residenceAddress: string;

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
