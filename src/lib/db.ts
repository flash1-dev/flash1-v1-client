// TODO: Get rid of this file.

import * as uuid from 'uuid';

const UUID_NAMESPACE = 'eac9b3fd-459b-4aa1-9c85-eebe902512bc';

export function getUserId(address: string): string {
  return uuid.v5(Buffer.from(address.toLowerCase()), UUID_NAMESPACE);
}

export function getAccountId({
  address,
  accountNumber = '0',
}: {
  address: string;
  accountNumber?: string;
}) {
  return uuid.v5(
    Buffer.from(`${getUserId(address)}${accountNumber}`),
    UUID_NAMESPACE
  );
}
