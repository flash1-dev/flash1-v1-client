import { Flash1Client } from '../src';

describe('Flash1Client', () => {

  it('has separate modules', () => {
    const client = new Flash1Client('https://example.com');
    expect(client.ethPrivate).toBeTruthy();
    // expect(client.eth).toBeTruthy(); // TODO: fix this
    expect(client.onboarding).toBeTruthy();
    expect(client.private).toBeTruthy();
    expect(client.public).toBeTruthy();
  });
});
