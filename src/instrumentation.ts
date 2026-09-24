export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { patchHttpServerForApiPerformance } = await import('./lib/apiPerformanceInstrumentation');
    patchHttpServerForApiPerformance();
    const { startPendingSignupCleanup } = await import('./lib/pendingSignupCleanup');
    startPendingSignupCleanup();
  }
}
