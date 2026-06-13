async function main() {
  const { runScan } = await import('../server/src/services/scanner');
  const result = await runScan();
  console.log(`Scan complete: ${result.movies} movies, ${result.episodes} episodes processed`);
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
