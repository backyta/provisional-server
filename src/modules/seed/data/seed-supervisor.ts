interface SeedSupervisor {
  //* General Info
  firstName: string;
  lastName: string;
  gender: string;
  originCountry: string;
  dateBirth: string | Date;
  age?: number;
  maritalStatus: string;
  numberChildren?: number;
  conversionDate?: string | Date;
  isDirectRelationToPastor: boolean;

  //* Contact Info
  email: string;
  phoneNumber: string;
  countryResidence?: string;
  departmentResidence?: string;
  provinceResidence?: string;
  districtResidence: string;
  urbanSectorResidence: string;
  addressResidence: string;
  addressResidenceReference: string;
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
      dateBirth: '1989-09-03',
      maritalStatus: 'married',
      numberChildren: 3,
      conversionDate: '2007-11-20',
      email: 'gabriela.fernandez@google.com',
      phoneNumber: '+1-234-5678',
      districtResidence: 'Independencia',
      urbanSectorResidence: 'Tahuantinsuyo',
      addressResidence: 'Av. Los Nogales 890',
      addressResidenceReference: 'Frente al parque zonal',
      roles: ['supervisor', 'disciple'],
      isDirectRelationToPastor: false,
    },
    {
      firstName: 'Juan',
      lastName: 'Lopez Martinez',
      gender: 'male',
      originCountry: 'Peru',
      dateBirth: '1984-05-16',
      maritalStatus: 'single',
      numberChildren: 0,
      conversionDate: '2005-08-30',
      email: 'juan.lopez@google.com',
      phoneNumber: '+1-678-9012',
      districtResidence: 'Independencia',
      urbanSectorResidence: 'Ermitaño',
      addressResidence: 'Jr. Las Acacias 567',
      addressResidenceReference: 'Cerca del mercado municipal',
      roles: ['supervisor', 'disciple'],
      isDirectRelationToPastor: false,
    },
    {
      firstName: 'Sandra',
      lastName: 'Ramirez Silva',
      gender: 'female',
      originCountry: 'Peru',
      dateBirth: '1993-02-12',
      maritalStatus: 'divorced',
      numberChildren: 1,
      conversionDate: '2011-03-25',
      email: 'sandra.ramirez@google.com',
      phoneNumber: '+1-890-1234',
      districtResidence: 'Independencia',
      urbanSectorResidence: 'Payet',
      addressResidence: 'Av. Las Hortensias 234',
      addressResidenceReference: 'Cerca del parque industrial',
      roles: ['supervisor', 'disciple'],
      isDirectRelationToPastor: false,
    },
    {
      firstName: 'Ricardo',
      lastName: 'Gomez Diaz',
      gender: 'male',
      originCountry: 'Peru',
      dateBirth: '1981-07-30',
      maritalStatus: 'married',
      numberChildren: 2,
      conversionDate: '2002-12-15',
      email: 'ricardo.gomez@google.com',
      phoneNumber: '+1-345-6789',
      districtResidence: 'Independencia',
      urbanSectorResidence: 'Unificada',
      addressResidence: 'Jr. Los Laureles 890',
      addressResidenceReference: 'Al lado del centro educativo',
      roles: ['supervisor', 'disciple'],
      isDirectRelationToPastor: false,
    },
    {
      firstName: 'Maria',
      lastName: 'Perez Rodriguez',
      gender: 'female',
      originCountry: 'Peru',
      dateBirth: '1990-11-25',
      maritalStatus: 'widower',
      numberChildren: 4,
      conversionDate: '2008-06-20',
      email: 'maria.perez@google.com',
      phoneNumber: '+1-901-2345',
      districtResidence: 'Independencia',
      urbanSectorResidence: 'Industrial',
      addressResidence: 'Av. Los Cipreses 567',
      addressResidenceReference: 'Frente a la fábrica textil',
      roles: ['supervisor', 'disciple'],
      isDirectRelationToPastor: false,
    },
    {
      firstName: 'Diego',
      lastName: 'Castro Alvarez',
      gender: 'male',
      originCountry: 'Peru',
      dateBirth: '1987-04-20',
      maritalStatus: 'single',
      numberChildren: 0,
      conversionDate: '2006-10-10',
      email: 'diego.castro@google.com',
      phoneNumber: '+1-012-3456',
      districtResidence: 'Independencia',
      urbanSectorResidence: 'Ermitaño',
      addressResidence: 'Jr. Las Orquídeas 123',
      addressResidenceReference: 'Cerca del parque zonal',
      roles: ['supervisor', 'disciple'],
      isDirectRelationToPastor: false,
    },
  ],
};
