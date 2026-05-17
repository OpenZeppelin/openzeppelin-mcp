// lib/requestCounter.ts

// Use globalThis to persist counters across module reloads
const globalForCounters = globalThis as unknown as {
  statusCounters: Record<string, Record<string, number>> | undefined;
};

if (!globalForCounters.statusCounters) {
  globalForCounters.statusCounters = {};
}

const { statusCounters } = globalForCounters;

export function incrementCounter(route: string, statusCode?: number) {
  // Registers status of the response for the given route. If statusCode is undefined, it will not be counted.
  if (statusCode !== undefined) {
    if (!statusCounters[route]) {
      statusCounters[route] = {};
    }
    const status = statusCode.toString();
    if (statusCounters[route][status] === undefined) {
      statusCounters[route][status] = 0;
    }
    statusCounters[route][status] += 1;
  } else {
    console.log(`Error in counting requests for the ${route}`);
  }
}

export function getStatusCounters() {
  return statusCounters;
}
