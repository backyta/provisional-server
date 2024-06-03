interface SeedCopastor {
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
  theirPastor?: string;
}

interface SeedDataCopastors {
  members: SeedCopastor[];
}

//! Data Copastors
export const dataCopastors: SeedDataCopastors = {
  members: [
    {
      firstName: 'Luz Mariella',
      lastName: 'Salgado Huaman',
      gender: 'female',
      originCountry: 'Peru',
      birthDate: '1987-03-15',
      maritalStatus: 'married',
      numberChildren: 2,
      conversionDate: '2007-03-15',
      email: 'luz.salgado@google.com',
      phoneNumber: '+1-623-1091',
      districtResidence: 'Independencia',
      urbanSectorResidence: 'Payet',
      addressResidence: 'Av. Cariancha 231',
      addressResidenceReference: 'A 2 cuadras del colegio',
      roles: ['copastor', 'disciple'],
    },
    {
      firstName: 'Eduardo',
      lastName: 'Cordova Flores',
      gender: 'male',
      originCountry: 'Peru',
      birthDate: '1992-08-21',
      maritalStatus: 'single',
      numberChildren: 0,
      conversionDate: '2010-05-12',
      email: 'eduardo.cordova@google.com',
      phoneNumber: '+1-567-9876',
      districtResidence: 'Independencia',
      urbanSectorResidence: 'Ermitaño',
      addressResidence: 'Av. Los Pinos 512',
      addressResidenceReference: 'Frente a la plaza central',
      roles: ['copastor', 'disciple'],
    },
    {
      firstName: 'Carla',
      lastName: 'Gomez Rodriguez',
      gender: 'female',
      originCountry: 'Peru',
      birthDate: '1985-12-10',
      maritalStatus: 'married',
      numberChildren: 3,
      conversionDate: '2005-06-30',
      email: 'carla.gomez@google.com',
      phoneNumber: '+1-987-6543',
      districtResidence: 'Independencia',
      urbanSectorResidence: 'Tahuantinsuyo',
      addressResidence: 'Jr. Los Alamos 321',
      addressResidenceReference: 'Cerca del mercado municipal',
      roles: ['copastor', 'disciple'],
    },
    {
      firstName: 'Julio',
      lastName: 'Vargas Medina',
      gender: 'male',
      originCountry: 'Peru',
      birthDate: '1978-04-03',
      maritalStatus: 'widower',
      numberChildren: 2,
      conversionDate: '2000-11-17',
      email: 'julio.vargas@google.com',
      phoneNumber: '+1-234-5678',
      districtResidence: 'Independencia',
      urbanSectorResidence: 'Payet',
      addressResidence: 'Av. Los Jazmines 456',
      addressResidenceReference: 'Cerca del parque infantil',
      roles: ['copastor', 'disciple'],
    },
    {
      firstName: 'Ana',
      lastName: 'Torres Gutierrez',
      gender: 'female',
      originCountry: 'Peru',
      birthDate: '1990-02-28',
      maritalStatus: 'married',
      numberChildren: 1,
      conversionDate: '2009-09-05',
      email: 'ana.torres@google.com',
      phoneNumber: '+1-876-5432',
      districtResidence: 'Independencia',
      urbanSectorResidence: 'Ermitaño',
      addressResidence: 'Jr. Los Rosales 789',
      addressResidenceReference: 'A una cuadra de la iglesia',
      roles: ['copastor', 'disciple'],
    },
    {
      firstName: 'Pedro',
      lastName: 'Soto Chavez',
      gender: 'male',
      originCountry: 'Peru',
      birthDate: '1982-11-17',
      maritalStatus: 'married',
      numberChildren: 4,
      conversionDate: '2003-08-12',
      email: 'pedro.soto@google.com',
      phoneNumber: '+1-432-1098',
      districtResidence: 'Independencia',
      urbanSectorResidence: 'Tahuantinsuyo',
      addressResidence: 'Av. Los Laureles 123',
      addressResidenceReference: 'Al lado del colegio San Miguel',
      roles: ['copastor', 'disciple'],
    },
    {
      firstName: 'Luisa',
      lastName: 'Castillo Ramirez',
      gender: 'female',
      originCountry: 'Peru',
      birthDate: '1989-05-20',
      maritalStatus: 'single',
      numberChildren: 5,
      conversionDate: '2008-12-25',
      email: 'luisa.castillo@google.com',
      phoneNumber: '+1-321-0987',
      districtResidence: 'Independencia',
      urbanSectorResidence: 'Ermitaño',
      addressResidence: 'Jr. Los Sauces 345',
      addressResidenceReference: 'Frente a la estación de policía',
      roles: ['copastor', 'disciple'],
    },
  ],
};
