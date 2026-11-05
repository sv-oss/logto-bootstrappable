import nock from 'nock';

import { ServerClient } from 'postmark';

describe('Postmark client', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('sends a template message through the HTTP client', async () => {
    const scope = nock('https://api.postmarkapp.com')
      .post('/email/withTemplate', {
        From: 'sender@example.com',
        To: 'recipient@example.com',
        TemplateAlias: 'sign-in',
        TemplateModel: { code: '123456' },
      })
      .reply(200, {
        ErrorCode: 0,
        Message: 'OK',
        MessageID: '00000000-0000-0000-0000-000000000000',
      });

    const client = new ServerClient('server-token');
    await client.sendEmailWithTemplate({
      From: 'sender@example.com',
      To: 'recipient@example.com',
      TemplateAlias: 'sign-in',
      TemplateModel: { code: '123456' },
    });

    expect(scope.isDone()).toBe(true);
  });
});
