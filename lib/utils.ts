export function generatePin() {
  return Math.random().toString().slice(2, 8);
}
