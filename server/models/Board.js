const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, default: 'My Project Board' },
  columns: {
    type: Map, // flexible structure for columns
    of: new mongoose.Schema({
      id: String,
      title: String,
      taskIds: [String] // Array of card IDs in order
    })
  },
  tasks: {
    type: Map, // flexible structure for tasks
    of: new mongoose.Schema({
      id: String,
      content: String
    })
  },
  columnOrder: [String] // Keeps track of column order (e.g., ["todo", "inprogress", "done"])
});

module.exports = mongoose.model('Board', boardSchema);