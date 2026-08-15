/**
 * Validates a material file for upload.
 * @param {File|null} file
 * @param {'video'|'documento'} materialTipo
 * @returns {string|null} Error message or null if valid
 */
export const validateMaterialFile = (file, materialTipo) => {
  if (!file) return 'Debes seleccionar un archivo para el material.';
  const fileName = file.name.toLowerCase();
  const isVideoType = materialTipo === 'video';

  if (isVideoType) {
    const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    if (!videoExts.some((ext) => fileName.endsWith(ext))) {
      return 'El archivo seleccionado debe ser un video válido (.mp4, .mov, .avi, .mkv, .webm).';
    }
  } else if (!fileName.endsWith('.pdf')) {
    return 'El archivo seleccionado para un documento debe ser estrictamente en formato PDF (.pdf).';
  }

  if (file.size > 500 * 1024 * 1024) {
    return 'El archivo seleccionado supera el límite máximo permitido de 500 MB.';
  }

  return null;
};
