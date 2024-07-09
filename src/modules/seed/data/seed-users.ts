import * as bcrypt from 'bcrypt';

interface SeedUser {
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  password: string;
  roles: string[];
}

interface SeedDataUsers {
  users: SeedUser[];
}

export const dataUsers: SeedDataUsers = {
  users: [
    {
      firstName: 'Luisa Maria',
      lastName: 'Torres Zapata',
      email: 'luisa@google.com',
      gender: 'female',
      password: bcrypt.hashSync('Abc1234', 10),
      roles: ['admin-user'],
    },
    {
      firstName: 'Eva Daniela',
      lastName: 'Carranza Valle',
      email: 'eva@google.com',
      gender: 'female',
      password: bcrypt.hashSync('Abc1234', 10),
      roles: ['treasurer-user'],
    },
    {
      firstName: 'Luz Estrella',
      lastName: 'Vallejo Zambrano',
      email: 'luz@google.com',
      gender: 'female',
      password: bcrypt.hashSync('Abc1234', 10),
      roles: ['user'],
    },
  ],
};
