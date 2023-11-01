module.exports.updatesubscriptionstatusofuser = async (req, res) => {
  try {
    console.log('WebHook status: Hitted', req.body);
    res.status(200).send({ message: 'WebHook status: Hitted' });
  } catch (err) {
    console.log('Error hitting webhook', err);
    //   res.status(401).send({ message: 'Profile not updated', error: err.data.errors[0].source });
    res.status(401).send({ message: 'Error hitting webhook', error: err });
  }
};
