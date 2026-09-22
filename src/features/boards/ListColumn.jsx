import { useState } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { supabase } from '../../lib/supabaseClient';

function ListColumn({ list, index, cards, onChange, dragHandleProps }) {
  const [newCardTitle, setNewCardTitle] = useState('');

  async function handleAddCard(e) {
    e.preventDefault();
    if (!newCardTitle.trim()) return;

    const position = cards.length;

    const { error } = await supabase
      .from('cards')
      .insert({ list_id: list.id, title: newCardTitle, position });

    if (error) console.error(error);
    else {
      setNewCardTitle('');
      onChange();
    }
  }

  async function handleDeleteCard(cardId) {
    const { error } = await supabase.from('cards').delete().eq('id', cardId);
    if (error) console.error(error);
    else onChange();
  }

  async function handleRenameList() {
    const newTitle = window.prompt('Rename list', list.title);
    if (!newTitle || !newTitle.trim() || newTitle === list.title) return;

    const { error } = await supabase
      .from('lists')
      .update({ title: newTitle })
      .eq('id', list.id);

    if (error) console.error(error);
    else onChange();
  }

  async function handleDeleteList() {
    const confirmed = window.confirm(
      `Delete "${list.title}" and all its cards? This cannot be undone.`
    );
    if (!confirmed) return;

    const { error } = await supabase.from('lists').delete().eq('id', list.id);
    if (error) console.error(error);
    else onChange();
  }

  return (
    <div className="list-column">
      <div {...dragHandleProps} className="list-header">
        <h3 onClick={handleRenameList} title="Click to rename">
          {list.title}
        </h3>
        <button className="button button-small button-danger" onClick={handleDeleteList}>
          Delete
        </button>
      </div>

      <Droppable droppableId={list.id} type="card">
        {(provided) => (
          <ul
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="card-list"
          >
            {cards.map((card, cardIndex) => (
              <Draggable draggableId={card.id} index={cardIndex} key={card.id}>
                {(dragProvided) => (
                  <li
                    className="task-card"
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    style={{
                      ...dragProvided.draggableProps.style,
                    }}
                  >
                    <span>{card.title}</span>
                    <button
                      className="icon-button"
                      aria-label={`Delete ${card.title}`}
                      onClick={() => handleDeleteCard(card.id)}
                    >
                      x
                    </button>
                  </li>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </ul>
        )}
      </Droppable>

      <form className="stack compact" onSubmit={handleAddCard}>
        <input
          placeholder="New card"
          value={newCardTitle}
          onChange={(e) => setNewCardTitle(e.target.value)}
        />
        <button className="button button-secondary" type="submit">
          Add card
        </button>
      </form>
    </div>
  );
}

export default ListColumn;
