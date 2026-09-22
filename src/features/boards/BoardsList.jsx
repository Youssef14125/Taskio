import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

function BoardsList({ session }) {
  const [boards, setBoards] = useState([]);
  const [newBoardName, setNewBoardName] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchBoards = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    else setBoards(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBoards();
  }, [fetchBoards]);

  async function handleCreateBoard(e) {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    const { error } = await supabase
      .from('boards')
      .insert({ name: newBoardName, owner_id: session.user.id });

    if (error) console.error(error);
    else {
      setNewBoardName('');
      fetchBoards();
    }
  }

  async function handleDeleteBoard(boardId) {
    const confirmed = window.confirm(
      'Delete this board and everything in it? This cannot be undone.'
    );
    if (!confirmed) return;

    const { error } = await supabase.from('boards').delete().eq('id', boardId);
    if (error) console.error(error);
    else fetchBoards();
  }

  return (
    <main className="boards-shell">
      <div className="section-heading">
        <p className="eyebrow">Boards</p>
        <h1>Your boards</h1>
      </div>

      <form className="create-row" onSubmit={handleCreateBoard}>
        <input
          placeholder="New board name"
          value={newBoardName}
          onChange={(e) => setNewBoardName(e.target.value)}
        />
        <button className="button button-primary" type="submit">
          Create board
        </button>
      </form>

      {loading ? (
        <p className="status-message">Loading boards...</p>
      ) : boards.length === 0 ? (
        <p className="empty-state">No boards yet. Create your first one above.</p>
      ) : (
        <ul className="board-list">
          {boards.map((board) => (
            <li className="board-list-item" key={board.id}>
              <Link to={`/board/${board.id}`}>{board.name}</Link>
              <button className="button button-danger" onClick={() => handleDeleteBoard(board.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default BoardsList;
