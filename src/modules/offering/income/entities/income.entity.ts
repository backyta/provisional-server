import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { RecordStatus } from '@/common/enums';

import { Zone } from '@/modules/zone/entities';
import { User } from '@/modules/user/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { FamilyGroup } from '@/modules/family-group/entities';

//TODO : seguir con la semilla , revisar antes si al crear se setea en los [] de las relaciones opuestas
// NOTE : Al momento hacer la consultas ver los indices agregar
@Entity({ name: 'offerings_income' })
@Index(['type', 'subType'])
export class Income {
  //* General data
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  type: string;

  @Index()
  @Column('text', { name: 'sub_type', nullable: true })
  subType: string;

  @Column('int')
  amount: number;

  @Column('text')
  currency: string;

  @Column('text', { nullable: true })
  comments: string;

  @Index()
  @Column('date', { name: 'date' })
  date: Date;

  @Column('text', { name: 'url_files', nullable: true })
  urlFiles: string;

  @Column('text', { name: 'reason_elimination', nullable: true })
  reasonElimination: string;

  @Column('text', { name: 'shift', nullable: true })
  shift: string;

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

  //* Relations (FK)
  // NOTE : la casa no se elimina solo se desactiva por el momento y se actualiza su info
  // Family House
  @ManyToOne(() => FamilyGroup, {
    nullable: true,
    eager: true,
    onDelete: 'SET NULL',
    // onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'their_family_group_id' })
  theirFamilyGroup: FamilyGroup;

  // Tithe or special or ground church
  // NOTE : agregar en cada entidad que al subir de nivel se elimina pero se coloca el nuevo en todos los registros que tenia el anterior ID.
  @ManyToOne(() => Disciple, {
    nullable: true,
    eager: true,
    onDelete: 'SET NULL',
    // onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'their_contributor_id' })
  theirContributor: Disciple | Preacher | Supervisor | Copastor | Pastor;

  // Income ayuno zonal or vigil zonal (zone)
  // NOTE : la zona no se debe eliminar ni desactivar, solo actualizar el nombre o super o distrito o hasta provincia (ver)
  @ManyToOne(() => Zone, {
    nullable: true,
    eager: true,
    onDelete: 'SET NULL',
    // onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'their_zone_id' })
  theirZone: Zone;
}
