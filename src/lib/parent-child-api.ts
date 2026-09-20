export type ExternalChild = {
  id: string;
  parentId: string;
  name: string;
  username: string;
  email: string;
  expireDate: string | null;
  isPremium: boolean;
};

export type ExternalParent = {
  id: string;
  name: string;
  email: string;
  children: ExternalChild[];
};

type ExternalParentChildResponse = {
  parents?: ExternalParent[];
};

export async function getExternalParentChildren() {
  const baseUrl = process.env.PARENT_CHILD_API_URL?.trim();
  const serviceToken = process.env.PARENT_CHILD_API_TOKEN?.trim();
  if (!baseUrl || !serviceToken) return null;

  const response = await fetch(
    new URL('/api/admin/parent-child', baseUrl),
    {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${serviceToken}`,
      },
      cache: 'no-store',
    }
  );
  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      'error' in payload &&
      typeof payload.error === 'string'
        ? payload.error
        : 'Unable to load Parent/Child data from the external API.';
    throw new Error(
      message
    );
  }
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('parents' in payload) ||
    !Array.isArray(payload.parents)
  ) {
    throw new Error('External Parent/Child API returned an invalid response.');
  }
  return payload.parents as ExternalParent[];
}
