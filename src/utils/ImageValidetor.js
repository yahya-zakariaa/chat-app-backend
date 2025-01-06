export const isValidImage = (avatar) => {
  const base64Regex = /^data:image\/(jpeg|png|jpg);base64,/;

  const urlRegex = /\.(jpg|jpeg|png)$/i;

  return base64Regex.test(avatar) || urlRegex.test(avatar);
};
