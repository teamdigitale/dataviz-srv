export function generatePin() {
  return Math.random().toString().substr(2, 6);
}
