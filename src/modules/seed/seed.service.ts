import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Pastor } from '@/modules/pastor/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Preacher } from '@/modules/preacher/entities';
import { FamilyHouse } from '@/modules/family-house/entities';
import { Disciple } from '@/modules/disciple/entities/';
import { User } from '@/modules/user/entities';
import { Repository } from 'typeorm';
import { DiscipleService } from '@/modules/disciple/disciple.service';
import { FamilyHouseService } from '@/modules/family-house/family-house.service';
import { ChurchService } from '@/modules/church/church.service';
import { PastorService } from '@/modules/pastor/pastor.service';
import { CopastorService } from '@/modules/copastor/copastor.service';
import { SupervisorService } from '@/modules/supervisor/supervisor.service';
import { ZoneService } from '@/modules/zone/zone.service';
import { PreacherService } from '@/modules/preacher/preacher.service';
import { AuthService } from '@/modules/auth/auth.service';
import { UserService } from '@/modules/user/user.service';
import { dataUsers } from './data/seed-users';

@Injectable()
export class SeedService {
  private readonly logger = new Logger('SeedService');

  constructor(
    @InjectRepository(Pastor)
    private readonly pastorRepository: Repository<Pastor>,

    @InjectRepository(Copastor)
    private readonly coPastorRepository: Repository<Copastor>,

    @InjectRepository(Preacher)
    private readonly preacherRepository: Repository<Preacher>,

    @InjectRepository(FamilyHouse)
    private readonly familyHouseRepository: Repository<FamilyHouse>,

    @InjectRepository(Disciple)
    private readonly discipleRepository: Repository<Disciple>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly churchService: ChurchService,
    private readonly pastorService: PastorService,
    private readonly copastorService: CopastorService,
    private readonly supervisorService: SupervisorService,
    private readonly zoneService: ZoneService,
    private readonly preacherService: PreacherService,
    private readonly familyHousesService: FamilyHouseService,
    private readonly discipleService: DiscipleService,

    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  async runSeed(): Promise<string> {
    const queryChurches =
      this.discipleRepository.createQueryBuilder('churches');
    const queryPastors = this.discipleRepository.createQueryBuilder('pastors');

    const queryCopastor =
      this.discipleRepository.createQueryBuilder('copastors');

    const querySupervisors =
      this.discipleRepository.createQueryBuilder('preachers');

    const queryZones = this.discipleRepository.createQueryBuilder('zones');

    const queryPreachers =
      this.discipleRepository.createQueryBuilder('preachers');

    const queryFamilyHouses =
      this.discipleRepository.createQueryBuilder('family-houses');

    const queryDisciples =
      this.discipleRepository.createQueryBuilder('disciples');

    const queryUsers = this.userRepository.createQueryBuilder('users');

    try {
      await queryDisciples.delete().where({}).execute();
      await queryFamilyHouses.delete().where({}).execute();
      await queryPreachers.delete().where({}).execute();
      await queryZones.delete().where({}).execute();
      await querySupervisors.delete().where({}).execute();
      await queryCopastor.delete().where({}).execute();
      await queryPastors.delete().where({}).execute();
      await queryChurches.delete().where({}).execute();
      await queryUsers
        .delete()
        .where('NOT :role = ANY(roles)', { role: 'super-user' })
        .execute();
    } catch (error) {
      this.handleDBExceptions(error);
    }

    await this.insertUsers();

    // await this.insertNewMembers(superUser);

    return 'SEED EXECUTED';
  }

  //* Insertar Usuarios
  private async insertUsers() {
    const seedUsers = dataUsers.users;
    const users = [];

    const superUser = await this.userRepository
      .createQueryBuilder('user')
      .where('ARRAY[:role]::text[] @> user.roles', { role: 'super-user' })
      .getOne();

    seedUsers.forEach((user) => {
      users.push(this.authService.register(user, superUser));
    });

    await Promise.all(users);
    return superUser;
  }

  //* Insertar Churches

  //? PRIVATE METHODS
  // For future index errors or constrains with code.
  private handleDBExceptions(error: any) {
    if (error.code === '23505') throw new BadRequestException(error.detail);
    this.logger.error(error);
    throw new InternalServerErrorException(
      'Unexpected errors, check server logs',
    );
  }
}
