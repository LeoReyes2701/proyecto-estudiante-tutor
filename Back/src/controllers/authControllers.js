exports.login = (req, res) => {
  const { email, password } = req.body;

  // Por ahora, solo responder con lo que llega CONFIRMA que lleguen los datos
  res.json({
    message: "Datos recibidos",
    email,
    password
  });
};
