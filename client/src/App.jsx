import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import Login from './Login';
import io from 'socket.io-client';

// Connect to backend
const socket = io(import.meta.env.VITE_API_URL);

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [boardData, setBoardData] = useState(null);

  if (!token) {
    return <Login setToken={setToken} />;
  }

  // 1. Fetch Initial Data
  useEffect(() => {
    if (!token) return;

    async function fetchBoard() {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/board`, {
          headers: { Authorization: token } // <--- Send Token here
        });
        setBoardData(res.data);
        
        // Join the socket room for this specific board
        socket.emit('joinBoard', res.data._id); 
      } catch (err) {
        console.error("Error fetching board", err);
        // If token is invalid, logout
        if(err.response && err.response.status === 401) {
            localStorage.removeItem('token');
            setToken(null);
        }
      }
    }
    fetchBoard();

    socket.on('boardUpdated', (newBoard) => {
      setBoardData(newBoard);
    });

    return () => socket.off('boardUpdated');
  }, [token]);

  // 3. Handle Drag End
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return; // Dropped outside
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return; // Dropped in same place

    // Create a copy of the board state
    const newBoard = { ...boardData };

    // Find source and destination columns
    const startCol = newBoard.columns[source.droppableId];
    const finishCol = newBoard.columns[destination.droppableId];

    // Logic: Moving within the same list
    if (startCol === finishCol) {
      const newTaskIds = Array.from(startCol.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = { ...startCol, taskIds: newTaskIds };
      newBoard.columns = { ...newBoard.columns, [newColumn.id]: newColumn };
    } 
    // Logic: Moving from one list to another
    else {
      const startTaskIds = Array.from(startCol.taskIds);
      startTaskIds.splice(source.index, 1);
      const newStart = { ...startCol, taskIds: startTaskIds };

      const finishTaskIds = Array.from(finishCol.taskIds);
      finishTaskIds.splice(destination.index, 0, draggableId);
      const newFinish = { ...finishCol, taskIds: finishTaskIds };

      newBoard.columns = {
        ...newBoard.columns,
        [newStart.id]: newStart,
        [newFinish.id]: newFinish,
      };
    }

    // Optimistic Update (Update UI immediately)
    setBoardData(newBoard);

    // Send update to Server
    socket.emit('updateBoard', { boardId: newBoard._id, newBoardData: newBoard });
  };

  const addNewTask = (columnId) => {
    const content = window.prompt("What needs to be done?");
    if (!content) return;

    const newTaskId = uuidv4();
    const newTask = { id: newTaskId, content: content };

    // Update the board state
    const newBoard = {
      ...boardData,
      tasks: {
        ...boardData.tasks,
        [newTaskId]: newTask
      },
      columns: {
        ...boardData.columns,
        [columnId]: {
          ...boardData.columns[columnId],
          taskIds: [...boardData.columns[columnId].taskIds, newTaskId]
        }
      }
    };

    // Update Local UI & Server
    setBoardData(newBoard);
    socket.emit('updateBoard', { boardId: newBoard._id, newBoardData: newBoard });
  };

  if (!boardData) return <h2>Loading Board...</h2>;

  return (
    <div className="board-container">
      <button 
        onClick={() => {
          localStorage.removeItem('token');
          setToken(null);
        }}
        style={{ position: 'absolute', top: 10, right: 10, zIndex: 100 }}
      >
        Logout
      </button>
      <DragDropContext onDragEnd={onDragEnd}>
        {boardData.columnOrder.map((columnId) => {
          const column = boardData.columns[columnId];
          const tasks = column.taskIds.map((taskId) => boardData.tasks[taskId]);

          return (
            <div key={column.id} className="column">
              <h3 className="column-title">{column.title}</h3>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    className="task-list"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                          <div
                            className="task-card"
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            {task.content}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              <button 
                onClick={() => addNewTask(column.id)}
                style={{
                  marginTop: '10px',
                  padding: '8px',
                  cursor: 'pointer',
                  backgroundColor: '#091e420f',
                  border: 'none',
                  borderRadius: '3px'
                }}
              >
                + Add a card
              </button>
            </div>
          );
        })}
      </DragDropContext>
    </div>
  );
}

export default App;