export const executeAsyncAction = async ({
  action,
  setLoading,
  setError,
  setSuccess,
  successMessage,
  errorMessage,
  onSuccess,
}) => {
  if (setLoading) setLoading(true);
  if (setError) setError('');
  try {
    const res = await action();
    if (setSuccess && successMessage) {
      const msg = typeof successMessage === 'function' ? successMessage(res) : successMessage;
      setSuccess(msg);
    }
    if (onSuccess) onSuccess(res);
    return res;
  } catch (err) {
    console.error(err);
    if (setError) {
      const fallback = errorMessage || 'Ocurrió un error al procesar la solicitud.';
      const msg = err?.response?.data?.message || err?.message || fallback;
      setError(msg);
    }
  } finally {
    if (setLoading) setLoading(false);
  }
};
