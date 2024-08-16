import { Repository } from 'typeorm';
import { Pastor } from '@/modules/pastor/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Supervisor } from '@/modules/supervisor/entities';

export type RepositoryType =
  | Repository<Pastor>
  | Repository<Copastor>
  | Repository<Supervisor>
  | Repository<Preacher>
  | Repository<Disciple>;
