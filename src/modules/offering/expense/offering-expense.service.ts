import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { format } from 'date-fns';
import { isUUID } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsOrderValue, Repository } from 'typeorm';

import { dateFormatterToDDMMYYY } from '@/common/helpers';
import { RecordStatus, SearchTypeNames } from '@/common/enums';
import { PaginationDto, SearchAndPaginationDto } from '@/common/dtos';

import { User } from '@/modules/user/entities';
import { Church } from '@/modules/church/entities';

import {
  OfferingReasonEliminationType,
  OfferingReasonEliminationTypeNames,
} from '@/modules/offering/shared/enums';
import { DeleteOfferingDto } from '@/modules/offering/shared/dto';

import {
  UpdateOfferingExpenseDto,
  CreateOfferingExpenseDto,
} from '@/modules/offering/expense/dto';
import { OfferingExpense } from '@/modules/offering/expense/entities';
import { OfferingExpenseSearchType } from '@/modules/offering/expense/enums';
import { formatDataOfferingExpense } from '@/modules/offering/expense/helpers';

@Injectable()
export class OfferingExpenseService {
  private readonly logger = new Logger('IncomeService');

  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

    @InjectRepository(OfferingExpense)
    private readonly offeringExpenseRepository: Repository<OfferingExpense>,
  ) {}

  //* CREATE OFFERING EXPENSE
  async create(
    createOfferingExpenseDto: CreateOfferingExpenseDto,
    user: User,
  ): Promise<OfferingExpense> {
    const { churchId, type, imageUrls, amount } = createOfferingExpenseDto;

    //? All Types
    if (
      type === OfferingExpenseSearchType.SuppliesExpense ||
      type === OfferingExpenseSearchType.DecorationExpense ||
      type === OfferingExpenseSearchType.OperationalExpense ||
      type === OfferingExpenseSearchType.MaintenanceAndRepairExpense ||
      type === OfferingExpenseSearchType.ActivitiesAndEventsExpense ||
      type === OfferingExpenseSearchType.EquipmentAndTechnologyExpense
    ) {
      if (!churchId) {
        throw new NotFoundException(`La iglesia es requerida.`);
      }

      const church = await this.churchRepository.findOne({
        where: { id: churchId },
        relations: ['theirMainChurch'],
      });

      if (!church) {
        throw new NotFoundException(
          `Iglesia con id: ${churchId}, no fue encontrado.`,
        );
      }

      if (!church?.recordStatus) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
        );
      }

      try {
        const newOfferingExpense = this.offeringExpenseRepository.create({
          ...createOfferingExpenseDto,
          amount: +amount,
          church: church,
          imageUrls: imageUrls,
          createdAt: new Date(),
          createdBy: user,
        });

        return await this.offeringExpenseRepository.save(newOfferingExpense);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //? Expense adjustment
    if (type === OfferingExpenseSearchType.ExpenseAdjustment) {
      if (!churchId) {
        throw new NotFoundException(`La iglesia es requerida.`);
      }

      const church = await this.churchRepository.findOne({
        where: { id: churchId },
        relations: ['theirMainChurch'],
      });

      if (!church) {
        throw new NotFoundException(
          `Iglesia con id: ${churchId}, no fue encontrado.`,
        );
      }

      if (!church?.recordStatus) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
        );
      }

      try {
        const newOfferingIncome = this.offeringExpenseRepository.create({
          ...createOfferingExpenseDto,
          amount: +amount,
          subType: null,
          church: church,
          imageUrls: imageUrls,
          createdAt: new Date(),
          createdBy: user,
        });

        return await this.offeringExpenseRepository.save(newOfferingIncome);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }
  }

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<any[]> {
    const { limit, offset = 0, order = 'ASC' } = paginationDto;

    try {
      const offeringsExpenses = await this.offeringExpenseRepository.find({
        where: { recordStatus: RecordStatus.Active },
        take: limit,
        skip: offset,
        relations: ['updatedBy', 'createdBy', 'church'],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (offeringsExpenses.length === 0) {
        throw new NotFoundException(
          `No existen registros disponibles para mostrar.`,
        );
      }

      return formatDataOfferingExpense({
        offeringsExpenses,
      }) as any;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //* FIND BY TERM
  async findByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ): Promise<OfferingExpense | OfferingExpense[]> {
    const {
      'search-type': searchType,
      'search-sub-type': searchSubType,
      limit,
      offset = 0,
      order,
    } = searchTypeAndPaginationDto;

    if (!term) {
      throw new BadRequestException(`El termino de búsqueda es requerido.`);
    }

    if (!searchType) {
      throw new BadRequestException(`El tipo de búsqueda es requerido.`);
    }

    //* By date and church
    if (
      term &&
      (searchType === OfferingExpenseSearchType.ActivitiesAndEventsExpense ||
        searchType === OfferingExpenseSearchType.DecorationExpense ||
        searchType ===
          OfferingExpenseSearchType.EquipmentAndTechnologyExpense ||
        searchType === OfferingExpenseSearchType.MaintenanceAndRepairExpense ||
        searchType === OfferingExpenseSearchType.OperationalExpense ||
        searchType === OfferingExpenseSearchType.SuppliesExpense ||
        searchType === OfferingExpenseSearchType.ExpenseAdjustment)
    ) {
      const [churchId, date] = term.split('&');

      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
          },
        });

        if (!church) {
          throw new NotFoundException(
            `No se encontró ninguna iglesia con este ID: ${churchId}.`,
          );
        }

        const [fromTimestamp, toTimestamp] = date.split('+').map(Number);

        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }

        const fromDate = new Date(fromTimestamp);
        const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

        let offeringsExpenses: OfferingExpense[];
        if (searchType !== OfferingExpenseSearchType.ExpenseAdjustment) {
          offeringsExpenses = await this.offeringExpenseRepository.find({
            where: {
              type: searchType,
              subType: searchSubType ? searchSubType : null,
              church: church,
              date: Between(fromDate, toDate),
              recordStatus: RecordStatus.Active,
            },
            take: limit,
            skip: offset,
            relations: ['updatedBy', 'createdBy', 'church'],
            order: { createdAt: order as FindOptionsOrderValue },
          });
        }

        if (searchType === OfferingExpenseSearchType.ExpenseAdjustment) {
          offeringsExpenses = await this.offeringExpenseRepository.find({
            where: {
              type: searchType,
              church: church,
              date: Between(fromDate, toDate),
              recordStatus: RecordStatus.Active,
            },
            take: limit,
            skip: offset,
            relations: ['updatedBy', 'createdBy', 'church'],
            order: { createdAt: order as FindOptionsOrderValue },
          });
        }

        if (offeringsExpenses.length === 0) {
          const fromDate = dateFormatterToDDMMYYY(fromTimestamp);
          const toDate = dateFormatterToDDMMYYY(toTimestamp);

          throw new NotFoundException(
            `No se encontraron salidas de ofrendas (${SearchTypeNames[searchType]}) con esta iglesia: ${church?.churchName} y con este rango de fechas: ${fromDate} - ${toDate}`,
          );
        }

        return formatDataOfferingExpense({
          offeringsExpenses,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* By record status --> Many
    if (term && searchType === OfferingExpenseSearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', 'inactive'];

      try {
        if (!validRecordStatus.includes(recordStatusTerm)) {
          throw new BadRequestException(
            `Estado de registro no válido: ${term}`,
          );
        }

        const offeringsExpenses = await this.offeringExpenseRepository.find({
          where: {
            recordStatus: recordStatusTerm,
          },
          take: limit,
          skip: offset,
          relations: ['updatedBy', 'createdBy', 'church'],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (offeringsExpenses.length === 0) {
          const value = term === RecordStatus.Inactive ? 'Inactivo' : 'Activo';

          throw new NotFoundException(
            `No se encontraron salidas de ofrendas (${SearchTypeNames[searchType]}) con este estado de registro: ${value}`,
          );
        }

        return formatDataOfferingExpense({
          offeringsExpenses,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        if (error instanceof BadRequestException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }
  }

  //* UPDATE OFFERING EXPENSE
  async update(
    id: string,
    updateOfferingExpenseDto: UpdateOfferingExpenseDto,
    user: User,
  ) {
    const { type, amount, subType, churchId, imageUrls, recordStatus } =
      updateOfferingExpenseDto;

    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    //* Validations
    const offeringExpense = await this.offeringExpenseRepository.findOne({
      where: { id: id },
      relations: ['church'],
    });

    if (!offeringExpense) {
      throw new NotFoundException(
        `Salida de Ofrenda con id: ${id} no fue encontrado`,
      );
    }

    if (
      offeringExpense?.recordStatus === RecordStatus.Active &&
      recordStatus === RecordStatus.Inactive
    ) {
      throw new BadRequestException(
        `No se puede actualizar un registro a "Inactivo", se debe eliminar.`,
      );
    }

    if (type && type !== offeringExpense?.type) {
      throw new BadRequestException(
        `No se puede actualizar el tipo de este registro.`,
      );
    }

    if (subType && subType !== offeringExpense?.subType) {
      throw new BadRequestException(
        `No se puede actualizar el sub-tipo de este registro.`,
      );
    }

    if (churchId && churchId !== offeringExpense?.church?.id) {
      throw new BadRequestException(
        `No se puede actualizar la Iglesia a la que pertenece este registro.`,
      );
    }

    try {
      const updatedOfferingIncome =
        await this.offeringExpenseRepository.preload({
          id: offeringExpense?.id,
          ...updateOfferingExpenseDto,
          amount: +amount,
          imageUrls: [...offeringExpense.imageUrls, ...imageUrls],
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: recordStatus,
        });

      return await this.offeringExpenseRepository.save(updatedOfferingIncome);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //! DELETE OFFERING EXPENSE
  async remove(
    id: string,
    deleteOfferingIncomeDto: DeleteOfferingDto,
    user: User,
  ): Promise<void> {
    const { reasonEliminationType } = deleteOfferingIncomeDto;

    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    const offeringExpense = await this.offeringExpenseRepository.findOne({
      where: { id: id },
      relations: ['church'],
    });

    if (!offeringExpense) {
      throw new NotFoundException(
        `Salida de Ofrenda con id: ${id} no fue encontrado`,
      );
    }

    const existingComments = offeringExpense.comments || '';
    const newComments: string = `Fecha de eliminación: ${format(new Date(), 'dd/MM/yyyy')} \nMotivo de eliminación: ${OfferingReasonEliminationTypeNames[reasonEliminationType as OfferingReasonEliminationType]}\nUsuario: ${user.firstName} ${user.lastName}  `;
    const updatedComments = `${existingComments}\n${newComments}`;

    //* Update and set in Inactive on Offering Expense
    try {
      const updatedOfferingExpense =
        await this.offeringExpenseRepository.preload({
          id: offeringExpense.id,
          comments: updatedComments,
          reasonElimination: reasonEliminationType,
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: RecordStatus.Inactive,
        });

      await this.offeringExpenseRepository.save(updatedOfferingExpense);
    } catch (error) {
      this.handleDBExceptions(error);
    }

    return;
  }

  //? PRIVATE METHODS
  // For future index errors or constrains with code.
  private handleDBExceptions(error: any): never {
    if (error.code === '23505') {
      throw new BadRequestException(`${error.message}`);
    }

    this.logger.error(error);

    throw new InternalServerErrorException(
      'Sucedió un error inesperado, hable con el administrador y que revise los registros de consola.',
    );
  }
}
