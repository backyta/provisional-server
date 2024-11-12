import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrderValue, ILike, Raw, Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { UserRole, UserRoleNames } from '@/modules/auth/enums';

import { GenderNames, RecordStatus } from '@/common/enums';
import { PaginationDto, SearchAndPaginationDto } from '@/common/dtos';

import { User } from '@/modules/user/entities';
import { CreateUserDto, UpdateUserDto } from '@/modules/user/dto';
import { UserSearchType, UserSearchTypeNames } from '@/modules/user/enums';

@Injectable()
export class UserService {
  private readonly logger = new Logger('UserService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  //* CREATE USER
  async create(createUserDto: CreateUserDto, user: User) {
    const { password, ...userData } = createUserDto;

    try {
      const newUser = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10),
        createdBy: user,
        createdAt: new Date(),
      });

      await this.userRepository.save(newUser);
      delete newUser.password;
      return {
        ...newUser,
      };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<User[]> {
    const { limit, offset = 0, order = 'ASC' } = paginationDto;

    try {
      const users = await this.userRepository.find({
        where: { recordStatus: RecordStatus.Active },
        take: limit,
        skip: offset,
        relations: ['updatedBy', 'createdBy'],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (users.length === 0) {
        throw new NotFoundException(
          `No existen registros disponibles para mostrar.`,
        );
      }

      return users;
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
  ): Promise<User[]> {
    const {
      'search-type': searchType,
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

    //? Find by first name --> Many
    if (term && searchType === UserSearchType.FirstName) {
      const firstNames = term.replace(/\+/g, ' ');

      let users: User[];
      try {
        users = await this.userRepository.find({
          where: {
            firstName: ILike(`%${firstNames}%`),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: ['updatedBy', 'createdBy'],
          order: { createdAt: order as FindOptionsOrderValue },
        });
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador.`,
        );
      }

      if (users.length === 0) {
        throw new NotFoundException(
          `No se encontraron usuarios con estos nombres: ${firstNames}`,
        );
      }

      return users;
    }

    //? Find by last name --> Many
    if (term && searchType === UserSearchType.LastName) {
      const lastNames = term.replace(/\+/g, ' ');

      let users: User[];
      try {
        users = await this.userRepository.find({
          where: {
            lastName: ILike(`%${lastNames}%`),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: ['updatedBy', 'createdBy'],
          order: { createdAt: order as FindOptionsOrderValue },
        });
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador.`,
        );
      }

      if (users.length === 0) {
        throw new NotFoundException(
          `No se encontraron usuarios con estos apellidos: ${lastNames}`,
        );
      }

      return users;
    }

    //? Find by full name --> Many
    if (term && searchType === UserSearchType.FullName) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      let users: User[];
      try {
        users = await this.userRepository.find({
          where: {
            firstName: ILike(`%${firstNames}%`),
            lastName: ILike(`%${lastNames}%`),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: ['updatedBy', 'createdBy'],
          order: { createdAt: order as FindOptionsOrderValue },
        });
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador.`,
        );
      }

      if (users.length === 0) {
        throw new NotFoundException(
          `No se encontraron usuarios con estos nombres y apellidos: ${firstNames} ${lastNames}`,
        );
      }

      return users;
    }

    //? Find by roles --> Many
    if (term && searchType === UserSearchType.Roles) {
      const rolesArray = term.split('+');

      let users: User[];
      try {
        users = await this.userRepository.find({
          where: {
            roles: Raw((alias) => `ARRAY[:...rolesArray]::text[] && ${alias}`, {
              rolesArray,
            }),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: ['updatedBy', 'createdBy'],
          order: { createdAt: order as FindOptionsOrderValue },
        });
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador.`,
        );
      }

      if (users.length === 0) {
        const rolesInSpanish = rolesArray
          .map((role) => UserRoleNames[role] ?? role)
          .join(' - ');

        throw new NotFoundException(
          `No se encontraron usuarios con estos roles: ${rolesInSpanish}`,
        );
      }

      return users;
    }

    //? Find by gender --> Many
    if (term && searchType === UserSearchType.Gender) {
      const genderTerm = term.toLowerCase();
      const validGenders = ['male', 'female'];

      if (!validGenders.includes(genderTerm)) {
        throw new BadRequestException(`Género no válido: ${term}`);
      }

      let users: User[];
      try {
        users = await this.userRepository.find({
          where: {
            gender: genderTerm,
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: ['updatedBy', 'createdBy'],
          order: { createdAt: order as FindOptionsOrderValue },
        });
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador.`,
        );
      }

      if (users.length === 0) {
        const genderInSpanish = GenderNames[term.toLowerCase()] ?? term;

        throw new NotFoundException(
          `No se encontraron usuarios con este género: ${genderInSpanish}`,
        );
      }

      return users;
    }

    //? Find by status --> Many
    if (term && searchType === UserSearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', 'inactive'];

      if (!validRecordStatus.includes(recordStatusTerm)) {
        throw new BadRequestException(`Estado de registro no válido: ${term}`);
      }

      let users: User[];
      try {
        users = await this.userRepository.find({
          where: {
            recordStatus: recordStatusTerm,
          },
          take: limit,
          skip: offset,
          relations: ['updatedBy', 'createdBy'],
          order: { createdAt: order as FindOptionsOrderValue },
        });
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador.`,
        );
      }

      if (users.length === 0) {
        const value = term === RecordStatus.Inactive ? 'Inactivo' : 'Activo';

        throw new NotFoundException(
          `No se encontraron usuarios con este estado de registro: ${value}`,
        );
      }

      return users;
    }

    //! General Exceptions
    if (
      term &&
      !Object.values(UserSearchType).includes(searchType as UserSearchType)
    ) {
      throw new BadRequestException(
        `Tipos de búsqueda no validos, solo son validos: ${Object.values(UserSearchTypeNames).join(', ')}`,
      );
    }
  }

  //* UPDATE USER
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    user: User,
  ): Promise<User> {
    const {
      firstName,
      lastName,
      gender,
      email,
      roles,
      recordStatus,
      currentPassword,
      newPassword,
    } = updateUserDto;

    if (!isUUID(id)) {
      throw new BadRequestException(`Not valid UUID`);
    }

    const dataUser = await this.userRepository.findOne({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        roles: true,
        recordStatus: true,
        email: true,
        gender: true,
        password: true,
      },
    });

    if (!dataUser) {
      throw new NotFoundException(`Usuario con id: ${id} no fue encontrado.`);
    }

    if (
      currentPassword &&
      newPassword &&
      !bcrypt.compareSync(currentPassword, dataUser.password)
    ) {
      throw new UnauthorizedException(
        `La contraseña actual no coincide con la registrada en la base de datos.`,
      );
    }

    if (
      dataUser.recordStatus === RecordStatus.Active &&
      recordStatus === RecordStatus.Inactive
    ) {
      throw new BadRequestException(
        `No se puede actualizar un registro a "Inactivo", se debe eliminar.`,
      );
    }

    if (newPassword) {
      try {
        const updateUser = await this.userRepository.preload({
          id: id,
          firstName: firstName,
          lastName: lastName,
          gender: gender,
          roles: roles,
          email: email,
          password: bcrypt.hashSync(newPassword, 10),
          recordStatus: recordStatus,
          updatedAt: new Date(),
          updatedBy: user,
        });

        return await this.userRepository.save(updateUser);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    if (!newPassword) {
      try {
        const updateUser = await this.userRepository.preload({
          id: id,
          firstName: firstName,
          lastName: lastName,
          gender: gender,
          roles: roles,
          email: email,
          recordStatus: recordStatus,
          updatedAt: new Date(),
          updatedBy: user,
        });

        return await this.userRepository.save(updateUser);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }
  }

  //! DELETE USER
  async delete(id: string, user: User): Promise<void> {
    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido`);
    }

    const dataUser = await this.userRepository.findOneBy({ id });

    if (!dataUser) {
      throw new NotFoundException(`Usuario con id: ${id} no fue encontrado.`);
    }

    if (dataUser.roles.includes(UserRole.SuperUser)) {
      throw new BadRequestException(
        `Usuario con rol "Super-Usuario" no puede ser eliminado.`,
      );
    }

    try {
      const deleteUser = await this.userRepository.preload({
        id: dataUser.id,
        recordStatus: RecordStatus.Inactive,
        updatedAt: new Date(),
        updatedBy: user,
      });

      await this.userRepository.save(deleteUser);
    } catch (error) {
      this.handleDBExceptions(error);
    }
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
      'Sucedió un error inesperado, hable con el administrador y que revise los registros de consola.',
    );
  }
}
