import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import axios from 'axios';
import io from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import Login from './Login';

// Connect to backend (using Env Variable)
const socket = io(import.meta.env.VITE_API_URL);

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [boardData, setBoardData] = useState(null);

  // 1. ALL HOOKS MUST BE AT THE TOP (Before any return statement)
  useEffect(() => {
    if (!token) return;

    async function fetchBoard() {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/board`, {
          headers: { Authorization: token }
        });
        setBoardData(res.data);
        socket.emit('joinBoard', res.data._id);
      } catch (err) {
        console.error("Error fetching board", err);
        if (err.response && err.response.status === 401) {
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

  // 2. Helper Functions
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    const newBoard = { ...boardData };
    const startCol = newBoard.columns[source.droppableId];
    const finishCol = newBoard.columns[destination.droppableId];

    if (startCol === finishCol) {
      const newTaskIds = Array.from(startCol.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);
      const newColumn = { ...startCol, taskIds: newTaskIds };
      newBoard.columns = { ...newBoard.columns, [newColumn.id]: newColumn };
    } else {
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

    setBoardData(newBoard);
    socket.emit('updateBoard', { boardId: newBoard._id, newBoardData: newBoard });
  };

  const addNewTask = (columnId) => {
    const content = window.prompt("What needs to be done?");
    if (!content) return;

    const newTaskId = uuidv4();
    const newTask = { id: newTaskId, content: content };

    const newBoard = {
      ...boardData,
      tasks: { ...boardData.tasks, [newTaskId]: newTask },
      columns: {
        ...boardData.columns,
        [columnId]: {
          ...boardData.columns[columnId],
          taskIds: [...boardData.columns[columnId].taskIds, newTaskId]
        }
      }
    };

    setBoardData(newBoard);
    socket.emit('updateBoard', { boardId: newBoard._id, newBoardData: newBoard });
  };

  const deleteTask = (taskId, columnId) => {
    if(!window.confirm("Delete this task?")) return;

    const newBoard = { ...boardData };
    const column = newBoard.columns[columnId];
    const newTaskIds = column.taskIds.filter(id => id !== taskId);
    
    newBoard.columns = {
      ...newBoard.columns,
      [columnId]: { ...column, taskIds: newTaskIds }
    };
    delete newBoard.tasks[taskId];

    setBoardData(newBoard);
    socket.emit('updateBoard', { boardId: newBoard._id, newBoardData: newBoard });
  };

  // 3. CONDITIONAL RENDERING (Happens AFTER all hooks)
  if (!token) {
    return <Login setToken={setToken} />;
  }

  if (!boardData) {
    return (
      <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>
        <h2>Loading Board...</h2>
      </div>
    );
  }

  // 4. Main Render
  return (
    <>
      {/* Logout Button */}
      <button 
        onClick={() => {
          localStorage.removeItem('token');
          setToken(null);
          window.location.reload(); 
        }}
        style={{ position: 'absolute', top: 10, right: 10, zIndex: 100, padding: '5px 10px', cursor: 'pointer' }}
      >
        Logout
      </button>

      <div className="board-container">
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
                              style={{
                                userSelect: "none",
                                padding: 16,
                                margin: "0 0 8px 0",
                                minHeight: "50px",
                                backgroundColor: "white",
                                color: "black",
                                display: "flex",
                                justifyContent: "space-between", 
                                alignItems: "center",
                                ...provided.draggableProps.style
                              }}
                            >
                              <span>{task.content}</span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteTask(task.id, column.id);
                                }}
                                style={{
                                  background: 'red',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '20px',
                                  height: '20px',
                                  cursor: 'pointer',
                                  fontSize: '10px',
                                  marginLeft: '10px'
                                }}
                              >
                                X
                              </button>
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
                    borderRadius: '3px',
                    width: '100%'
                  }}
                >
                  + Add a card
                </button>
              </div>
            );
          })}
        </DragDropContext>
      </div>
    </>
  );
}

export default App;