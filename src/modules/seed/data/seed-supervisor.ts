interface SeedSupervisor {
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
  isDirectRelationToPastor: boolean;

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
  status?: string;

  //* Relations
  theirCopastor?: string;
  theirPastor?: string;
}

interface SeedDataSupervisors {
  supervisors: SeedSupervisor[];
}

//! Data Supervisors
export const dataSupervisors: SeedDataSupervisors = {
  supervisors: [
    {
      firstName: 'Gabriela',
      lastName: 'Fernandez Torres',
      gender: 'female',
      originCountry: 'Peru',
      birthDate: '1989-09-03',
      maritalStatus: 'married',
      numberChildren: 3,
      conversionDate: '2007-11-20',
      email: 'gabriela.fernandez@google.com',
      phoneNumber: '+1-234-5678',
      district: 'Independencia',
      urbanSector: 'Tahuantinsuyo',
      address: 'Av. Los Nogales 890',
      referenceAddress: 'Frente al parque zonal',
      roles: ['supervisor', 'disciple'],
      isDirectRelationToPastor: false,
    },
    {
      firstName: 'Juan',
      lastName: 'Lopez Martinez',
      gender: 'male',
      originCountry: 'Peru',
      birthDate: '1984-05-16',
      maritalStatus: 'single',
      numberChildren: 0,
      conversionDate: '2005-08-30',
      email: 'juan.lopez@google.com',
      phoneNumber: '+1-678-9012',
      district: 'Independencia',
      urbanSector: 'Ermitaño',
      address: 'Jr. Las Acacias 567',
      referenceAddress: 'Cerca del mercado municipal',
      roles: ['supervisor', 'disciple'],
      isDirectRelationToPastor: false,
    },
    {
      firstName: 'Sandra',
      lastName: 'Ramirez Silva',
      gender: 'female',
      originCountry: 'Peru',
      birthDate: '1993-02-12',
      maritalStatus: 'divorced',
      numberChildren: 1,
      conversionDate: '2011-03-25',
      email: 'sandra.ramirez@google.com',
      phoneNumber: '+1-890-1234',
      district: 'Independencia',
      urbanSector: 'Payet',
      address: 'Av. Las Hortensias 234',
      referenceAddress: 'Cerca del parque industrial',
      roles: ['supervisor', 'disciple'],
      isDirectRelationToPastor: false,
    },
    {
      firstName: 'Ricardo',
      lastName: 'Gomez Diaz',
      gender: 'male',
      originCountry: 'Peru',
      birthDate: '1981-07-30',
      maritalStatus: 'married',
      numberChildren: 2,
      conversionDate: '2002-12-15',
      email: 'ricardo.gomez@google.com',
      phoneNumber: '+1-345-6789',
      district: 'Independencia',
      urbanSector: 'Unificada',
      address: 'Jr. Los Laureles 890',
      referenceAddress: 'Al lado del centro educativo',
      roles: ['supervisor', 'disciple'],
      isDirectRelationToPastor: false,
    },
    {
      firstName: 'Maria',
      lastName: 'Perez Rodriguez',
      gender: 'female',
      originCountry: 'Peru',
      birthDate: '1990-11-25',
      maritalStatus: 'widowed',
      numberChildren: 4,
      conversionDate: '2008-06-20',
      email: 'maria.perez@google.com',
      phoneNumber: '+1-901-2345',
      district: 'Independencia',
      urbanSector: 'Industrial',
      address: 'Av. Los Cipreses 567',
      referenceAddress: 'Frente a la fábrica textil',
      roles: ['supervisor', 'disciple'],
      isDirectRelationToPastor: false,
    },
    {
      firstName: 'Diego',
      lastName: 'Castro Alvarez',
      gender: 'male',
      originCountry: 'Peru',
      birthDate: '1987-04-20',
      maritalStatus: 'single',
      numberChildren: 0,
      conversionDate: '2006-10-10',
      email: 'diego.castro@google.com',
      phoneNumber: '+1-012-3456',
      district: 'Independencia',
      urbanSector: 'Ermitaño',
      address: 'Jr. Las Orquídeas 123',
      referenceAddress: 'Cerca del parque zonal',
      roles: ['supervisor', 'disciple'],
      isDirectRelationToPastor: false,
    },
  ],
};
