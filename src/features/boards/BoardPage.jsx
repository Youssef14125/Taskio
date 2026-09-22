import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { supabase } from '../../lib/supabaseClient';
import ListColumn from './ListColumn';

function BoardPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();

  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [cardsByList, setCardsByList] = useState({});
  const [newListTitle, setNewListTitle] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchBoardData = useCallback(async () => {
    setLoading(true);

    const { data: boardData, error: boardError } = await supabase
      .from('boards')
      .select('*')
      .eq('id', boardId)
      .single();

    if (boardError) {
      console.error(boardError);
      setLoading(false);
      return;
    }
    setBoard(boardData);

    const { data: listsData, error: listsError } = await supabase
      .from('lists')
      .select('*')
      .eq('board_id', boardId)
      .order('position', { ascending: true });

    if (listsError) {
      console.error(listsError);
      setLoading(false);
      return;
    }
    setLists(listsData);

    const listIds = listsData.map((list) => list.id);

    if (listIds.length > 0) {
      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .in('list_id', listIds)
        .order('position', { ascending: true });

      if (cardsError) {
        console.error(cardsError);
      } else {
        const grouped = {};
        for (const listId of listIds) grouped[listId] = [];
        for (const card of cardsData) grouped[card.list_id].push(card);
        setCardsByList(grouped);
      }
    } else {
      setCardsByList({});
    }

    setLoading(false);
  }, [boardId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBoardData();
  }, [fetchBoardData]);

  // Realtime: refetch whenever lists or cards change, from any browser/tab.
  useEffect(() => {
    const channel = supabase
      .channel(`board-${boardId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lists', filter: `board_id=eq.${boardId}` },
        () => fetchBoardData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cards' },
        () => fetchBoardData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId, fetchBoardData]);

  async function handleAddList(e) {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    const position = lists.length;

    const { error } = await supabase
      .from('lists')
      .insert({ board_id: boardId, title: newListTitle, position });

    if (error) console.error(error);
    else {
      setNewListTitle('');
      fetchBoardData();
    }
  }

  async function handleRenameBoard() {
    const newName = window.prompt('Rename board', board.name);
    if (!newName || !newName.trim() || newName === board.name) return;

    const { error } = await supabase
      .from('boards')
      .update({ name: newName })
      .eq('id', board.id);

    if (error) console.error(error);
    else fetchBoardData();
  }

  async function handleDeleteBoard() {
    const confirmed = window.confirm(
      'Delete this board and everything in it? This cannot be undone.'
    );
    if (!confirmed) return;

    const { error } = await supabase.from('boards').delete().eq('id', board.id);
    if (error) console.error(error);
    else navigate('/');
  }

  async function persistCardPositions(cards, listId) {
    for (let i = 0; i < cards.length; i++) {
      await supabase
        .from('cards')
        .update({ position: i, list_id: listId })
        .eq('id', cards[i].id);
    }
  }

  async function persistListPositions(orderedLists) {
    for (let i = 0; i < orderedLists.length; i++) {
      await supabase.from('lists').update({ position: i }).eq('id', orderedLists[i].id);
    }
  }

  function onDragEnd(result) {
    const { source, destination, type } = result;
    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    if (type === 'list') {
      const reordered = Array.from(lists);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);
      setLists(reordered);
      persistListPositions(reordered);
      return;
    }

    // Card drag
    const sourceListId = source.droppableId;
    const destListId = destination.droppableId;

    const sourceCards = Array.from(cardsByList[sourceListId] || []);
    const [movedCard] = sourceCards.splice(source.index, 1);

    if (sourceListId === destListId) {
      sourceCards.splice(destination.index, 0, movedCard);
      setCardsByList((prev) => ({ ...prev, [sourceListId]: sourceCards }));
      persistCardPositions(sourceCards, sourceListId);
    } else {
      const destCards = Array.from(cardsByList[destListId] || []);
      destCards.splice(destination.index, 0, { ...movedCard, list_id: destListId });
      setCardsByList((prev) => ({
        ...prev,
        [sourceListId]: sourceCards,
        [destListId]: destCards,
      }));
      persistCardPositions(sourceCards, sourceListId);
      persistCardPositions(destCards, destListId);
    }
  }

  if (loading) return <p className="status-message">Loading board...</p>;
  if (!board) return <p className="status-message">Board not found.</p>;

  return (
    <main className="board-page">
      <Link className="back-link" to="/">&larr; Back to boards</Link>

      <div className="board-header">
        <div>
          <p className="eyebrow">Board</p>
          <h1 onClick={handleRenameBoard} title="Click to rename">
            {board.name}
          </h1>
        </div>
        <button className="button button-danger" onClick={handleDeleteBoard}>Delete board</button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="all-lists" direction="horizontal" type="list">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="lists-track"
            >
              {lists.map((list, index) => (
                <Draggable draggableId={list.id} index={index} key={list.id}>
                  {(dragProvided) => (
                    <div ref={dragProvided.innerRef} {...dragProvided.draggableProps}>
                      <ListColumn
                        list={list}
                        index={index}
                        cards={cardsByList[list.id] || []}
                        onChange={fetchBoardData}
                        dragHandleProps={dragProvided.dragHandleProps}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}

              <form className="add-list-form" onSubmit={handleAddList}>
                <input
                  placeholder="New list title"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                />
                <button className="button button-primary" type="submit">
                  Add list
                </button>
              </form>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </main>
  );
}

export default BoardPage;
