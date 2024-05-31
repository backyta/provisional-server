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
import { PaginationDto } from '@/common/dtos';

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
        const pastorsInChurch = [...(church.pastors || []), savedPastor];
        church.pastors = pastorsInChurch;
        church.numberPastors = pastorsInChurch.length;

        await this.churchRepository.save(church);

        return newPastor;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }
  }

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<Pastor[]> {
    const { limit = 10, offset = 0 } = paginationDto;

    return this.pastorRepository.find({
      where: { status: Status.Active },
      take: limit,
      skip: offset,
      relations: [
        'theirChurch',
        'disciples',
        'preachers',
        'familyHouses',
        'supervisors',
        'copastors',
        'zones',
      ],
      order: { createdAt: 'ASC' },
    });
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

      //? Update if their Church is different
      if (pastor.theirChurch?.id !== theirChurch) {
        //* Validate church
        const newChurch = await this.churchRepository.findOne({
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

        if (!newChurch) {
          throw new NotFoundException(
            `Church not found with id ${theirChurch}`,
          );
        }

        if (!newChurch.status) {
          throw new BadRequestException(
            `The property status in Church must be "Active"`,
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
          (copastor) => copastor.theirPastor?.id === pastor?.id,
        );

        const updateCopastorsChurch = copastorsByPastor.map(
          async (copastor) => {
            await this.copastorRepository.update(copastor.id, {
              theirChurch: newChurch,
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
              theirChurch: newChurch,
            });
          },
        );

        //* Update in all zones the new church of the pastor that is updated.
        const zonesByPastor = allZones.filter(
          (zone) => zone.theirPastor?.id === pastor.id,
        );

        const updateZonesChurch = zonesByPastor.map(async (zone) => {
          await this.zoneRepository.update(zone.id, {
            theirChurch: newChurch,
          });
        });

        //* Update in all preachers the new church of the pastor that is updated.
        const preachersByPastor = allPreachers.filter(
          (preacher) => preacher.theirPastor?.id === pastor.id,
        );

        const updatePreachersChurch = preachersByPastor.map(
          async (preacher) => {
            await this.preacherRepository.update(preacher.id, {
              theirChurch: newChurch,
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
              theirChurch: newChurch,
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
              theirChurch: newChurch,
            });
          },
        );

        // Data old curch
        const oldChurch = await this.churchRepository.findOne({
          where: { id: pastor?.theirChurch?.id },
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

        // NOTE : problema aqui, cuando se saca el pastor de la antigua iglesia sale con el id de esa iglesia y se setea en la nueva
        // NOTE : asi no hay coincidencia, se debe calcular denuedo

        // NOTE : no hacer esto, porque habra conflicto de id de iglesia antigua en la nueva
        //? Extract from relations the old church for new church
        // const pastorsNewChurch = oldChurch?.pastors.filter(
        //   (oldPastor) => oldPastor?.id === pastor?.id,
        // );

        // const copastorsNewChurch = oldChurch?.copastors.filter(
        //   (copastor) => copastor?.theirPastor?.id === pastor.id,
        // );

        // const supervisorsNewChurch = oldChurch?.supervisors.filter(
        //   (supervisor) => supervisor?.theirPastor?.id === pastor.id,
        // );

        // const zonesNewChurch = oldChurch?.zones.filter(
        //   (zone) => zone?.theirPastor?.id === pastor.id,
        // );

        // const preachersNewChurch = oldChurch?.preachers.filter(
        //   (preacher) => preacher?.theirPastor?.id === pastor.id,
        // );

        // const familyHousesNewChurch = oldChurch?.familyHouses.filter(
        //   (familyHouse) => familyHouse?.theirPastor?.id === pastor.id,
        // );

        // const disciplesNewChurch = oldChurch?.disciples.filter(
        //   (disciple) => disciple?.theirPastor?.id === pastor.id,
        // );

        // NOTE : solo debo borrar y calcular denuevo o asignarlo pero con el nuevo iglesia id
        //! Delete pastor relation and subtract amount on the old church
        // Delete pastors the old church according pastor
        const pastorsOldChurch = oldChurch?.pastors.filter(
          (oldPastor) => oldPastor?.id !== pastor?.id,
        );
        oldChurch.pastors = pastorsOldChurch;
        oldChurch.numberPastors = pastorsOldChurch.length;

        // Delete copastors the old church according pastor
        const copastorsOldChurch = oldChurch?.copastors.filter(
          (oldCopastor) => oldCopastor?.theirPastor?.id !== pastor?.id,
        );

        oldChurch.copastors = copastorsOldChurch;
        oldChurch.numberCopastors = copastorsOldChurch.length;

        // Delete supervisors the old church according pastor
        const supervisorsOldChurch = oldChurch?.supervisors.filter(
          (oldSupervisor) => oldSupervisor?.theirPastor?.id !== pastor?.id,
        );
        oldChurch.supervisors = supervisorsOldChurch;
        oldChurch.numberSupervisors = supervisorsOldChurch.length;

        // Delete zones the old church according pastor
        const zonesOldChurch = oldChurch?.zones.filter(
          (oldZone) => oldZone?.theirPastor?.id !== pastor?.id,
        );
        oldChurch.zones = zonesOldChurch;
        oldChurch.numberZones = zonesOldChurch.length;

        // Delete zones the old church according pastor
        const preachersOldChurch = oldChurch?.preachers.filter(
          (oldPreacher) => oldPreacher?.theirPastor?.id !== pastor?.id,
        );
        oldChurch.preachers = preachersOldChurch;
        oldChurch.numberPreachers = preachersOldChurch.length;

        // Delete family houses the old church according pastor
        const familyHousesOldChurch = oldChurch?.familyHouses.filter(
          (oldFamilyHouse) => oldFamilyHouse?.theirPastor?.id !== pastor?.id,
        );
        oldChurch.familyHouses = familyHousesOldChurch;
        oldChurch.numberFamilyHouses = familyHousesOldChurch.length;

        // Delete disciples the old church according pastor
        const disciplesOldChurch = oldChurch?.disciples.filter(
          (oldDisciple) => oldDisciple?.theirPastor?.id !== pastor?.id,
        );
        oldChurch.disciples = disciplesOldChurch;
        oldChurch.numberDisciples = disciplesOldChurch.length;

        // Update and save
        const updatedPastor = await this.pastorRepository.preload({
          id: pastor.id,
          ...updatePastorDto,
          theirChurch: newChurch,
          updatedAt: new Date(),
          updatedBy: user,
          status: status,
        });

        // NOTE : si se puede hacer solo se debe guardar antes
        try {
          const savedPastor = await this.pastorRepository.save(updatedPastor);
          await Promise.all(updateCopastorsChurch);
          await Promise.all(updateSupervisorsChurch);
          await Promise.all(updateZonesChurch);
          await Promise.all(updatePreachersChurch);
          await Promise.all(updateFamilyHousesChurch);
          await Promise.all(updateDisciplesChurch);

          // NOTE: aqui calcular el nuevo pastor en la nueva iglesia no mas, lo demas se calculan en su propio modulo
          // NOTE : todo lo demás queda en 0, y en los demás modulos se va calculando, de acuerdo al nuevo relacion
          //* Assign relations to the new church according pastor
          // Count and assign pastors in the new Church
          const pastorsNewChurch = (newChurch.pastors = [
            ...(newChurch.pastors || []),
            savedPastor,
          ]);
          newChurch.pastors = pastorsNewChurch;
          newChurch.numberPastors = pastorsNewChurch.length;

          // Count and assign copastors in the new Church
          // church.copastors = [
          //   ...(church.copastors || []),
          //   ...copastorsNewChurch,
          // ];
          // church.numberCopastors += copastorsNewChurch.length;

          // Count and assign supervisors in the new Church
          // church.supervisors = [
          //   ...(church.supervisors || []),
          //   ...supervisorsNewChurch,
          // ];
          // church.numberSupervisors += supervisorsNewChurch.length;

          // Count and assign zones in the new Church
          // church.zones = [...(church.zones || []), ...zonesNewChurch];
          // church.numberZones = zonesNewChurch.length;

          // Count and assign preachers in the new Church
          // church.preachers = [
          //   ...(church.preachers || []),
          //   ...preachersNewChurch,
          // ];
          // church.numberPreachers += preachersNewChurch.length;

          // Count and assign family houses in the new Church
          // church.familyHouses = [
          //   ...(church.familyHouses || []),
          //   ...familyHousesNewChurch,
          // ];
          // church.numberFamilyHouses += familyHousesNewChurch.length;

          // Count and assign disciples in the new Church
          // church.disciples = [
          //   ...(church.disciples || []),
          //   ...disciplesNewChurch,
          // ];
          // church.numberDisciples += disciplesNewChurch.length;

          await this.churchRepository.save(oldChurch);
          await this.churchRepository.save(newChurch);

          return savedPastor;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      // NOTE : no se modificaría sus copastores, predicadores, super, etc, porque tiene los mismo
      // NOTE : solo se cambiaría o borraría cuando sube de nivel o se borra el pastor (borrar de niveles inferiores)
      // NOTE : y borrar de su nivel superior restar y borrar su id del array porque ya no existe.
      // NOTE : con esta actualización no afectaría la cantidad y id de las relaciones de pastor
      // NOTE : es decir sus copastores, super, preacher etc bajo su cargo
      // NOTE : solo afecta este cambio en la iglesia a donde apunta, con todos sus subordinados
      // NOTE : solo se actualizara las cantidades y id cuando se cree un nuevo registro apuntando a este pastor (dependiendo que cree)
      // TODO : verificar si cambiaría al subir de nivel en los otros módulos.

      // Como contabilizar las relaciones id y cantidades del pastor cuando se actualize
      // se actualizara desde su relación subordinada, osea desde copastor se actualizara y si tiene su mismo pastor
      // se sumara 1 a copastor en Pastor y tmb se añadirá su ID

      // nOTE : copastor, si se cambia un copastor de pastor y tiene diferente iglesia , sedebera cambiar
      // all sus relaciones en pastor y pasarlos a otro pastor, y tmb en inglesia.
      // ademas se debera contabilizar y asignar a su nuevo pastor
      // Si hay un pastor que se elimino y se quiere volver a setear, entonces este tomara todas las relaciones
      // y cantidadesdel anterior pastor e igual en la iglesia o superior

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
  async remove(id: string, user: User): Promise<void> {
    // Validations
    if (!isUUID(id)) {
      throw new BadRequestException(`Not valid UUID`);
    }

    const pastor = await this.pastorRepository.findOneBy({ id });

    if (!pastor) {
      throw new NotFoundException(`Pastor with id: ${id} not exits`);
    }

    //* Update and set in Inactive on Pastor
    const updatedPastor = await this.pastorRepository.preload({
      id: pastor.id,
      theirChurch: null,
      copastors: [],
      supervisors: [],
      zones: [],
      preachers: [],
      familyHouses: [],
      disciples: [],
      numberCopastors: 0,
      numberSupervisors: 0,
      numberZones: 0,
      numberPreachers: 0,
      numberFamilyHouses: 0,
      numberDisciples: 0,
      updatedAt: new Date(),
      updatedBy: user,
      status: Status.Inactive,
    });

    // Update and set to null relationships in Copastor (who have same Pastor)
    const allCopastores = await this.copastorRepository.find({
      relations: ['theirPastor'],
    });
    const copastorsByPastor = allCopastores.filter(
      (copastor) => copastor.theirPastor?.id === pastor?.id,
    );

    const deletePastorInCopastors = copastorsByPastor.map(async (copastor) => {
      await this.copastorRepository.update(copastor?.id, {
        theirPastor: null,
        updatedAt: new Date(),
        updatedBy: user,
      });
    });

    // Update and set to null relationships in Supervisor (who have same Pastor)
    const allSupervisors = await this.supervisorRepository.find({
      relations: ['theirPastor'],
    });
    const supervisorsByPastor = allSupervisors.filter(
      (supervisor) => supervisor.theirPastor?.id === pastor?.id,
    );

    const deletePastorInSupervisors = supervisorsByPastor.map(
      async (supervisor) => {
        await this.supervisorRepository.update(supervisor?.id, {
          theirPastor: null,
          updatedAt: new Date(),
          updatedBy: user,
        });
      },
    );

    // Update and set to null relationships in Zones (who have same Pastor)
    const allZones = await this.zoneRepository.find({
      relations: ['theirPastor'],
    });
    const zonesByPastor = allZones.filter(
      (zone) => zone.theirPastor?.id === pastor?.id,
    );

    const deletePastorInZones = zonesByPastor.map(async (zone) => {
      await this.zoneRepository.update(zone?.id, {
        theirPastor: null,
        updatedAt: new Date(),
        updatedBy: user,
      });
    });

    // Update and set to null relationships in Preacher (who have same Pastor)
    const allPreachers = await this.preacherRepository.find({
      relations: ['theirPastor'],
    });
    const preachersByPastor = allPreachers.filter(
      (preacher) => preacher.theirPastor?.id === pastor?.id,
    );

    const deletePastorInPreachers = preachersByPastor.map(async (preacher) => {
      await this.preacherRepository.update(preacher?.id, {
        theirPastor: null,
        updatedAt: new Date(),
        updatedBy: user,
      });
    });

    // Update and set to null relationships in Family House (who have same Pastor)
    const allFamilyHouses = await this.familyHouseRepository.find({
      relations: ['theirPastor'],
    });
    const familyHousesByPastor = allFamilyHouses.filter(
      (familyHome) => familyHome.theirPastor?.id === pastor.id,
    );

    const deletePastorInFamilyHouses = familyHousesByPastor.map(
      async (familyHome) => {
        await this.familyHouseRepository.update(familyHome.id, {
          theirPastor: null,
          updatedAt: new Date(),
          updatedBy: user,
        });
      },
    );

    // Update and set to null relationships in Disciple, all those (who have the same Pastor).
    const allDisciples = await this.discipleRepository.find({
      relations: ['theirPastor'],
    });

    const disciplesByPastor = allDisciples.filter(
      (disciple) => disciple.theirPastor?.id === pastor.id,
    );

    const deletePastorInDisciples = disciplesByPastor.map(async (disciple) => {
      await this.discipleRepository.update(disciple?.id, {
        theirPastor: null,
        updatedAt: new Date(),
        updatedBy: user,
      });
    });

    //! Eliminate pastor relation (id and amount) on their church
    const theirChurch = await this.churchRepository.findOne({
      where: { id: pastor?.theirChurch?.id },
      relations: ['pastors', 'pastors.theirChurch'],
    });

    const pastorsInChurch = theirChurch.pastors.filter(
      (currentPastor) => currentPastor?.id !== pastor?.id,
    );

    theirChurch.pastors = pastorsInChurch;
    theirChurch.numberPastors = pastorsInChurch.length;

    // Update and save
    try {
      await this.pastorRepository.save(updatedPastor);
      await Promise.all(deletePastorInDisciples);
      await Promise.all(deletePastorInCopastors);
      await Promise.all(deletePastorInZones);
      await Promise.all(deletePastorInSupervisors);
      await Promise.all(deletePastorInPreachers);
      await Promise.all(deletePastorInFamilyHouses);

      await this.churchRepository.save(theirChurch);
    } catch (error) {
      this.handleDBExceptions(error);
    }
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
