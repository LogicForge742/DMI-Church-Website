/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.createTable('admins', {
    id: 'id',
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password: { type: 'varchar(255)', notNull: true },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createTable('events', {
    id: 'id',
    title: { type: 'varchar(255)', notNull: true },
    description: { type: 'text', notNull: true },
    date: { type: 'timestamp', notNull: true },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createTable('blogs', {
    id: 'id',
    title: { type: 'varchar(255)', notNull: true },
    content: { type: 'text', notNull: true },
    image: { type: 'varchar(1000)' },
    author: { type: 'varchar(255)' },
    tags: { type: 'varchar(500)' },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createTable('team_members', {
    id: 'id',
    name: { type: 'varchar(255)', notNull: true },
    title: { type: 'varchar(255)', notNull: true },
    image: { type: 'varchar(1000)' },
    bio: { type: 'text' },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createTable('media', {
    id: 'id',
    url: { type: 'varchar(1000)', notNull: true },
    type: { type: 'varchar(50)', notNull: true }, // 'video', 'audio', 'image'
    caption: { type: 'text' },
    filePath: { type: 'varchar(1000)', notNull: true },
    category: { type: 'varchar(255)' },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createTable('contact_messages', {
    id: 'id',
    name: { type: 'varchar(255)', notNull: true },
    email: { type: 'varchar(255)', notNull: true },
    subject: { type: 'varchar(500)', notNull: true },
    message: { type: 'text', notNull: true },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createTable('newsletter_subscribers', {
    email: { type: 'varchar(255)', unique: true, notNull: true, primaryKey: true },
    subscribed_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('newsletter_subscribers');
  pgm.dropTable('contact_messages');
  pgm.dropTable('media');
  pgm.dropTable('team_members');
  pgm.dropTable('blogs');
  pgm.dropTable('events');
  pgm.dropTable('admins');
};
