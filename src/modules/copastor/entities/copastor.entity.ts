import {
  Column,
  Entity,
  OneToOne,
  ManyToOne,
  OneToMany,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { RecordStatus } from '@/common/enums';

import { Zone } from '@/modules/zone/entities';
import { User } from '@/modules/user/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Member } from '@/modules/member/entities';
import { Church } from '@/modules/church/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { FamilyGroup } from '@/modules/family-group/entities';

@Entity({ name: 'copastors' })
export class Copastor {
  //* General and Personal info
  @PrimaryGeneratedColumn('uuid')
  id: string;

  //* Relations with member
  @OneToOne(() => Member, {})
  @JoinColumn({ name: 'member_id' })
  member: Member;

  //* Info register and update date
  @Column('timestamptz', { name: 'created_at', nullable: true })
  createdAt: Date;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column('timestamptz', { name: 'updated_at', nullable: true })
  updatedAt: Date;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User;

  @Column('text', { name: 'inactivation_category', nullable: true })
  inactivationCategory: string;

  @Column('text', { name: 'inactivation_reason', nullable: true })
  inactivationReason: string;

  @Column('text', {
    name: 'record_status',
    default: RecordStatus.Active,
  })
  recordStatus: string;

  //? Relations (Array)
  @OneToMany(() => Supervisor, (supervisor) => supervisor.theirCopastor)
  supervisors: Supervisor[];

  @OneToMany(() => Preacher, (preacher) => preacher.theirCopastor)
  preachers: Preacher[];

  @OneToMany(() => Zone, (zone) => zone.theirCopastor)
  zones: Zone[];

  @OneToMany(() => FamilyGroup, (familyGroup) => familyGroup.theirCopastor)
  familyGroups: FamilyGroup[];

  @OneToMany(() => Disciple, (disciple) => disciple.theirCopastor)
  disciples: Disciple[];

  //? Relations(FK);
  @ManyToOne(() => Pastor, (pastor) => pastor.copastors)
  @JoinColumn({ name: 'their_pastor_id' })
  theirPastor: Pastor;

  @ManyToOne(() => Church, (church) => church.copastors)
  @JoinColumn({ name: 'their_church_id' })
  theirChurch: Church;
}
