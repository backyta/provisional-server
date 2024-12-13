interface Options {
  firstNames: string;
  lastNames: string;
}

export const getInitialFullNames = ({
  firstNames,
  lastNames,
}: Options): string => {
  const firstNamesValue = firstNames.split(' ');
  const lastNamesValue = lastNames.split(' ');

  return `${firstNamesValue[0]} ${lastNamesValue[0]}`;
};
