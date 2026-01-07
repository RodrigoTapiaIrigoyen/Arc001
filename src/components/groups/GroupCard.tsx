import React from 'react';

export default function GroupCard({ group, onJoin, onView }) {
  return (
    <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0a0e1a] border border-blue-500/20 rounded-lg p-4 sm:p-6 hover:border-yellow-500/50 transition-all cursor-pointer overflow-hidden shadow-lg">
      <div className="flex items-center gap-4 mb-2">
        <img src={group.owner_avatar || '/default-avatar.png'} alt={group.owner_name} className="w-10 h-10 rounded-full border border-green-500/30" />
        <div>
          <div className="font-bold text-lg text-white">{group.title}</div>
          <div className="text-xs text-gray-400">Líder: {group.owner_name}</div>
        </div>
        <div className="ml-auto flex gap-2">
          {group.tags?.map((tag, i) => (
            <span key={i} className="px-2 py-1 bg-blue-700/30 rounded text-xs text-blue-300">#{tag}</span>
          ))}
        </div>
      </div>
      <div className="text-gray-300 text-sm mb-2 line-clamp-2">{group.description}</div>
      <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-2">
        <span>Modo: <b className="text-yellow-400">{group.mode}</b></span>
        <span>Nivel: <b className="text-yellow-400">{group.level}</b></span>
        <span>Idioma: <b className="text-yellow-400">{group.language}</b></span>
        <span>Miembros: <b className="text-yellow-400">{group.members?.length}/{group.max_members}</b></span>
        <span>Estado: <b className="text-green-400">{group.status}</b></span>
      </div>
      <div className="flex gap-2 mt-2">
        <button onClick={onJoin} className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-bold hover:from-green-600 hover:to-blue-600 transition-colors">Unirse</button>
        <button onClick={onView} className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-red-500 text-white rounded-lg font-bold hover:from-yellow-600 hover:to-red-600 transition-colors">Ver Grupo</button>
      </div>
    </div>
  );
}
