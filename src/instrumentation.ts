export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { patchHttpServerForApiPerformance } = await import('@/shared/apiPerformanceInstrumentation');
    patchHttpServerForApiPerformance();
    const { startPendingSignupCleanup } = await import('@/platform/pendingSignupCleanup');
    startPendingSignupCleanup();
  }
}
