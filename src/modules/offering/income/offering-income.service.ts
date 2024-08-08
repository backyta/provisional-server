import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import {
  OfferingIncomeCreateSubType,
  OfferingIncomeCreateType,
} from '@/modules/offering/income/enums';
import {
  CreateOfferingIncomeDto,
  UpdateOfferingIncomeDto,
} from '@/modules/offering/income/dto';

import { Zone } from '@/modules/zone/entities';
import { User } from '@/modules/user/entities';
import { Church } from '@/modules/church/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { FamilyGroup } from '@/modules/family-group/entities';
import { OfferingIncome } from '@/modules/offering/income/entities';

@Injectable()
export class OfferingIncomeService {
  private readonly logger = new Logger('IncomeService');

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

    @InjectRepository(FamilyGroup)
    private readonly familyGroupRepository: Repository<FamilyGroup>,

    @InjectRepository(Disciple)
    private readonly discipleRepository: Repository<Disciple>,

    @InjectRepository(OfferingIncome)
    private readonly offeringIncomeRepository: Repository<OfferingIncome>,
  ) {}

  //* CREATE OFFERING INCOME
  async create(
    createOfferingIncomeDto: CreateOfferingIncomeDto,
    user: User,
  ): Promise<OfferingIncome> {
    const {
      memberId,
      zoneId,
      familyGroupId,
      memberType,
      type,
      subType,
      imageUrls,
      amount,
    } = createOfferingIncomeDto;

    //* Validations
    if (type === OfferingIncomeCreateType.Offering) {
      if (subType === OfferingIncomeCreateSubType.FamilyGroup) {
        if (!familyGroupId) {
          throw new NotFoundException(`El Grupo Familiar es requerido.`);
        }

        const familyGroup = await this.familyGroupRepository.findOne({
          where: { id: familyGroupId },
          relations: [
            'theirChurch',
            'theirPastor',
            'theirCopastor',
            'theirSupervisor',
            'theirZone',
            'theirPreacher',
          ],
        });

        if (!familyGroup) {
          throw new NotFoundException(
            `Grupo familiar con id: ${familyGroupId}, no fue encontrado.`,
          );
        }

        if (!familyGroup.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Grupo familiar debe ser "Activo".`,
          );
        }

        try {
          const newOfferingIncome = this.offeringIncomeRepository.create({
            ...createOfferingIncomeDto,
            amount: +amount,
            disciple: null,
            preacher: null,
            supervisor: null,
            copastor: null,
            pastor: null,
            zone: null,
            memberType: null,
            shift: null,
            imageUrls: imageUrls,
            familyGroup: familyGroup,
            createdAt: new Date(),
            createdBy: user,
          });

          return await this.offeringIncomeRepository.save(newOfferingIncome);
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      // TODO : seguir con dominical

      //   if (
      //     subType === OfferingIncomeCreateSubType.ZonalFasting ||
      //     subType === OfferingIncomeCreateSubType.ZonalVigil
      //   ) {
      //   }

      //   if (
      //     subType === OfferingIncomeCreateSubType.SundayWorship ||
      //     subType === OfferingIncomeCreateSubType.SundaySchool
      //   ) {
      //   }

      //   if (
      //     subType === OfferingIncomeCreateSubType.ChurchGround ||
      //     subType === OfferingIncomeCreateSubType.Special
      //   ) {
      //   }

      //   if (
      //     subType === OfferingIncomeCreateSubType.Activities ||
      //     subType === OfferingIncomeCreateSubType.GeneralFasting ||
      //     subType === OfferingIncomeCreateSubType.GeneralVigil ||
      //     subType === OfferingIncomeCreateSubType.UnitedWorship ||
      //     subType === OfferingIncomeCreateSubType.YouthWorship
      //   ) {
      //   }
      // }

      // if (type === OfferingIncomeCreateType.IncomeAdjustment) {
      // }

      // if (!roles.includes(MemberRole.Disciple)) {
      //   throw new BadRequestException(`El rol "Discípulo" debe ser incluido.`);
      // }

      // if (
      //   roles.includes(MemberRole.Pastor) ||
      //   roles.includes(MemberRole.Copastor) ||
      //   roles.includes(MemberRole.Preacher) ||
      //   roles.includes(MemberRole.Supervisor) ||
      //   roles.includes(MemberRole.Treasurer)
      // ) {
      //   throw new BadRequestException(
      //     `Para crear un Discípulo, solo se requiere el rol: "Discípulo"`,
      //   );
      // }

      // //? Validate and assign Family House
      // if (!theirFamilyGroup) {
      //   throw new NotFoundException(
      //     `Para crear un nuevo Discípulo se le debe asignar un Grupo familiar`,
      //   );
      // }

      // const familyGroup = await this.familyGroupRepository.findOne({
      //   where: { id: theirFamilyGroup },
      //   relations: [
      //     'theirChurch',
      //     'theirPastor',
      //     'theirCopastor',
      //     'theirSupervisor',
      //     'theirZone',
      //     'theirPreacher',
      //   ],
      // });

      // if (!familyGroup) {
      //   throw new NotFoundException(
      //     `Grupo familiar con id: ${theirFamilyGroup}, no fue encontrado.`,
      //   );
      // }

      // if (!familyGroup.recordStatus) {
      //   throw new BadRequestException(
      //     `La propiedad "Estado de registro" en Grupo familiar debe ser "Activo".`,
      //   );
      // }

      // //* Validate and assign preacher according family house
      // if (!familyGroup?.theirPreacher) {
      //   throw new NotFoundException(
      //     `Predicador no fue encontrado, verifica que Grupo Familiar tenga un Predicador asignado.`,
      //   );
      // }

      // const preacher = await this.preacherRepository.findOne({
      //   where: { id: familyGroup?.theirPreacher?.id },
      // });

      // if (!preacher.recordStatus) {
      //   throw new BadRequestException(
      //     `La propiedad "Estado de registro" en Predicador debe ser "Activo".`,
      //   );
      // }

      // //* Validate and assign zone according family house
      // if (!familyGroup?.theirZone) {
      //   throw new NotFoundException(
      //     `Zona no fue encontrada, verifica que Grupo Familiar tenga una Zona asignada.`,
      //   );
      // }

      // const zone = await this.zoneRepository.findOne({
      //   where: { id: familyGroup?.theirZone?.id },
      // });

      // if (!zone.recordStatus) {
      //   throw new BadRequestException(
      //     `La propiedad "Estado de registro" en Zona debe ser "Activo".`,
      //   );
      // }

      // //* Validate and assign supervisor according family house
      // if (!familyGroup?.theirSupervisor) {
      //   throw new NotFoundException(
      //     `Supervisor no fue encontrado, verifica que Grupo Familiar tenga un Supervisor asignado.`,
      //   );
      // }

      // const supervisor = await this.supervisorRepository.findOne({
      //   where: { id: familyGroup?.theirSupervisor?.id },
      // });

      // if (!supervisor.recordStatus) {
      //   throw new BadRequestException(
      //     `La propiedad "Estado de registro" en Supervisor debe ser "Activo".`,
      //   );
      // }

      // //* Validate and assign copastor according family house
      // if (!familyGroup?.theirCopastor) {
      //   throw new NotFoundException(
      //     `Co-Pastor no fue encontrado, verifica que Grupo Familiar tenga un Co-Pastor asignado.`,
      //   );
      // }

      // const copastor = await this.copastorRepository.findOne({
      //   where: { id: familyGroup?.theirCopastor?.id },
      // });

      // if (!copastor.recordStatus) {
      //   throw new BadRequestException(
      //     `La propiedad "Estado de registro" en Co-Pastor debe ser "Activo".`,
      //   );
      // }

      // //* Validate and assign pastor according family house
      // if (!familyGroup?.theirPastor) {
      //   throw new NotFoundException(
      //     `Pastor no fue encontrado, verifica que Grupo Familiar tenga un Pastor asignado.`,
      //   );
      // }

      // const pastor = await this.pastorRepository.findOne({
      //   where: { id: familyGroup?.theirPastor?.id },
      // });

      // if (!pastor.recordStatus) {
      //   throw new BadRequestException(
      //     `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
      //   );
      // }

      // //* Validate and assign church according family house
      // if (!familyGroup?.theirChurch) {
      //   throw new NotFoundException(
      //     `Iglesia no fue encontrada, verifica que Grupo Familiar tenga una Iglesia asignada.`,
      //   );
      // }

      // const church = await this.churchRepository.findOne({
      //   where: { id: familyGroup?.theirChurch?.id },
      // });

      // if (!church.recordStatus) {
      //   throw new BadRequestException(
      //     `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
      //   );
      // }
    }
  }

  findAll() {
    return `This action returns all income`;
  }

  findOne(id: number) {
    return `This action returns a #${id} income`;
  }

  update(id: number, updateIncomeDto: UpdateOfferingIncomeDto) {
    return `This action updates a #${id} income`;
  }

  remove(id: number) {
    return `This action removes a #${id} income`;
  }

  //? PRIVATE METHODS
  // For future index errors or constrains with code.
  private handleDBExceptions(error: any): never {
    if (error.code === '23505') {
      const detail = error.detail;

      if (detail.includes('email')) {
        throw new BadRequestException('El correo electrónico ya está en uso.');
      }
    }

    this.logger.error(error);

    throw new InternalServerErrorException(
      'Sucedió un error inesperado, revise los registros de consola',
    );
  }
}
