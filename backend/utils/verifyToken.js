let _userId = '';

export async function setUserId(req, res) {
  try {
    const { userid } = req.body;
    _userId = userid;
    console.log('UserId salvo:', _userId);
    return res.status(200).json({ message: `UserId: ${_userId}` });
  } catch (error) {
    console.error('Erro ao salvar UserId:', error);
    return res.status(500).json({ message: 'Erro ao processar a solicitação.' });
  }
}

export function getUserId() {
  return _userId;
}
