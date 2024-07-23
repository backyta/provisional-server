interface SeedPreacher {
  //* General Info
  firstName: string;
  lastName: string;
  gender: string;
  originCountry: string;
  birthDate: string | Date;
  age?: number;
  maritalStatus: string;
  numberChildren?: number;
  conversionDate?: string | Date;

  //* Contact Info
  email: string;
  phoneNumber: string;
  country?: string;
  department?: string;
  province?: string;
  district: string;
  urbanSector: string;
  address: string;
  referenceAddress: string;
  roles: string[];
  recordStatus?: string;

  //* Relations
  theirSupervisor?: string;
}

interface SeedDataPreachers {
  preachers: SeedPreacher[];
}

export const dataPreachers: SeedDataPreachers = {
  preachers: [
    {
      firstName: 'Marcelo',
      lastName: 'Quispe Ramos',
      gender: 'male',
      originCountry: 'Peru',
      birthDate: '1980-07-08',
      maritalStatus: 'divorced',
      numberChildren: 2,
      conversionDate: '2001-09-15',
      email: 'marcelo.quispe@google.com',
      phoneNumber: '+1-456-7890',
      district: 'Independencia',
      urbanSector: 'Unificada',
      address: 'Av. Los Girasoles 678',
      referenceAddress: 'Cerca del centro comercial',
      roles: ['preacher', 'disciple'],
    },
    {
      firstName: 'Susana',
      lastName: 'Flores Diaz',
      gender: 'female',
      originCountry: 'Peru',
      birthDate: '1995-11-30',
      maritalStatus: 'single',
      numberChildren: 0,
      conversionDate: '2013-04-20',
      email: 'susana.flores@google.com',
      phoneNumber: '+1-890-1234',
      district: 'Independencia',
      urbanSector: 'Ermitaño',
      address: 'Jr. Los Pinos 890',
      referenceAddress: 'Frente al parque zonal',
      roles: ['preacher', 'disciple'],
    },
    {
      firstName: 'Raul',
      lastName: 'Gutierrez Torres',
      gender: 'male',
      originCountry: 'Peru',
      birthDate: '1976-04-18',
      maritalStatus: 'widowed',
      numberChildren: 3,
      conversionDate: '1998-12-10',
      email: 'raul.gutierrez@google.com',
      phoneNumber: '+1-678-9012',
      district: 'Independencia',
      urbanSector: 'Tahuantinsuyo',
      address: 'Av. Los Cerezos 345',
      referenceAddress: 'Cerca del colegio San Jose',
      roles: ['preacher', 'disciple'],
    },
    {
      firstName: 'Jorge',
      lastName: 'Mendoza Lopez',
      gender: 'male',
      originCountry: 'Peru',
      birthDate: '1983-09-25',
      maritalStatus: 'married',
      numberChildren: 1,
      conversionDate: '2004-08-05',
      email: 'jorge.mendoza@google.com',
      phoneNumber: '+1-234-5678',
      district: 'Independencia',
      urbanSector: 'Payet',
      address: 'Jr. Los Olivos 567',
      referenceAddress: 'Al lado del centro de salud',
      roles: ['preacher', 'disciple'],
    },
    {
      firstName: 'Veronica',
      lastName: 'Sanchez Silva',
      gender: 'female',
      originCountry: 'Peru',
      birthDate: '1991-12-12',
      maritalStatus: 'single',
      numberChildren: 0,
      conversionDate: '2010-10-20',
      email: 'veronica.sanchez@google.com',
      phoneNumber: '+1-345-6789',
      district: 'Independencia',
      urbanSector: 'Industrial',
      address: 'Av. Los Claveles 123',
      referenceAddress: 'Frente a la fábrica de muebles',
      roles: ['preacher', 'disciple'],
    },
    {
      firstName: 'Manuel',
      lastName: 'Diaz Medina',
      gender: 'male',
      originCountry: 'Peru',
      birthDate: '1987-05-03',
      maritalStatus: 'married',
      numberChildren: 4,
      conversionDate: '2009-07-15',
      email: 'manuel.diaz@google.com',
      phoneNumber: '+1-901-2345',
      district: 'Independencia',
      urbanSector: 'Ermitaño',
      address: 'Jr. Las Orquídeas 890',
      referenceAddress: 'A una cuadra del mercado',
      roles: ['preacher', 'disciple'],
    },
    {
      firstName: 'Natalia',
      lastName: 'Chavez Castillo',
      gender: 'female',
      originCountry: 'Peru',
      birthDate: '1986-08-19',
      maritalStatus: 'married',
      numberChildren: 2,
      conversionDate: '2007-06-25',
      email: 'natalia.chavez@google.com',
      phoneNumber: '+1-567-8901',
      district: 'Independencia',
      urbanSector: 'Tahuantinsuyo',
      address: 'Av. Los Cedros 456',
      referenceAddress: 'Cerca del parque principal',
      roles: ['preacher', 'disciple'],
    },
    {
      firstName: 'Carlos',
      lastName: 'Hernandez Perez',
      gender: 'male',
      originCountry: 'Peru',
      birthDate: '1979-01-14',
      maritalStatus: 'single',
      numberChildren: 0,
      conversionDate: '2000-11-30',
      email: 'carlos.hernandez@google.com',
      phoneNumber: '+1-678-9012',
      district: 'Independencia',
      urbanSector: 'Unificada',
      address: 'Jr. Las Azucenas 789',
      referenceAddress: 'Cerca del centro deportivo',
      roles: ['preacher', 'disciple'],
    },
    {
      firstName: 'Mariana',
      lastName: 'Alvarez Ramirez',
      gender: 'female',
      originCountry: 'Peru',
      birthDate: '1984-06-28',
      maritalStatus: 'divorced',
      numberChildren: 1,
      conversionDate: '2003-04-15',
      email: 'mariana.alvarez@google.com',
      phoneNumber: '+1-345-6789',
      district: 'Independencia',
      urbanSector: 'Ermitaño',
      address: 'Av. Las Margaritas 234',
      referenceAddress: 'Frente al supermercado',
      roles: ['preacher', 'disciple'],
    },
    {
      firstName: 'Roberto',
      lastName: 'Garcia Gonzales',
      gender: 'male',
      originCountry: 'Peru',
      birthDate: '1977-03-05',
      maritalStatus: 'widowed',
      numberChildren: 5,
      conversionDate: '1999-10-10',
      email: 'roberto.garcia@google.com',
      phoneNumber: '+1-012-3456',
      district: 'Independencia',
      urbanSector: 'Industrial',
      address: 'Jr. Los Lirios 678',
      referenceAddress: 'Cerca del hospital',
      roles: ['preacher', 'disciple'],
    },
  ],
};
