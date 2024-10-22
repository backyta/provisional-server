interface SeedMainChurch {
  //* General Info
  churchName: string;
  isAnexe?: boolean;
  serviceTimes: string[];
  foundingDate: Date;

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
  recordStatus?: string;
}
interface SeedAnexes {
  //* General Info
  churchName: string;
  isAnexe?: boolean;
  serviceTimes: string[];
  foundingDate: Date;

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
  recordStatus?: string;

  //* Relations
  theirMainChurch?: string;
}

interface SeedDataChurches {
  anexes: SeedAnexes[];
  mainChurch: SeedMainChurch[];
}

export const dataChurches: SeedDataChurches = {
  mainChurch: [
    {
      churchName: 'Iglesia Central',
      serviceTimes: ['9:00', '16:00'],
      foundingDate: new Date('2020-11-20'),
      email: 'iglesia.central@google.com',
      phoneNumber: '999-999-999',
      country: 'Peru',
      department: 'Lima',
      province: 'Lima',
      district: 'Independencia',
      urbanSector: 'Tahuantinsuyo',
      address: 'Jr. Condor 123',
      referenceAddress: 'Al frente del colegio Maria Auxiliadora',
    },
  ],

  anexes: [
    {
      churchName: 'Iglesia - Anexo 1',
      serviceTimes: ['11:00', '18:00'],
      foundingDate: new Date('2021-08-12'),
      email: 'iglesia.anexo1@google.com',
      phoneNumber: '999-999-999',
      country: 'Peru',
      department: 'Lima',
      province: 'Lima',
      district: 'Independencia',
      urbanSector: 'Ermitaño',
      address: 'Jr. Charqui 4510',
      referenceAddress: 'A cuadras del mercado central',
    },
    {
      churchName: 'Iglesia - Anexo 2',
      serviceTimes: ['10:00', '17:00'],
      foundingDate: new Date('2023-03-17'),
      email: 'iglesia.anexo2@google.com',
      phoneNumber: '999-999-999',
      country: 'Peru',
      department: 'Lima',
      province: 'Lima',
      district: 'Independencia',
      urbanSector: 'Payet',
      address: 'Jr. Condorcanqui 2012',
      referenceAddress: 'Al costado de la fabrica de vidrios',
    },
  ],
};
