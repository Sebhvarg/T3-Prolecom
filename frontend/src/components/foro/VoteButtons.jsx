import { useState } from 'react';
import PropTypes from 'prop-types';
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { foroService } from '../../api/foroService';

/**
 * Botones interactivos de Like y Dislike para respuestas.
 * Deshabilitado para el autor de la respuesta.
 */
const VoteButtons = ({ respuestaId, likesCount, dislikesCount, miVoto, isAuthor, onVoteSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [likes, setLikes] = useState(likesCount);
  const [dislikes, setDislikes] = useState(dislikesCount);
  const [userVote, setUserVote] = useState(miVoto);

  const handleVote = async (tipo) => {
    if (isAuthor || loading) return;

    setLoading(true);
    try {
      const res = await foroService.votarRespuesta(respuestaId, tipo);
      setLikes(res.likes_count);
      setDislikes(res.dislikes_count);
      setUserVote(res.mi_voto);

      if (onVoteSuccess) {
        onVoteSuccess(res);
      }
    } catch (err) {
      console.error('Error al votar:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200/80 rounded-xl p-1 shrink-0">
      {/* Botón Like */}
      <button
        type="button"
        onClick={() => handleVote('like')}
        disabled={isAuthor || loading}
        title={isAuthor ? 'No podés votar tu propia respuesta' : 'Me gusta esta respuesta'}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
          userVote === 'like'
            ? 'bg-emerald-500 text-white shadow-xs scale-105'
            : 'text-gray-600 hover:bg-gray-200/70 hover:text-emerald-700'
        } ${isAuthor ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {loading && userVote === 'like' ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <ThumbsUp size={13} className={userVote === 'like' ? 'fill-current' : ''} />
        )}
        <span>{likes}</span>
      </button>

      <div className="w-px h-3.5 bg-gray-300" />

      {/* Botón Dislike */}
      <button
        type="button"
        onClick={() => handleVote('dislike')}
        disabled={isAuthor || loading}
        title={isAuthor ? 'No podés votar tu propia respuesta' : 'No me gusta esta respuesta'}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
          userVote === 'dislike'
            ? 'bg-rose-500 text-white shadow-xs scale-105'
            : 'text-gray-600 hover:bg-gray-200/70 hover:text-rose-700'
        } ${isAuthor ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {loading && userVote === 'dislike' ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <ThumbsDown size={13} className={userVote === 'dislike' ? 'fill-current' : ''} />
        )}
        <span>{dislikes}</span>
      </button>
    </div>
  );
};

VoteButtons.propTypes = {
  respuestaId: PropTypes.number.isRequired,
  likesCount: PropTypes.number.isRequired,
  dislikesCount: PropTypes.number.isRequired,
  miVoto: PropTypes.string,
  isAuthor: PropTypes.bool,
  onVoteSuccess: PropTypes.func,
};

export default VoteButtons;
