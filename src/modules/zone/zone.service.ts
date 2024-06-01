import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateZoneDto, UpdateZoneDto } from '@/modules/zone/dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Copastor } from '@/modules/copastor/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Zone } from '@/modules/zone/entities';
import { Church } from '@/modules/church/entities';
import { User } from '@/modules/user/entities';
import { isUUID } from 'class-validator';
import { Status } from '@/common/enums';
import { Preacher } from '@/modules/preacher/entities';
import { FamilyHouse } from '@/modules/family-house/entities';
import { Disciple } from '@/modules/disciple/entities/';
import { PaginationDto } from '@/common/dtos';

@Injectable()
export class ZoneService {
  private readonly logger = new Logger('ZoneService');

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

  //* CREATE ZONE
  async create(createZoneDto: CreateZoneDto, user: User): Promise<Zone> {
    const { theirSupervisor } = createZoneDto;

    //? Validate and assign supervisor
    const supervisor = await this.supervisorRepository.findOne({
      where: { id: theirSupervisor },
      relations: ['theirZone', 'theirCopastor', 'theirPastor', 'theirChurch'],
    });

    if (!supervisor) {
      throw new NotFoundException(
        `Not found preacher with id ${theirSupervisor}`,
      );
    }

    if (!supervisor.status) {
      throw new BadRequestException(
        `The property status in Supervisor must be a "Active"`,
      );
    }

    //* Validate and assign copastor according supervisor
    if (!supervisor?.theirCopastor) {
      throw new NotFoundException(
        `Copastor was not found, verify that Supervisor has a co-pastor assigned`,
      );
    }

    const copastor = await this.copastorRepository.findOne({
      where: { id: supervisor?.theirCopastor?.id },
      relations: ['zones'],
    });

    if (!copastor?.status) {
      throw new BadRequestException(
        `The property status in Copastor must be a "Active"`,
      );
    }

    //* Validate and assign pastor according supervisor
    if (!supervisor?.theirPastor) {
      throw new NotFoundException(
        `Pastor was not found, verify that Supervisor has a co-pastor assigned`,
      );
    }

    const pastor = await this.pastorRepository.findOne({
      where: { id: supervisor?.theirPastor?.id },
      relations: ['zones'],
    });

    if (!pastor?.status) {
      throw new BadRequestException(
        `The property status in Pastor must be a "Active"`,
      );
    }

    //* Validate and assign church according supervisor
    if (!supervisor?.theirChurch) {
      throw new NotFoundException(
        `Church was not found, verify that Supervisor has a church assigned`,
      );
    }

    const church = await this.churchRepository.findOne({
      where: { id: supervisor?.theirChurch?.id },
      relations: ['zones'],
    });

    if (!church.status) {
      throw new BadRequestException(
        `The property status in Church must be a "Active"`,
      );
    }

    // Create new instance
    try {
      const newZone = this.zoneRepository.create({
        ...createZoneDto,
        theirPastor: pastor,
        theirCopastor: copastor,
        theirSupervisor: supervisor,
        createdAt: new Date(),
        createdBy: user,
      });

      const savedZone = await this.zoneRepository.save(newZone);

      // Count and assign zone in Supervisor
      supervisor.theirZone = savedZone;

      // // Count and assign zones in Copastor
      // const zonesInCopastor = [...(copastor.zones || []), savedZone];
      // copastor.zones = zonesInCopastor;
      // copastor.numberZones = zonesInCopastor.length;

      // // Count and assign zones in Pastor
      // const zonesInPastor = [...(pastor.zones || []), savedZone];
      // pastor.zones = zonesInPastor;
      // pastor.numberZones += 1;

      // // Count and assign zones in Church
      // const zonesInChurch = [...(church.zones || []), savedZone];
      // church.zones = zonesInChurch;
      // church.numberZones += 1;

      await this.supervisorRepository.save(supervisor);
      // await this.copastorRepository.save(copastor);
      // await this.pastorRepository.save(pastor);
      // await this.churchRepository.save(church);

      return savedZone;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<Zone[]> {
    const { limit = 10, offset = 0 } = paginationDto;

    return this.zoneRepository.find({
      where: { status: Status.Active },
      take: limit,
      skip: offset,
      relations: [
        'theirSupervisor',
        'theirCopastor',
        'theirPastor',
        'theirChurch',
        'disciples',
        'familyHouses',
        'preachers',
      ],
      order: { createdAt: 'ASC' },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} zone`;
  }

  //* UPDATE ZONE
  async update(
    id: string,
    updateZoneDto: UpdateZoneDto,
    user: User,
  ): Promise<Zone> {
    const { status, theirSupervisor } = updateZoneDto;

    // Validations
    if (!isUUID(id)) {
      throw new BadRequestException(`Not valid UUID`);
    }

    // validation zone
    const zone = await this.zoneRepository.findOne({
      where: { id: id },
      relations: [
        'theirSupervisor',
        'theirCopastor',
        'theirPastor',
        'theirChurch',
      ],
    });

    if (!zone) {
      throw new NotFoundException(`Zone not found with id: ${id}`);
    }

    if (zone.status === Status.Active && status === Status.Inactive) {
      throw new BadRequestException(
        `You cannot update it to "inactive", you must delete the record`,
      );
    }

    //? Update if their Supervisor is different
    if (zone.theirSupervisor?.id !== theirSupervisor) {
      // Validate supervisor
      const newSupervisor = await this.supervisorRepository.findOne({
        where: { id: theirSupervisor },
        relations: [
          'supervisors',
          'zones',
          'preachers',
          'familyHouses',
          'disciples',
        ],
      });

      if (!newSupervisor) {
        throw new NotFoundException(
          `Supervisor not found with id ${theirSupervisor}`,
        );
      }

      if (!newSupervisor.status) {
        throw new BadRequestException(
          `The property status in Supervisor must be "Active"`,
        );
      }

      // Validate Copastor according supervisor
      if (!newSupervisor.theirCopastor) {
        throw new BadRequestException(
          `Copastor was not found, verify that Supervisor has a Copastor assigned`,
        );
      }

      const newCopastor = await this.copastorRepository.findOne({
        where: { id: newSupervisor?.theirCopastor?.id },
        relations: [
          'supervisors',
          'zones',
          'preachers',
          'familyHouses',
          'disciples',
        ],
      });

      if (!newCopastor.status) {
        throw new BadRequestException(
          `The property status in Copastor must be "Active"`,
        );
      }

      // Validate Pastor according supervisor
      if (!newCopastor.theirPastor) {
        throw new BadRequestException(
          `Pastor was not found, verify that Supervisor has a Pastor assigned`,
        );
      }

      const newPastor = await this.pastorRepository.findOne({
        where: { id: newSupervisor?.theirPastor?.id },
        relations: [
          'copastors',
          'supervisors',
          'zones',
          'preachers',
          'familyHouses',
          'disciples',
        ],
      });

      if (!newPastor.status) {
        throw new BadRequestException(
          `The property status in Pastor must be "Active"`,
        );
      }

      // Validate Church according supervisor
      if (!newSupervisor.theirChurch) {
        throw new BadRequestException(
          `Church was not found, verify that Supervisor has a Church assigned`,
        );
      }

      const newChurch = await this.churchRepository.findOne({
        where: { id: newSupervisor?.theirChurch?.id },
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

      if (!newChurch.status) {
        throw new BadRequestException(
          `The property status in Church must be "Active"`,
        );
      }

      //? All members by module
      const allPreachers = await this.preacherRepository.find({
        relations: [
          'theirSupervisor',
          'theirZone',
          'theirPastor',
          'theirCopastor',
          'theirChurch',
        ],
      });
      const allFamilyHouses = await this.familyHouseRepository.find({
        relations: [
          'theirSupervisor',
          'theirZone',
          'theirPastor',
          'theirCopastor',
          'theirChurch',
        ],
      });
      const allDisciples = await this.discipleRepository.find({
        relations: [
          'theirSupervisor',
          'theirZone',
          'theirPastor',
          'theirCopastor',
          'theirChurch',
        ],
      });

      //* Update in all preachers the new relations of the zone that is updated.
      const preachersByZone = allPreachers.filter(
        (preacher) => preacher.theirZone?.id === zone?.id,
      );

      const updatePreachers = preachersByZone.map(async (preacher) => {
        await this.preacherRepository.update(preacher.id, {
          theirChurch: newChurch,
          theirPastor: newPastor,
          theirCopastor: newCopastor,
          theirSupervisor: newSupervisor,
        });
      });

      //* Update in all family houses the new relations of the zone that is updated.
      const familyHousesByZone = allFamilyHouses.filter(
        (familyHouse) => familyHouse.theirZone?.id === zone?.id,
      );

      const updateFamilyHouses = familyHousesByZone.map(async (familyHouse) => {
        await this.familyHouseRepository.update(familyHouse.id, {
          theirChurch: newChurch,
          theirPastor: newPastor,
          theirCopastor: newCopastor,
          theirSupervisor: newSupervisor,
        });
      });

      //* Update in all disciples the new relations of the zone that is updated.
      const disciplesByZone = allDisciples.filter(
        (disciple) => disciple.theirZone?.id === zone?.id,
      );

      const updateDisciples = disciplesByZone.map(async (disciple) => {
        await this.discipleRepository.update(disciple.id, {
          theirChurch: newChurch,
          theirPastor: newPastor,
          theirCopastor: newCopastor,
          theirSupervisor: newSupervisor,
        });
      });

      // Data old Supervisor
      // const oldSupervisor = await this.supervisorRepository.findOne({
      //   where: { id: zone?.theirSupervisor?.id },
      //   relations: [
      //     'theirZone',
      //     'preachers',
      //     'preachers.theirZone',
      //     'familyHouses',
      //     'familyHouses.theirZone',
      //     'disciples',
      //     'disciples.theirZone',
      //   ],
      // });

      // // Data old Copastor
      // const oldCopastor = await this.copastorRepository.findOne({
      //   where: { id: zone?.theirCopastor?.id },
      //   relations: [
      //     'zones',
      //     'preachers',
      //     'preachers.theirZone',
      //     'familyHouses',
      //     'familyHouses.theirZone',
      //     'disciples',
      //     'disciples.theirZone',
      //   ],
      // });

      // // Data old Pastor
      // const oldPastor = await this.pastorRepository.findOne({
      //   where: { id: zone?.theirPastor?.id },
      //   relations: [
      //     'zones',
      //     'preachers',
      //     'preachers.theirZone',
      //     'familyHouses',
      //     'familyHouses.theirZone',
      //     'disciples',
      //     'disciples.theirZone',
      //   ],
      // });

      // // Data old curch
      // const oldChurch = await this.churchRepository.findOne({
      //   where: { id: zone?.theirChurch?.id },
      //   relations: [
      //     'zones',
      //     'preachers',
      //     'preachers.theirZone',
      //     'familyHouses',
      //     'familyHouses.theirZone',
      //     'disciples',
      //     'disciples.theirZone',
      //   ],
      // });

      // //! Delete zone relation and subtract amount on the old supervisor
      // // Delete copastors the old pastor according copastor
      // oldSupervisor.theirZone = null;
      // oldSupervisor.numberZones = 0;

      // // Delete zones the old church according pastor
      // const preachersOldSupervisor = oldSupervisor?.preachers.filter(
      //   (oldPreacher) => oldPreacher?.theirZone?.id !== zone?.id,
      // );
      // oldSupervisor.preachers = preachersOldSupervisor;
      // oldSupervisor.numberPreachers = preachersOldSupervisor.length;

      // // Delete family houses the old church according pastor
      // const familyHousesOldSupervisor = oldSupervisor?.familyHouses.filter(
      //   (oldFamilyHouse) => oldFamilyHouse?.theirZone?.id !== zone?.id,
      // );
      // oldSupervisor.familyHouses = familyHousesOldSupervisor;
      // oldSupervisor.numberFamilyHouses = familyHousesOldSupervisor.length;

      // // Delete disciples the old church according pastor
      // const disciplesOldSupervisor = oldSupervisor?.disciples.filter(
      //   (oldDisciple) => oldDisciple?.theirZone?.id !== zone?.id,
      // );
      // oldSupervisor.disciples = disciplesOldSupervisor;
      // oldSupervisor.numberDisciples = disciplesOldSupervisor.length;

      // //! Delete zone relation and subtract amount on the old co-pastor
      // // Delete copastors the old pastor according copastor
      // const zonesOldCopastor = oldCopastor?.zones.filter(
      //   (oldZone) => oldZone?.id !== zone?.id,
      // );
      // oldCopastor.zones = zonesOldCopastor;
      // oldCopastor.numberZones = zonesOldCopastor.length;

      // // Delete zones the old church according pastor
      // const preachersOldCopastor = oldCopastor?.preachers.filter(
      //   (oldPreacher) => oldPreacher?.theirZone?.id !== zone?.id,
      // );
      // oldCopastor.preachers = preachersOldCopastor;
      // oldCopastor.numberPreachers = preachersOldCopastor.length;

      // // Delete family houses the old church according pastor
      // const familyHousesOldCopastor = oldCopastor?.familyHouses.filter(
      //   (oldFamilyHouse) => oldFamilyHouse?.theirZone?.id !== zone?.id,
      // );
      // oldCopastor.familyHouses = familyHousesOldCopastor;
      // oldCopastor.numberFamilyHouses = familyHousesOldCopastor.length;

      // // Delete disciples the old church according pastor
      // const disciplesOldCopastor = oldCopastor?.disciples.filter(
      //   (oldDisciple) => oldDisciple?.theirZone?.id !== zone?.id,
      // );
      // oldCopastor.disciples = disciplesOldCopastor;
      // oldCopastor.numberDisciples = disciplesOldCopastor.length;

      // //! Delete supervisor relation and subtract amount on the old pastor
      // // Delete zones the old church according pastor
      // const zonesOldPastor = oldPastor?.zones.filter(
      //   (oldZone) => oldZone?.id !== zone?.id,
      // );
      // oldCopastor.zones = zonesOldPastor;
      // oldCopastor.numberZones = zonesOldPastor.length;

      // // Delete zones the old church according pastor
      // const preachersOldPastor = oldPastor?.preachers.filter(
      //   (oldPreacher) => oldPreacher?.theirZone?.id !== zone?.id,
      // );
      // oldPastor.preachers = preachersOldPastor;
      // oldPastor.numberPreachers = preachersOldPastor.length;

      // // Delete family houses the old church according pastor
      // const familyHousesOldPastor = oldPastor?.familyHouses.filter(
      //   (oldFamilyHouse) => oldFamilyHouse?.theirZone?.id !== zone?.id,
      // );
      // oldPastor.familyHouses = familyHousesOldPastor;
      // oldPastor.numberFamilyHouses = familyHousesOldPastor.length;

      // // Delete disciples the old church according pastor
      // const disciplesOldPastor = oldPastor?.disciples.filter(
      //   (oldDisciple) => oldDisciple?.theirZone?.id !== zone?.id,
      // );
      // oldPastor.disciples = disciplesOldPastor;
      // oldPastor.numberDisciples = disciplesOldPastor.length;

      // //! Delete supervisor relation and subtract amount on the old church
      // // Delete supervisors the old church according pastor
      // const zonesOldChurch = oldPastor?.zones.filter(
      //   (oldZone) => oldZone?.id !== zone?.id,
      // );
      // oldCopastor.zones = zonesOldChurch;
      // oldCopastor.numberZones = zonesOldChurch.length;

      // // Delete zones the old church according pastor
      // const preachersOldChurch = oldChurch?.preachers.filter(
      //   (oldPreacher) => oldPreacher?.theirZone?.id !== zone?.id,
      // );
      // oldChurch.preachers = preachersOldChurch;
      // oldChurch.numberPreachers = preachersOldChurch.length;

      // // Delete family houses the old church according pastor
      // const familyHousesOldChurch = oldChurch?.familyHouses.filter(
      //   (oldFamilyHouse) => oldFamilyHouse?.theirZone?.id !== zone?.id,
      // );
      // oldChurch.familyHouses = familyHousesOldChurch;
      // oldChurch.numberFamilyHouses = familyHousesOldChurch.length;

      // // Delete disciples the old church according pastor
      // const disciplesOldChurch = oldChurch?.disciples.filter(
      //   (oldDisciple) => oldDisciple?.theirZone?.id !== zone?.id,
      // );
      // oldChurch.disciples = disciplesOldChurch;
      // oldChurch.numberDisciples = disciplesOldChurch.length;

      // Update and save
      const updatedZone = await this.zoneRepository.preload({
        id: zone.id,
        ...updateZoneDto,
        theirChurch: newChurch,
        theirPastor: newPastor,
        theirCopastor: newCopastor,
        theirSupervisor: newSupervisor,
        updatedAt: new Date(),
        updatedBy: user,
        status: status,
      });

      const oldSupervisor = await this.supervisorRepository.findOne({
        where: { id: zone?.theirSupervisor?.id },
        relations: ['theirZone'],
      });

      try {
        await Promise.all(updatePreachers);
        await Promise.all(updateFamilyHouses);
        await Promise.all(updateDisciples);

        oldSupervisor.theirZone = null;
        await this.supervisorRepository.save(oldSupervisor);

        const savedZone = await this.zoneRepository.save(updatedZone);

        newSupervisor.theirZone = savedZone;

        return savedZone;

        //NOTE : Faltaria calcular los id que se sacaron y colocarles su nueva relacion para que se seteen en las nuevas
        //* Assign relations to the new supervisor, copastor, pastor and new church
        // newSupervisor.theirZone = savedZone;
        // newSupervisor.numberZones = 1;

        // const zonesInNewCopastor = (newCopastor.zones = [
        //   ...(newCopastor.zones || []),
        //   savedZone,
        // ]);
        // newCopastor.zones = zonesInNewCopastor;
        // newCopastor.numberZones = zonesInNewCopastor.length;

        // const zonesInNewPastor = (newPastor.zones = [
        //   ...(newPastor.zones || []),
        //   savedZone,
        // ]);
        // newPastor.zones = zonesInNewPastor;
        // newPastor.numberZones = zonesInNewPastor.length;

        // const zonesInNewChurch = (newChurch.zones = [
        //   ...(newChurch.zones || []),
        //   savedZone,
        // ]);
        // newChurch.zones = zonesInNewChurch;
        // newChurch.numberZones = zonesInNewChurch.length;

        // await this.supervisorRepository.save(oldSupervisor);
        // await this.supervisorRepository.save(newSupervisor);
        // await this.copastorRepository.save(oldCopastor);
        // await this.copastorRepository.save(newCopastor);
        // await this.pastorRepository.save(oldPastor);
        // await this.pastorRepository.save(newPastor);
        // await this.churchRepository.save(oldChurch);
        // await this.churchRepository.save(newChurch);

        // return savedZone;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //? Update and save if is same Copastor
    const updatedSupervisor = await this.zoneRepository.preload({
      id: zone.id,
      ...updateZoneDto,
      theirChurch: zone.theirChurch,
      theirPastor: zone.theirPastor,
      theirCopastor: zone.theirCopastor,
      theirSupervisor: zone.theirSupervisor,
      updatedAt: new Date(),
      updatedBy: user,
      status: status,
    });

    try {
      return await this.supervisorRepository.save(updatedSupervisor);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // NOTE : la zona no debería eliminarse  ni desactivarse, solo actualizarse, porque afectaría a sus relaciones con ofrenda
  // NOTE : si la zona se actualiza de super es indiferente porque la relacione s solo con zona.
  //! DELETE ZONE
  async remove(id: string, user: User): Promise<void> {
    // Validations
    if (!isUUID(id)) {
      throw new BadRequestException(`Not valid UUID`);
    }

    const zone = await this.zoneRepository.findOneBy({ id });

    if (!zone) {
      throw new NotFoundException(`Supervisor with id: ${id} not exits`);
    }

    //* Update and set in Inactive on Zone
    const updatedZone = await this.zoneRepository.preload({
      id: zone.id,
      theirChurch: null,
      theirPastor: null,
      theirCopastor: null,
      theirSupervisor: null,
      updatedAt: new Date(),
      updatedBy: user,
      status: Status.Inactive,
    });

    // Update and set to null relationships in Preacher (who have same Zone)
    const allPreachers = await this.preacherRepository.find({
      relations: ['theirZone'],
    });
    const preachersByZone = allPreachers.filter(
      (preacher) => preacher.theirZone?.id === zone?.id,
    );

    const deleteZoneInPreachers = preachersByZone.map(async (preacher) => {
      await this.preacherRepository.update(preacher?.id, {
        theirZone: null,
        updatedAt: new Date(),
        updatedBy: user,
      });
    });

    // Update and set to null relationships in Family House (who have same Zone)
    const allFamilyHouses = await this.familyHouseRepository.find({
      relations: ['theirZone'],
    });
    const familyHousesByZone = allFamilyHouses.filter(
      (familyHome) => familyHome.theirZone?.id === zone?.id,
    );

    const deleteZoneInFamilyHouses = familyHousesByZone.map(
      async (familyHome) => {
        await this.familyHouseRepository.update(familyHome.id, {
          theirZone: null,
          updatedAt: new Date(),
          updatedBy: user,
        });
      },
    );

    // Update and set to null relationships in Disciple, all those (who have the same Zone).
    const allDisciples = await this.discipleRepository.find({
      relations: ['theirZone'],
    });

    const disciplesByZone = allDisciples.filter(
      (disciple) => disciple.theirZone?.id === zone.id,
    );

    const deleteZoneInDisciple = disciplesByZone.map(async (disciple) => {
      await this.discipleRepository.update(disciple?.id, {
        theirZone: null,
        updatedAt: new Date(),
        updatedBy: user,
      });
    });

    //! Eliminate zone relation (id and amount) on their supervisor, copastor, pastor and church
    // Supervisor
    // const theirSupervisor = await this.supervisorRepository.findOne({
    //   where: { id: zone?.theirSupervisor?.id },
    //   relations: ['theirZone'],
    // });

    // theirSupervisor.theirZone = null;
    // theirSupervisor.numberZones = 0;

    // // Copastor
    // const theirCopastor = await this.copastorRepository.findOne({
    //   where: { id: zone?.theirCopastor?.id },
    //   relations: ['zones'],
    // });

    // const zonesInCopastor = theirCopastor.zones.filter(
    //   (currentZone) => currentZone?.id !== zone?.id,
    // );

    // theirCopastor.zones = zonesInCopastor;
    // theirCopastor.numberZones = zonesInCopastor.length;

    // //Pastor
    // const theirPastor = await this.pastorRepository.findOne({
    //   where: { id: zone?.theirPastor?.id },
    //   relations: ['zones'],
    // });

    // const zonesInPastor = theirPastor.zones.filter(
    //   (currentZone) => currentZone?.id !== zone?.id,
    // );

    // theirPastor.zones = zonesInPastor;
    // theirPastor.numberZones = zonesInPastor.length;

    // // Church
    // const theirChurch = await this.churchRepository.findOne({
    //   where: { id: zone?.theirChurch?.id },
    //   relations: ['zones'],
    // });

    // const zonesInChurch = theirChurch.zones.filter(
    //   (currentZone) => currentZone?.id !== zone?.id,
    // );

    // theirChurch.zones = zonesInChurch;
    // theirChurch.numberZones = zonesInChurch.length;

    // Update and save
    try {
      await Promise.all(deleteZoneInPreachers);
      await Promise.all(deleteZoneInFamilyHouses);
      await Promise.all(deleteZoneInDisciple);

      await this.zoneRepository.save(updatedZone);
      // NOTE : no deberia eliminarse

      // await this.supervisorRepository.save(theirSupervisor);
      // await this.copastorRepository.save(theirCopastor);
      // await this.pastorRepository.save(theirPastor);
      // await this.churchRepository.save(theirChurch);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //? PRIVATE METHODS
  // For future index errors or constrains with code.
  private handleDBExceptions(error: any): never {
    if (error.code === '23505') throw new BadRequestException(error.detail);
    this.logger.error(error);
    console.log(error);

    throw new InternalServerErrorException(
      'Unexpected errors, check server logs',
    );
  }
}
