interface SeedPastor {
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
  theirChurch?: string;
}

interface SeedDataPastors {
  pastors: SeedPastor[];
}

export const dataPastors: SeedDataPastors = {
  pastors: [
    {
      firstName: 'Michael Rodrigo',
      lastName: 'Vega Rosales',
      gender: 'male',
      originCountry: 'Peru',
      birthDate: '1968-08-25',
      maritalStatus: 'married',
      numberChildren: 3,
      conversionDate: '2005-06-05',
      email: 'michael.vega@google.com',
      phoneNumber: '990-555-876',
      districtResidence: 'Independencia',
      urbanSectorResidence: 'Tahuantinsuyo',
      addressResidence: 'Jr. Tamputoco 100',
      addressResidenceReference: 'A 2 cuadras del parque cantuta',
      roles: ['pastor', 'disciple'],
    },
    {
      firstName: 'Daniel Jesus',
      lastName: 'Perez Torres',
      gender: 'male',
      originCountry: 'Peru',
      birthDate: '1970-12-08',
      maritalStatus: 'married',
      numberChildren: 4,
      conversionDate: '2006-03-10',
      email: 'daniel.perez@google.com',
      phoneNumber: '999-555-578',
      districtResidence: 'Independencia',
      urbanSectorResidence: 'Ermitaño',
      addressResidence: 'Jr. Las flores 125',
      addressResidenceReference:
        'Casa blanca al frente del colegio Maria Parado',
      roles: ['pastor', 'disciple'],
    },
    {
      firstName: 'Carlos Antonio',
      lastName: 'Prado Torrealva',
      gender: 'male',
      originCountry: 'Peru',
      birthDate: '1978-05-20',
      maritalStatus: 'married',
      numberChildren: 2,
      conversionDate: '2010-07-15',
      email: 'carlos.prado@google.com',
      phoneNumber: '+1-555-1234',
      districtResidence: 'Independencia',
      urbanSectorResidence: 'Payet',
      addressResidence: 'Av. Tupac Amaru 500',
      addressResidenceReference: 'A 2 cuadras del mercado productores',
      roles: ['pastor', 'disciple'],
    },
  ],
};
