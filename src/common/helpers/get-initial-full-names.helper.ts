interface Options {
  firstNames: string;
  lastNames: string;
}

export const getInitialFullNames = ({
  firstNames,
  lastNames,
}: Options): string => {
  const firstName = firstNames.split(' ');
  const lastName = lastNames.split(' ');

  return lastName[0]
    ? `${firstName[0]} ${lastName[0]}`
    : `${firstName[0]}${lastName[0]}`;
};
