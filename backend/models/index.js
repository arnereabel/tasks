const { Sequelize, DataTypes } = require('sequelize');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DATABASE_PATH || './data/tasks.db',
  logging: false
});

// Job Model
const Job = sequelize.define('Job', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  hal: DataTypes.STRING,
  plaats: DataTypes.STRING,
  fase: DataTypes.STRING,
  tekMerk: DataTypes.STRING,
  priority: {
    type: DataTypes.STRING,
    defaultValue: 'normal'
  },
  polDag: DataTypes.STRING,
  prtDag: DataTypes.STRING,
  prt: DataTypes.STRING,
  pl: DataTypes.STRING,
  metr: DataTypes.STRING,
  remarks: DataTypes.TEXT
}, {
  timestamps: true
});

// Task Model
const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  jobId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Job,
      key: 'id'
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  assignedTo: DataTypes.STRING,
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'in-progress', 'completed']]
    }
  }
}, {
  timestamps: true
});

// Photo Model
const Photo = sequelize.define('Photo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  taskId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Task,
      key: 'id'
    }
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originalName: DataTypes.STRING,
  caption: DataTypes.TEXT,
  path: DataTypes.STRING
}, {
  timestamps: true
});

// Note Model
const Note = sequelize.define('Note', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  taskId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Task,
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  timestamps: true
});

// Define relationships
Job.hasMany(Task, { foreignKey: 'jobId', onDelete: 'CASCADE' });
Task.belongsTo(Job, { foreignKey: 'jobId' });

Task.hasMany(Photo, { foreignKey: 'taskId', onDelete: 'CASCADE' });
Photo.belongsTo(Task, { foreignKey: 'taskId' });

Task.hasMany(Note, { foreignKey: 'taskId', onDelete: 'CASCADE' });
Note.belongsTo(Task, { foreignKey: 'taskId' });

module.exports = {
  sequelize,
  Job,
  Task,
  Photo,
  Note
};
