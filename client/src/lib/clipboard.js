export async function copyToClipboard(value) {
  await navigator.clipboard.writeText(value);
}
