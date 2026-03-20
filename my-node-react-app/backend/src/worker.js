require('dotenv').config();
const { Worker } = require('bullmq');
const db = require('./config/db');
const logger = require('./utils/logger');
const mailchimp = require('@mailchimp/mailchimp_marketing');

const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
};

const mailchimpReady = process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_API_KEY !== 'your-mailchimp-api-key-here';
if (mailchimpReady) {
  mailchimp.setConfig({
    apiKey: process.env.MAILCHIMP_API_KEY,
    server: process.env.MAILCHIMP_SERVER_PREFIX || 'us1',
  });
}

const worker = new Worker('newsletterQueue', async job => {
  if (job.name === 'syncMailchimp') {
    const { email } = job.data;
    logger.info(`[Worker] Syncing ${email} to Mailchimp...`);

    if (mailchimpReady) {
      try {
        await mailchimp.lists.addListMember(process.env.MAILCHIMP_AUDIENCE_ID, {
          email_address: email,
          status: 'subscribed',
        });
        logger.info(`[Worker] Synced ${email} successfully.`);
      } catch (err) {
        if (err.status !== 400) {
          logger.error(`[Worker] Mailchimp integration failed for ${email}`, err);
          throw err; // Trigger standard retry logic
        } else {
          logger.info(`[Worker] ${email} already subscribed according to Mailchimp.`);
        }
      }
    } else {
      logger.warn('[Worker] Not syncing because MAILCHIMP_API_KEY is missing.');
    }
  }
}, { connection: redisOptions });

worker.on('completed', job => {
  logger.info(`[Worker] Job ${job.id} completed!`);
});

worker.on('failed', (job, err) => {
  logger.error(`[Worker] Job ${job.id} failed with ${err.message}`);
});

logger.info('🚀 BullMQ Worker Process listening for jobs on newsletterQueue...');
