export const sortCursoTemasEItems = (temas) => {
  if (!temas) return;
  temas.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es', { numeric: true }));
  temas.forEach((t) => {
    if (!t.items) return;
    t.items.sort((a, b) => {
      const titleA = a.titulo || a.itemable?.titulo || a.resource?.titulo || a.nombre || '';
      const titleB = b.titulo || b.itemable?.titulo || b.resource?.titulo || b.nombre || '';
      return titleA.localeCompare(titleB, 'es', { numeric: true });
    });
  });
};
