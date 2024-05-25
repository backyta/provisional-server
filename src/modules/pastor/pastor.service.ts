import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { MemberRoles, Status } from '@/common/enums';

import { Pastor } from '@/modules/pastor/entities';
import { CreatePastorDto, UpdatePastorDto } from '@/modules/pastor/dto';

import { User } from '@/modules/user/entities';
import { Church } from '@/modules/church/entities';
import { isUUID } from 'class-validator';
import { Copastor } from '@/modules/copastor/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { Zone } from '@/modules/zone/entities';
import { Preacher } from '@/modules/preacher/entities';
import { FamilyHouse } from '@/modules/family-house/entities';
import { Disciple } from '@/modules/disciple/entities/';

@Injectable()
export class PastorService {
  private readonly logger = new Logger('PastorService');

  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

    @InjectRepository(Pastor)
    private readonly pastorRepository: Repository<Pastor>,

    @InjectRepository(Copastor)
    private readonly copastorRepository: Repository<Copastor>,

    @InjectRepository(Supervisor)
    private readonly supervisorRepository: Repository<Supervisor>,

    @InjectRepository(Zone)
    private readonly zoneRepository: Repository<Zone>,

    @InjectRepository(Preacher)
    private readonly preacherRepository: Repository<Preacher>,

    @InjectRepository(FamilyHouse)
    private readonly familyHouseRepository: Repository<FamilyHouse>,

    @InjectRepository(Disciple)
    private readonly discipleRepository: Repository<Disciple>,
  ) {}

  //* CREATE PASTOR
  async create(createPastorDto: CreatePastorDto, user: User): Promise<Pastor> {
    const { roles, theirChurch } = createPastorDto;

    // Validations
    if (
      !roles.includes(MemberRoles.Disciple) &&
      !roles.includes(MemberRoles.Pastor)
    ) {
      throw new BadRequestException(
        `El rol "disciple" y "pastor" debe ser incluido`,
      );
    }

    if (
      roles.includes(MemberRoles.Copastor) ||
      roles.includes(MemberRoles.Supervisor) ||
      roles.includes(MemberRoles.Preacher) ||
      roles.includes(MemberRoles.Treasurer)
    ) {
      throw new BadRequestException(
        `Para crear un Pastor solo se debe tener los roles "discípulo" y "pastor"`,
      );
    }

    //? Validate and assign church
    const church = await this.churchRepository.findOne({
      where: { id: theirChurch },
      relations: ['pastors'],
    });

    if (!church) {
      throw new NotFoundException(`Not found pastor with id ${theirChurch}`);
    }

    if (!church.status) {
      throw new BadRequestException(
        `The property status in Church must be a "Active"`,
      );
    }

    // Create new instance
    if (
      roles.includes(MemberRoles.Pastor) &&
      roles.includes(MemberRoles.Disciple)
    ) {
      try {
        const newPastor = this.pastorRepository.create({
          ...createPastorDto,
          theirChurch: church,
          createdAt: new Date(),
          createdBy: user,
        });

        const savedPastor = await this.pastorRepository.save(newPastor);

        // Count and assign pastors in Church
        church.pastors = [...(church.pastors || []), savedPastor];
        church.numberPastors += 1;

        await this.churchRepository.save(church);

        return newPastor;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }
  }

  findAll() {
    return `This action returns all pastor`;
  }

  findOne(id: number) {
    return `This action returns a #${id} pastor`;
  }

  //* UPDATE PASTOR
  async update(
    id: string,
    updatePastorDto: UpdatePastorDto,
    user: User,
  ): Promise<Pastor> {
    const { roles, status, theirChurch } = updatePastorDto;

    // Validations
    if (!roles) {
      throw new BadRequestException(
        `Required assign roles to update the pastor`,
      );
    }
    // NOTE : problema al sobrescribir un pastor con la misma iglesia antigua, se vuelve null
    if (!isUUID(id)) {
      throw new BadRequestException(`Not valid UUID`);
    }

    const pastor = await this.pastorRepository.findOne({
      where: { id: id },
      relations: ['theirChurch'],
    });

    if (!pastor) {
      throw new NotFoundException(`Pastor not found with id: ${id}`);
    }

    if (!roles.includes(MemberRoles.Disciple)) {
      throw new BadRequestException(
        `The "disciple" role should always be included in the roles`,
      );
    }

    if (!roles.some((role) => ['disciple', 'pastor'].includes(role))) {
      throw new BadRequestException(
        `The roles should include "disciple" and "pastor"`,
      );
    }

    if (
      pastor.roles.includes(MemberRoles.Pastor) &&
      pastor.roles.includes(MemberRoles.Disciple) &&
      !pastor.roles.includes(MemberRoles.Preacher) &&
      !pastor.roles.includes(MemberRoles.Supervisor) &&
      !pastor.roles.includes(MemberRoles.Copastor) &&
      !pastor.roles.includes(MemberRoles.Treasurer) &&
      (roles.includes(MemberRoles.Supervisor) ||
        roles.includes(MemberRoles.Copastor) ||
        roles.includes(MemberRoles.Preacher) ||
        roles.includes(MemberRoles.Treasurer))
    ) {
      throw new BadRequestException(
        `A lower role cannot be assigned without going through the hierarchy: [preacher, supervisor, co-pastor, pastor]`,
      );
    }

    //* Update info about Pastor
    if (
      pastor.roles.includes(MemberRoles.Disciple) &&
      pastor.roles.includes(MemberRoles.Pastor) &&
      !pastor.roles.includes(MemberRoles.Copastor) &&
      !pastor.roles.includes(MemberRoles.Supervisor) &&
      !pastor.roles.includes(MemberRoles.Preacher) &&
      !pastor.roles.includes(MemberRoles.Treasurer) &&
      roles.includes(MemberRoles.Disciple) &&
      roles.includes(MemberRoles.Pastor) &&
      !roles.includes(MemberRoles.Copastor) &&
      !roles.includes(MemberRoles.Supervisor) &&
      !roles.includes(MemberRoles.Preacher) &&
      !roles.includes(MemberRoles.Treasurer)
    ) {
      // Validations
      if (pastor.status === Status.Active && status === Status.Inactive) {
        throw new BadRequestException(
          `You cannot update it to "inactive", you must delete the record`,
        );
      }

      // NOTE : no se modificaría sus copastores, predicadores, super, etc, porque tiene los mismo
      // NOTE : solo se cambiaría o borraría cuando sube de nivel o se borra el pastor (borrar de niveles inferiores)
      // NOTE : y borrar de su nivel superior restar y borrar su id del array porque ya no existe.

      //? Update if theirCopastorId is different
      if (pastor.theirChurch?.id !== theirChurch) {
        //* Validate church
        const church = await this.churchRepository.findOne({
          where: { id: theirChurch },
          relations: [
            'pastors',
            'copastors',
            'supervisors',
            'zones',
            'preachers',
            'familyHouses',
            'disciples',
          ],
        });

        if (!church) {
          throw new NotFoundException(
            `Copastor not found with id ${theirChurch}`,
          );
        }

        if (!church.status) {
          throw new BadRequestException(
            `The property status in copastor must be "Active"`,
          );
        }

        //? All members by module
        const allCopastors = await this.copastorRepository.find({
          relations: ['theirPastor', 'theirChurch'],
        });
        const allSupervisors = await this.supervisorRepository.find({
          relations: ['theirPastor', 'theirChurch'],
        });
        const allZones = await this.zoneRepository.find({
          relations: ['theirPastor', 'theirChurch'],
        });
        const allPreachers = await this.preacherRepository.find({
          relations: ['theirPastor', 'theirChurch'],
        });
        const allFamilyHouses = await this.familyHouseRepository.find({
          relations: ['theirPastor', 'theirChurch'],
        });
        const allDisciples = await this.discipleRepository.find({
          relations: ['theirPastor', 'theirChurch'],
        });

        //* Update in all co-pastors the new church of the pastor that is updated.
        const copastorsByPastor = allCopastors.filter(
          (copastor) => copastor.theirPastor?.id === pastor.id,
        );

        const updateCopastorsChurch = copastorsByPastor.map(
          async (copastor) => {
            await this.copastorRepository.update(copastor.id, {
              theirChurch: church,
            });
          },
        );

        //* Update in all supervisors the new church of the pastor that is updated.
        const supervisorsByPastor = allSupervisors.filter(
          (supervisor) => supervisor.theirPastor?.id === pastor.id,
        );

        const updateSupervisorsChurch = supervisorsByPastor.map(
          async (supervisor) => {
            await this.supervisorRepository.update(supervisor.id, {
              theirChurch: church,
            });
          },
        );

        //* Update in all zones the new church of the pastor that is updated.
        const zonesByPastor = allZones.filter(
          (zone) => zone.theirPastor?.id === pastor.id,
        );

        const updateZonesChurch = zonesByPastor.map(async (zone) => {
          await this.zoneRepository.update(zone.id, {
            theirChurch: church,
          });
        });

        //* Update in all preachers the new church of the pastor that is updated.
        const preachersByPastor = allPreachers.filter(
          (preacher) => preacher.theirPastor?.id === pastor.id,
        );

        const updatePreachersChurch = preachersByPastor.map(
          async (preacher) => {
            await this.preacherRepository.update(preacher.id, {
              theirChurch: church,
            });
          },
        );

        //* Update in all family houses the new church of the pastor that is updated.
        const familyHousesByPastor = allFamilyHouses.filter(
          (familyHouse) => familyHouse.theirPastor?.id === pastor.id,
        );

        const updateFamilyHousesChurch = familyHousesByPastor.map(
          async (familyHouse) => {
            await this.familyHouseRepository.update(familyHouse.id, {
              theirChurch: church,
            });
          },
        );

        //* Update on all disciples the new church of the pastor that is updated.
        const disciplesByPastor = allDisciples.filter(
          (disciple) => disciple.theirPastor?.id === pastor.id,
        );

        const updateDisciplesChurch = disciplesByPastor.map(
          async (disciple) => {
            await this.discipleRepository.update(disciple.id, {
              theirChurch: church,
            });
          },
        );

        // Data old curch
        const oldChurch = await this.churchRepository.findOne({
          where: { id: pastor.theirChurch.id },
          relations: [
            'pastors',
            'pastors.theirChurch',
            'copastors',
            'copastors.theirPastor',
            'supervisors',
            'supervisors.theirPastor',
            'zones',
            'zones.theirPastor',
            'preachers',
            'preachers.theirPastor',
            'familyHouses',
            'familyHouses.theirPastor',
            'disciples',
            'disciples.theirPastor',
          ],
        });

        //? Extract from relations the old church for new church
        const pastorsNewChurch = oldChurch.pastors.filter(
          (oldPastor) => oldPastor?.id === pastor?.id,
        );

        const copastorsNewChurch = oldChurch.copastors.filter(
          (copastor) => copastor?.theirPastor?.id === pastor.id,
        );

        const supervisorsNewChurch = oldChurch.supervisors.filter(
          (supervisor) => supervisor?.theirPastor?.id === pastor.id,
        );

        const zonesNewChurch = oldChurch.zones.filter(
          (zone) => zone?.theirPastor?.id === pastor.id,
        );

        const preachersNewChurch = oldChurch.preachers.filter(
          (preacher) => preacher?.theirPastor?.id === pastor.id,
        );

        const familyHousesNewChurch = oldChurch.familyHouses.filter(
          (familyHouse) => familyHouse?.theirPastor?.id === pastor.id,
        );

        const disciplesNewChurch = oldChurch.disciples.filter(
          (disciple) => disciple?.theirPastor?.id === pastor.id,
        );

        //! Delete pastor and subtract amount on the old church
        // Delete pastors the old church according pastor
        const pastorsOldChurch = oldChurch.pastors.filter(
          (oldPastor) => oldPastor?.id !== pastor?.id,
        );
        oldChurch.pastors = pastorsOldChurch;
        oldChurch.numberPastors -= pastorsNewChurch.length;

        // Delete copastors the old church according pastor
        const copastorsOldChurch = oldChurch.copastors.filter(
          (copastor) => copastor?.theirPastor?.id !== pastor.id,
        );

        oldChurch.copastors = copastorsOldChurch;
        oldChurch.numberCopastors -= copastorsNewChurch.length;

        // Delete supervisors the old church according pastor
        const supervisorsOldChurch = oldChurch.supervisors.filter(
          (supervisor) => supervisor?.theirPastor?.id !== pastor.id,
        );
        oldChurch.supervisors = supervisorsOldChurch;
        oldChurch.numberSupervisors -= supervisorsNewChurch.length;

        // Delete zones the old church according pastor
        const zonesOldChurch = oldChurch.zones.filter(
          (zone) => zone?.theirPastor?.id !== pastor.id,
        );
        oldChurch.zones = zonesOldChurch;
        oldChurch.numberZones -= zonesNewChurch.length;

        // Delete zones the old church according pastor
        const preachersOldChurch = oldChurch.preachers.filter(
          (preacher) => preacher?.theirPastor?.id !== pastor?.id,
        );
        oldChurch.preachers = preachersOldChurch;
        oldChurch.numberPreachers -= preachersNewChurch.length;

        // Delete family houses the old church according pastor
        const familyHousesOldChurch = oldChurch.familyHouses.filter(
          (familyHouse) => familyHouse?.theirPastor?.id !== pastor.id,
        );
        oldChurch.familyHouses = familyHousesOldChurch;
        oldChurch.numberFamilyHouses -= familyHousesNewChurch.length;

        // Delete disciples the old church according pastor
        const disciplesOldChurch = oldChurch.disciples.filter(
          (disciple) => disciple?.theirPastor?.id !== pastor.id,
        );
        oldChurch.disciples = disciplesOldChurch;
        oldChurch.numberDisciples -= disciplesNewChurch.length;

        // Update and save
        const updatedPastor = await this.pastorRepository.preload({
          id: pastor.id,
          ...updatePastorDto,
          theirChurch: church,
          updatedAt: new Date(),
          updatedBy: user,
          status: status,
        });

        try {
          const savedPastor = await this.pastorRepository.save(updatedPastor);
          await Promise.all(updateCopastorsChurch);
          await Promise.all(updateSupervisorsChurch);
          await Promise.all(updateZonesChurch);
          await Promise.all(updatePreachersChurch);
          await Promise.all(updateFamilyHousesChurch);
          await Promise.all(updateDisciplesChurch);

          //* Assign relations to the new church according pastor
          // Count and assign pastors in the new Church
          church.pastors = [...(church.pastors || []), savedPastor];
          church.numberPastors += pastorsNewChurch.length;

          // Count and assign copastors in the new Church
          church.copastors = [
            ...(church.copastors || []),
            ...copastorsNewChurch,
          ];
          church.numberCopastors = copastorsNewChurch.length;

          // Count and assign supervisors in the new Church
          church.supervisors = [
            ...(church.supervisors || []),
            ...supervisorsNewChurch,
          ];
          church.numberSupervisors = supervisorsNewChurch.length;

          // Count and assign zones in the new Church
          church.zones = [...(church.zones || []), ...zonesNewChurch];
          church.numberZones = zonesNewChurch.length;

          // Count and assign preachers in the new Church
          church.preachers = [
            ...(church.preachers || []),
            ...preachersNewChurch,
          ];
          church.numberPreachers = preachersNewChurch.length;

          // Count and assign family houses in the new Church
          church.familyHouses = [
            ...(church.familyHouses || []),
            ...familyHousesNewChurch,
          ];
          church.numberFamilyHouses = familyHousesNewChurch.length;

          // Count and assign disciples in the new Church
          church.disciples = [
            ...(church.disciples || []),
            ...disciplesNewChurch,
          ];
          church.numberDisciples = disciplesNewChurch.length;

          await this.churchRepository.save(oldChurch);
          await this.churchRepository.save(church);

          return savedPastor;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      // NOTE : con esta actualización no afectaría la cantidad y id de las relaciones de pastor
      // NOTE : es decir sus copastores, super, preacher etc bajo su cargo
      // NOTE : solo afecta este cambio en la iglesia a donde apunta, con todos sus subordinados
      // NOTE : solo se actualizara las cantidades y id cuando se cree un nuevo registro apuntando a este pastor (dependiendo que cree)
      // TODO : verificar si cambiaría al subir de nivel en los otros módulos.

      //? Update and save if is same Church
      const updatedPastor = await this.pastorRepository.preload({
        id: pastor.id,
        ...updatePastorDto,
        theirChurch: pastor.theirChurch,
        updatedAt: new Date(),
        updatedBy: user,
        status: status,
      });

      try {
        return await this.pastorRepository.save(updatedPastor);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }
  }

  //! DELETE PASTOR
  remove(id: number) {
    return `This action removes a #${id} pastor`;
  }

  //? PRIVATE METHODS
  // For future index errors or constrains with code.
  private handleDBExceptions(error: any): never {
    if (error.code === '23505') throw new BadRequestException(error.detail);
    this.logger.error(error);

    throw new InternalServerErrorException(
      'Unexpected errors, check server logs',
    );
  }
}
