const request = require('supertest');
const nock = require('nock');
const cheerio = require('cheerio');
const { sampleHtmlWithYale } = require('./test-utils');
const app = require('../app');

describe('Integration Tests', () => {
  beforeAll(() => {
    // Disable real HTTP calls except localhost (for Supertest)
    nock.disableNetConnect();
    nock.enableNetConnect(/(127\.0\.0\.1|localhost)/);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  test('Should replace Yale with Fale in fetched content', async () => {
    // Mock the external request that app.js makes
    nock('https://example.com')
      .get('/')
      .reply(200, sampleHtmlWithYale);

    // Call the app directly through Supertest
    const response = await request(app)
      .post('/fetch')
      .send({ url: 'https://example.com/' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Load returned HTML and verify replacements
    const $ = cheerio.load(response.body.content);
    expect($('title').text()).toBe('Fale University Test Page');
    expect($('h1').text()).toBe('Welcome to Fale University');
    expect($('p').first().text()).toContain('Fale University is a private');
  });

  test('Should handle missing URL parameter', async () => {
    const response = await request(app)
      .post('/fetch')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('URL is required');
  });
});
